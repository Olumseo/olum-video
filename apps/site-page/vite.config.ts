import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// `base` is the URL prefix this app is served from.
//
// On olum.ai it lives under /video/welcome/ (olum.ai's nginx proxies that path
// to this app's container). Vite writes absolute asset URLs into index.html, so
// without that base the HTML would ask for "/assets/index-<hash>.js" — the ROOT
// of olum.ai, which is the main SPA's asset folder, not ours.
//
// On Vercel it is its own site, served from the domain root, so the base is
// "/". Vercel sets VERCEL=1 during its builds. VITE_BASE overrides both.
//
// Everything else follows automatically: the router's basename, asset and media
// URLs, and the email link's return address all come from import.meta.env.BASE_URL.
const base = process.env.VITE_BASE ?? (process.env.VERCEL ? "/" : "/video/welcome/");

export default defineConfig({
  base,
  plugins: [react()],
  server: {
    port: 5202,
    // The API is same-origin in production (nginx proxies /api to the gateway),
    // so the dev server proxies it too. Session cookies are set for one origin
    // and are not sent to another — a cross-origin dev setup breaks auth in
    // development only, which is a miserable bug to chase.
    proxy: {
      "/api": {
        // video-service's `./dev.sh run` port; override with VITE_API_PROXY.
        target: process.env.VITE_API_PROXY ?? "http://localhost:8098",
        changeOrigin: true,
      },
    },
  },
});

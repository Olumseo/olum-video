import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// `base` is the URL prefix this app is served from in production.
//
// Vite writes absolute asset URLs into index.html. Without a base, the HTML
// asks for "/assets/index-<hash>.js" — meaning the ROOT of olum.ai, which is
// the main SPA's asset folder, not ours. The page would load and then fail to
// fetch its own JavaScript. Setting base makes it request
// "/video/" + "assets/..." instead, which is where the files actually are.
//
// This value must match the nginx location block AND the router basename.
export default defineConfig({
  base: "/video/",
  plugins: [react()],
  server: {
    port: 5200,
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

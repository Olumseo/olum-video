/**
 * Where the sign-up form's API lives.
 *
 * On olum.ai the page and the API share one origin, so the path is relative
 * and VITE_API_URL stays unset. On Vercel the page is its own site, so
 * VITE_API_URL names the API's origin (e.g. https://olum.ai) — HTTPS, since a
 * browser blocks http:// calls from an https:// page. That origin must allow
 * this site in CORS (video-service's CORS_ALLOWED_ORIGINS, or the gateway's
 * ALLOWED_ORIGINS when it sits in front).
 */
const origin = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");

export const SIGNUPS_API = `${origin}/api/v1/video/public/signups`;

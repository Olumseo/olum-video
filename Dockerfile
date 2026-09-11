# ─────────────────────────────────────────────────────────────────────────────
#  olum.video frontends — build all three, serve them from one nginx.
#
#  This image is SEPARATE from olum.ai's frontend image on purpose. The two
#  live in different repos, so a single Docker build context cannot reach both.
#  Keeping them separate also means shipping a video-frontend change does not
#  rebuild or redeploy olum.ai's SPA — which is the point of having split the
#  repos in the first place.
#
#  olum.ai's nginx proxies /video/ and /staff/ here. The browser only ever
#  talks to olum.ai, so session cookies stay same-origin.
# ─────────────────────────────────────────────────────────────────────────────

FROM node:20-alpine AS build
WORKDIR /app

# Copy manifests first. Docker caches each layer by the files it reads, so
# dependencies are only re-installed when a package.json actually changes —
# not on every source edit.
COPY package.json package-lock.json ./
COPY apps/client-web/package.json      apps/client-web/
COPY apps/site-page/package.json       apps/site-page/
COPY apps/staff-portal/package.json    apps/staff-portal/
COPY packages/api-client/package.json  packages/api-client/
COPY packages/ui/package.json          packages/ui/
COPY packages/tsconfig/package.json    packages/tsconfig/
COPY packages/eslint-config/package.json packages/eslint-config/

# `npm ci` installs exactly what package-lock.json pins and fails if the lock
# is out of sync — the property that makes a build reproducible. `npm install`
# would silently resolve newer versions inside the image.
RUN npm ci

COPY . .
RUN npm run build

# ─── serve ───────────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine

# Each app lands under the path its `base` was built for. These MUST agree with
# vite.config.ts and with the location blocks in nginx.conf, or the app loads
# and then 404s fetching its own JavaScript.
COPY --from=build /app/apps/client-web/dist   /usr/share/nginx/html/video
COPY --from=build /app/apps/site-page/dist    /usr/share/nginx/html/video/welcome
COPY --from=build /app/apps/staff-portal/dist /usr/share/nginx/html/staff

COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80

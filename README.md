# olum-video

Turborepo holding the **three frontends** for olum.video.

> **Status: feature-complete against fixtures.** Three working apps with
> routing, session gating, DPoP auth, and every screen built. They run on mock
> data until video-service has endpoints — set `VITE_API_MODE=http` to switch.

The **backend** is Go and lives in the existing backend monorepo at
`codebase/olum-backend/olum-backend/video-service` — it reuses the shared RDS,
Redis, Kafka, CI and deploy path, and the `payment-service` template.

## Layout

```
apps/
  client-web      :5200  clients submit, review, request changes, approve
  staff-portal    :5201  ONE app for both staff roles, gated by staff_role
  site-page       :5202  logged-in entry point served under olum.ai
packages/
  api-client             GENERATED from the backend's OpenAPI spec
  ui                     design tokens + Tailwind preset + shared components
  tsconfig               shared TS configs
  eslint-config          shared flat ESLint config
```

### Why one staff portal, not two

The editor portal and the assignee portal authenticate as the same people
against the same `staff` table, work the same ticket queue, and differ only in
which rows they see. `staff_role` already models editor as a *role*, not an
*identity*. Two apps would mean two builds and two deploys for one difference
that a route guard expresses in a line.

## Getting started

```bash
cp .env.example .env    # optional; defaults are fine
npm install
npm run dev             # all three apps
npm run build
npm run typecheck
npm run lint
npm run test
```

Run one app: `npm run dev -w @olum-video/client-web`

| App | Dev URL |
|---|---|
| client-web | http://localhost:5200/video/ |
| staff-portal | http://localhost:5201/staff/ |
| site-page | http://localhost:5202/video/welcome/ |

The path suffix is required — each app is built for the prefix it is served
from in production, and the dev server honours the same prefix.

## Uploads

Files never pass through video-service. The flow is three steps:

1. `api.requestUpload(...)` → a short-lived pre-signed URL
2. `api.uploadFile(...)` → **PUT straight to storage**, with progress
3. `api.attachVersion(...)` → tell our API the upload landed

Step 2 skips our server deliberately: streaming a 500MB file through a Go
handler holds a connection and a slab of memory for the whole upload, which is
how a small service falls over under any real concurrency.

The real implementation uses `XMLHttpRequest`, not `fetch` — fetch still cannot
report *upload* progress in any browser, and a large upload with no progress
bar looks frozen, so users cancel it.

## The two things worth understanding

### 1. Types are generated, never hand-written

The backend is Go and the frontends are TypeScript, so types **cannot be shared
as source** — only generated:

```
Go structs → openapi/openapi.yaml → packages/api-client/src/generated → apps
```

Hand-writing TS interfaces to mirror Go structs has one fatal property:
*nothing fails when they drift.* No compiler checks one against the other.

`src/generated/` is committed **and** regenerated in CI; a mismatch fails the
build. That check is what makes this a contract rather than documentation.

```bash
npm run generate -w @olum-video/api-client    # after any backend API change
npm run check:drift -w @olum-video/api-client # what CI runs
```

### 2. The design tokens are a copy, not a dependency

`packages/ui/src/tokens.css` holds olum.ai's palette and type stacks, copied by
hand from `olum-frontend/frontend/src/index.css` on 2026-09-08. That repo is
separate and we do not modify it, so this is a **one-way copy**: if olum.ai
changes its brand colour, this will not follow.

We have a *matching* design system, not a shared one. Know the difference.

Every token is a CSS custom property so both consumers read one declaration —
plain CSS via `var(--ink)`, Tailwind via `packages/ui/tailwind-preset.js`.
Repeating hex values in the Tailwind config would create the second source of
truth this structure exists to prevent.

## How these reach olum.ai in production

Each app is served under its own URL prefix:

| App | URL | Built with `base` |
|---|---|---|
| `client-web` | `olum.ai/video` | `/video/` |
| `site-page` | `olum.ai/video/welcome` | `/video/welcome/` |
| `staff-portal` | `olum.ai/staff` | `/staff/` |

All three ship in **one container** (`Dockerfile` + `nginx.conf` at the repo
root), pushed to ECR by `.github/workflows/build-deploy.yml`. olum.ai's own
nginx **proxies** `/video` and `/staff` to it.

Proxying, not redirecting — the browser only ever talks to `olum.ai`, so the
httpOnly session cookie is sent with these requests and `/api` stays
same-origin. A redirect to another host would break both.

### Three values that must agree

For each app: Vite's `base`, the router `basename`, and the nginx `location`.
If they disagree the app loads and then fails to fetch its own JavaScript.

`basename` is derived from `import.meta.env.BASE_URL` in `main.tsx` rather than
hardcoded, so two of the three can never drift apart.

### Server-side pieces not in this repo

- `/opt/olum/deploy-video-frontend.sh` on the EC2 instance (mirror the existing
  `deploy-frontend.sh`).
- The `video_frontend` service merged into the server's compose file — see
  `deploy/docker-compose.video-frontend.yml`. **It must be on the
  `seoolum_network`**, or nginx cannot resolve the hostname and returns 502.

## Running against the real API

```bash
VITE_API_MODE=http npm run dev    # once video-service has endpoints
```

Defaults to `mock`. While mocked, every authenticated screen shows an
unmissable banner — demoing fixtures while believing they are live data is how
wrong decisions get made.

## Auth

There is deliberately **no login form here.** Sign-in happens on olum.ai's own
pages, which own the Firebase flow and the token exchange; these apps only
consume the resulting httpOnly session cookie. A second implementation of the
trickiest security path in the product is not something to own twice.

`packages/api-client/src/dpop.ts` signs a DPoP proof per request (RFC 9449).
**Its three IndexedDB constants must match olum-frontend's `lib/dpop.ts`
exactly** — same origin means shared IndexedDB, so a different key id would
silently generate a SECOND device key, and every proof would carry a thumbprint
that does not match the token's `cnf.jkt`. Every request would 401 with no
visible cause.

## Conventions

- A component earns a place in `packages/ui` on its **second** use. Extracting
  something used once costs indirection and buys nothing.
- Never import from `api-client/src/generated/*` — ESLint blocks it. Import
  from `@olum-video/api-client`.
- The session token is an httpOnly cookie; JS cannot read it. Requests need
  `credentials: "include"`, and the dev server proxies `/api` so the cookie
  stays same-origin in development.
# olum-video

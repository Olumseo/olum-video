# @olum-video/api-client

The **only** place a frontend learns the shape of the API.

## Why this package exists

The backend is Go and the frontends are TypeScript, so types cannot be *shared*
as source — they have to be **generated**. The chain is:

```
Go handlers/structs  →  openapi/openapi.yaml  →  src/generated/schema.d.ts  →  apps
```

The alternative — hand-writing TS interfaces that mirror the Go structs — has one
fatal property: **nothing fails when they drift.** No compiler checks a Go struct
against a TypeScript interface. You would find out in production.

## The drift check is the point

`src/generated/` is committed to the repo *and* regenerated in CI. If the
regenerated output differs from what is committed, CI fails.

That single check is what turns this from documentation into a contract: a
backend change that breaks a frontend now breaks the build, in the same PR,
before it ships.

## Usage

```bash
npm run generate     # after any backend API change — commit the result
npm run check:drift  # what CI runs
```

Never hand-edit `src/generated/`. ESLint blocks importing from it directly —
import from `@olum-video/api-client` so the wrapper stays the seam.

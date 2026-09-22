# Running the frontend against the real backend

By default the apps run on fixtures (`VITE_API_MODE=mock`) and show an orange
"sample data" banner. This is how to point them at the live Go service instead.

---

## The one awkward part, explained first

video-service checks **two** things on every request:

1. an `access_token` cookie, signed by authservice
2. a **DPoP proof** signed by a key your browser generated and cannot export

The token carries `cnf.jkt` — the fingerprint of that browser key — and the two
must match. That is what makes a stolen cookie useless.

In production this is invisible: the user signs in on olum.ai and authservice
sets the cookie. **Locally there is no authservice**, so you mint a token
yourself — and because of the binding above, it has to be minted *for the key
your browser already has*.

Hence the three steps below. It is a one-time setup per browser.

---

## Step 1 — backend running

```bash
cd /f/olum.ai/codebase/olum-backend/olum-backend/video-service
./dev.sh up
./dev.sh run          # leave this terminal running
```

## Step 2 — frontend pointed at it

The dev server proxies `/api` to `localhost:8000` by default, which is the
Python gateway — not us. Override it, and switch off the mock:

```bash
cd /f/olum.ai/codebase/olum_videos

VITE_API_MODE=http VITE_API_PROXY=http://localhost:8098 \
  npm run dev -w @olum-video/client-web
```

Open <http://localhost:5200/video/>.

You will see **"Please sign in"** — correct so far. The orange sample-data
banner should be gone, which proves the app is now talking to the real API.

## Step 3 — mint yourself a session

**3a. Get your browser's key fingerprint.** With the app open, press F12 and in
the Console run:

```js
await __olumThumbprint()
```

Copy the string it prints. (That helper only exists in dev builds — the
bundler strips it from production.)

**3b. Mint a token bound to it:**

```bash
cd /f/olum.ai/codebase/olum-backend/olum-backend/video-service
go run ./cmd/devtoken -jkt "<the-string-you-copied>"
```

It prints a `document.cookie = ...` line.

**3c. Paste that line into the browser console**, then reload.

You will now see **"Video isn't on your plan yet"** — progress. You are
authenticated; you just have no entitlement.

## Step 4 — grant yourself access

```bash
cd /f/olum.ai/codebase/olum-backend/olum-backend/video-service
./dev.sh grant 33333333-3333-3333-3333-333333333333
```

(That uuid is `devtoken`'s default user. Pass `-user <uuid>` to both commands
if you want a different one — they must match.)

Reload. The app now shows **real data from Postgres**, with an empty video
list. Create one and watch it appear in the database.

---

## Checking it is really live

```bash
cd /f/olum.ai/codebase/olum-backend/olum-backend/video-service
./dev.sh psql
```

```sql
SELECT title, status, regens_used FROM video.video ORDER BY created_at DESC;
```

If a video you created in the browser is listed there, the whole chain is
working: browser → vite proxy → Go service → Postgres.

---

## What will not work locally, and why

| Feature | Why |
|---|---|
| **Uploads** | `S3_BUCKET` is unset, so `/uploads` answers 503. Set it plus AWS credentials, or run MinIO with `S3_ENDPOINT`. |
| **Video playback** | Playback URLs are pre-signed S3 GETs. No bucket, no URL — the player shows its "still producing" state. |
| **Staff portal** | `/staff/*` needs a row in `video.staff`. See below. |
| **Automatic entitlements** | In production authservice pushes these from its billing webhook. There is no gateway locally, so use `./dev.sh grant`. |

### Making yourself staff

```bash
./dev.sh psql
```

```sql
INSERT INTO video.staff (user_id, display_name)
VALUES ('33333333-3333-3333-3333-333333333333', 'Dev Staff');

INSERT INTO video.staff_role (staff_id, role)
SELECT id, 'editor' FROM video.staff
 WHERE user_id = '33333333-3333-3333-3333-333333333333';
```

Then the staff portal works with the same cookie:

```bash
VITE_API_MODE=http VITE_API_PROXY=http://localhost:8098 \
  npm run dev -w @olum-video/staff-portal
```

at <http://localhost:5201/staff/>.

> The same browser profile shares the DPoP key across both apps — they are on
> different ports in dev, so you may need to repeat step 3 for each origin.
> In production both live under `olum.ai`, so the key really is shared.

---

## Troubleshooting

**Anything 401s — start with the server log.** It names the failed check:

```
"msg":"request authentication failed","reason":"access token rejected: expired (mint a new one)"
```

| reason | what to do |
|---|---|
| `expired` | redo step 3 — tokens last 30 days |
| `cnf.jkt mismatch` | the browser regenerated its key (cleared site data, different profile, incognito). Redo step 3 |
| `no access token` | the cookie is not being sent — check it was set on `localhost:5200`, not `:8098`, with `path=/` |
| `no DPoP proof header` | the app is not signing — you are probably still on mocks |
| `JWT_SECRET_KEY does not match` | `devtoken` and the server disagree on the secret |
| `htu does not match` | `PUBLIC_BASE_URL` is wrong for this origin |

**401s only in the browser, but curl works.** The cookie is not being sent.
Check it was set on the right origin (`localhost:5200`, not `localhost:8098`)
and that `path=/` is present.

**403 "not on your plan".** Authentication succeeded; you skipped step 4, or
granted a different uuid than the token's `sub`.

**Screens are empty but no error.** You are probably still on mocks. Confirm
`VITE_API_MODE=http` was on the same line as `npm run dev` — exporting it in a
different shell does nothing.

**Connection refused to the database.** The WSL IP changed (it does on reboot).
`./dev.sh up` re-resolves it; just run it again.

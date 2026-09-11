// DPoP (RFC 9449) client — sender-constrained authentication.
//
// A non-extractable ECDSA P-256 key pair is generated once and kept in
// IndexedDB. Because the private key is non-extractable, even an XSS payload
// cannot exfiltrate it, so a stolen access token or cookie is useless from any
// other browser.
//
// ─── WHY THESE THREE CONSTANTS MUST NOT CHANGE ──────────────────────────────
// These apps are served from olum.ai (/video, /staff), which is the SAME ORIGIN
// as the main olum.ai SPA — and IndexedDB is scoped per origin. So this reads
// the key the main app already created when the user logged in.
//
// Using a different DB name, store, or key id would silently generate a SECOND
// key. The access token was bound to the FIRST one (cnf.jkt), so every proof we
// signed would carry the wrong thumbprint and the server would reject every
// authenticated request — with no clue why. Keep these identical to
// olum-frontend/frontend/src/lib/dpop.ts.
const DB_NAME = "olum-dpop";
const STORE = "keys";
const KEY_ID = "payment-key";

// ── base64url helpers ───────────────────────────────────────────────────────
function b64url(bytes: BufferSource): string {
  const b =
    bytes instanceof Uint8Array
      ? bytes
      : ArrayBuffer.isView(bytes)
        ? new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength)
        : new Uint8Array(bytes as ArrayBuffer);
  let s = "";
  for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]!);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function utf8(s: string): BufferSource {
  return new TextEncoder().encode(s) as unknown as BufferSource;
}

// ── IndexedDB persistence of the (non-extractable) key pair ─────────────────
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function idbGet(db: IDBDatabase, key: string): Promise<CryptoKeyPair | undefined> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const r = tx.objectStore(STORE).get(key);
    r.onsuccess = () => resolve(r.result as CryptoKeyPair | undefined);
    r.onerror = () => reject(r.error);
  });
}

function idbPut(db: IDBDatabase, key: string, val: CryptoKeyPair): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(val, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

let cached: Promise<CryptoKeyPair> | null = null;

/** The persistent device key pair, generated on first use. */
export function getKeyPair(): Promise<CryptoKeyPair> {
  if (cached) return cached;
  cached = (async () => {
    const db = await openDB();
    const existing = await idbGet(db, KEY_ID);
    if (existing) return existing;
    // extractable=false → the private key can never be exported by JS.
    const pair = await crypto.subtle.generateKey(
      { name: "ECDSA", namedCurve: "P-256" },
      false,
      ["sign", "verify"],
    );
    await idbPut(db, KEY_ID, pair);
    return pair;
  })();
  return cached;
}

async function publicJwk(pair: CryptoKeyPair) {
  const jwk = await crypto.subtle.exportKey("jwk", pair.publicKey);
  return { kty: "EC", crv: "P-256", x: jwk.x as string, y: jwk.y as string };
}

/** RFC 7638 SHA-256 thumbprint of the device public key (base64url). */
export async function thumbprint(): Promise<string> {
  const pair = await getKeyPair();
  const j = await publicJwk(pair);
  // Canonical form: the RFC requires the members in lexicographic order with
  // no whitespace. JSON.stringify would not guarantee either, and a different
  // byte sequence produces a different hash — which would not match the
  // server's cnf.jkt.
  const canonical = `{"crv":"${j.crv}","kty":"${j.kty}","x":"${j.x}","y":"${j.y}"}`;
  return b64url(await crypto.subtle.digest("SHA-256", utf8(canonical)));
}

function randomJti(): string {
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  return b64url(b);
}

/**
 * Builds a DPoP proof JWT for one HTTP request.
 *
 * A proof is single-use: `jti` is random per call and the server remembers it,
 * so proofs must never be cached or reused across requests.
 */
export async function createProof(htm: string, htu: string, accessToken?: string): Promise<string> {
  const pair = await getKeyPair();
  const jwk = await publicJwk(pair);

  const header = { typ: "dpop+jwt", alg: "ES256", jwk };
  const payload: Record<string, unknown> = {
    htm: htm.toUpperCase(),
    htu,
    iat: Math.floor(Date.now() / 1000),
    jti: randomJti(),
  };
  if (accessToken) {
    payload.ath = b64url(await crypto.subtle.digest("SHA-256", utf8(accessToken)));
  }

  const signingInput = `${b64url(utf8(JSON.stringify(header)))}.${b64url(utf8(JSON.stringify(payload)))}`;
  const sig = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    pair.privateKey,
    utf8(signingInput),
  );
  // WebCrypto ECDSA returns raw r||s, which is exactly the JOSE ES256 format.
  return `${signingInput}.${b64url(sig)}`;
}

/** A { DPoP } header object for the given request. */
export async function dpopHeader(
  htm: string,
  htu: string,
  accessToken?: string,
): Promise<Record<string, string>> {
  return { DPoP: await createProof(htm, htu, accessToken) };
}

/**
 * Best-effort proof for a same-origin request.
 *
 * Returns `{}` rather than throwing when the device cannot produce one (old
 * browser, blocked IndexedDB, private mode). Only token-minting endpoints want
 * this: there, a missing proof means "issue an unbound token", so a proof
 * failure must degrade the binding rather than break the request. Ordinary API
 * calls should use dpopFetch, which lets the failure surface.
 */
export async function dpopHeaderSafe(htm: string, url: string): Promise<Record<string, string>> {
  try {
    return await dpopHeader(htm, new URL(url, window.location.origin).href);
  } catch {
    return {};
  }
}

/**
 * fetch with a fresh DPoP proof attached.
 *
 * `credentials: "include"` is required, not optional: the session token lives
 * in an httpOnly cookie that JavaScript cannot read, so it can only travel if
 * the browser attaches it.
 */
export async function dpopFetch(
  input: string,
  init: RequestInit = {},
  accessToken?: string,
): Promise<Response> {
  const method = (init.method ?? "GET").toUpperCase();
  const url = new URL(input, window.location.origin).href;
  const proof = await dpopHeader(method, url, accessToken);

  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string> | undefined),
    ...proof,
  };
  if (accessToken) headers["Authorization"] = `DPoP ${accessToken}`;

  return fetch(input, { ...init, credentials: "include", headers });
}

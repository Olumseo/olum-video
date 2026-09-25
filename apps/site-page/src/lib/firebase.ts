/**
 * Firebase, for the sign-up form only: it proves the visitor's phone (an SMS
 * code) and email (a sign-in link). Each proof becomes an ID token for
 * video-service; the site never keeps a Firebase session.
 *
 * ISOLATED FROM olum.ai'S OWN FIREBASE SESSION
 * --------------------------------------------
 * This page is served on olum.ai's origin (olum.ai/video/welcome) and uses
 * olum.ai's Firebase project. olum.ai's frontend signs its users in on the
 * DEFAULT Firebase app with the default (IndexedDB) persistence — so if this
 * page used the default app too, the two would share one stored session, and
 * signing out here would sign an olum.ai user out.
 *
 * So, exactly like olum.ai's "Get a demo" form (lib/firebaseDemoPhone.ts in
 * olum-frontend): a SEPARATE, named Firebase app with IN-MEMORY persistence.
 * Nothing is written to the browser's storage, nothing survives a reload, and
 * olum.ai's session is never read, replaced or signed out.
 *
 * SAME PROJECT AND SAME VARIABLES AS olum.ai
 * ------------------------------------------
 * The config comes from the same VITE_FIREBASE_* variables olum-frontend uses,
 * so production points both apps at one Firebase project. Set them as build
 * args on the site-page image.
 *
 * LOCAL DEVELOPMENT NEEDS NOTHING
 * -------------------------------
 * In `vite dev` with no VITE_FIREBASE_API_KEY, this falls back to the Firebase
 * Auth EMULATOR with the demo project "demo-olum-video" — no real project, no
 * keys, nothing sent. Start it with `npm run firebase:emulator` at the repo
 * root; SMS codes and email links then appear at http://localhost:4000/auth.
 * The fallback cannot happen in a production build: `import.meta.env.DEV` is
 * false there, and a build without the variables disables sign-up instead.
 */

import { getApp, getApps, initializeApp } from "firebase/app";
import {
  connectAuthEmulator,
  getAuth,
  inMemoryPersistence,
  initializeAuth,
  type Auth,
} from "firebase/auth";

/** Never "[DEFAULT]" — that app is olum.ai's. */
const APP_NAME = "olum-video-signup";

const env = import.meta.env;
const useEmulator = env.DEV && (!env.VITE_FIREBASE_API_KEY || !!env.VITE_FIREBASE_AUTH_EMULATOR);

const config = useEmulator
  ? {
      apiKey: "demo-api-key",
      authDomain: "demo-olum-video.firebaseapp.com",
      projectId: "demo-olum-video",
    }
  : {
      apiKey: env.VITE_FIREBASE_API_KEY,
      authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: env.VITE_FIREBASE_PROJECT_ID,
      appId: env.VITE_FIREBASE_APP_ID,
    };

/** False in a build that was not given its Firebase variables. */
export const firebaseConfigured = Boolean(config.apiKey);

/** True when talking to the local emulator — the form shows where codes land. */
export const firebaseEmulator = useEmulator;

let auth: Auth | null = null;

/** The Auth instance, created on first use so the rest of the site never pays for it. */
export function firebaseAuth(): Auth {
  if (!firebaseConfigured) throw new Error("Sign-up is not configured on this site yet.");
  if (!auth) {
    const app = getApps().some((a) => a.name === APP_NAME)
      ? getApp(APP_NAME)
      : initializeApp(config, APP_NAME);
    let created = false;
    try {
      auth = initializeAuth(app, { persistence: inMemoryPersistence });
      created = true;
    } catch {
      // Already initialised (Vite HMR) — getAuth returns that same instance.
      auth = getAuth(app);
    }
    if (useEmulator) {
      // Connect once: a second connect on an instance already in use throws.
      if (created) {
        connectAuthEmulator(auth, env.VITE_FIREBASE_AUTH_EMULATOR || "http://127.0.0.1:9099", {
          disableWarnings: true,
        });
      }
      // The emulator does not check reCAPTCHA; skipping it keeps local tests
      // free of Google's widget. Never set outside the emulator.
      auth.settings.appVerificationDisabledForTesting = true;
    }
  }
  return auth;
}

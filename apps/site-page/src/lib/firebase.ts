/**
 * Firebase, for the sign-up form only: it proves the visitor's phone (an SMS
 * code) and email (a sign-in link). The site never keeps a Firebase session —
 * each proof becomes an ID token for video-service, then we sign out.
 *
 * SAME PROJECT AND SAME VARIABLES AS olum.ai
 * ------------------------------------------
 * The config comes from the same VITE_FIREBASE_* variables olum-frontend uses
 * (see src/lib/firebase.ts there), so production points both apps at one
 * Firebase project. Set them as build args on the site-page image.
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

import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { connectAuthEmulator, getAuth, type Auth } from "firebase/auth";

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

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

/** The Auth instance, created on first use so the rest of the site never pays for it. */
export function firebaseAuth(): Auth {
  if (!firebaseConfigured) throw new Error("Sign-up is not configured on this site yet.");
  if (!auth) {
    app = getApps().length ? getApp() : initializeApp(config);
    auth = getAuth(app);
    if (useEmulator) {
      connectAuthEmulator(auth, env.VITE_FIREBASE_AUTH_EMULATOR || "http://127.0.0.1:9099", {
        disableWarnings: true,
      });
      // The emulator does not check reCAPTCHA; skipping it keeps local tests
      // free of Google's widget. Never set outside the emulator.
      auth.settings.appVerificationDisabledForTesting = true;
    }
  }
  return auth;
}

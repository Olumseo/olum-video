/**
 * Every Firebase call the sign-up form makes, in one module.
 *
 * Loaded with a dynamic import() from the form, never statically: Firebase
 * Auth is a sizeable library, and only a visitor who actually starts signing
 * up should download it — not everyone reading the home page.
 *
 * Each proof ends with signOut(). We only want the ID token that proves the
 * phone or email; keeping a Firebase session in the visitor's browser would
 * be a login to olum.ai's Firebase project they never asked for.
 */

import {
  RecaptchaVerifier,
  isSignInWithEmailLink,
  sendSignInLinkToEmail,
  signInWithEmailLink,
  signInWithPhoneNumber,
  signOut,
  type ConfirmationResult,
} from "firebase/auth";

import { firebaseAuth, firebaseEmulator } from "./firebase";

export { firebaseEmulator };

let verifier: RecaptchaVerifier | null = null;

/**
 * Texts a code to `phone` (international form, e.g. +919876543210).
 *
 * `anchor` is an element the invisible reCAPTCHA attaches to — Firebase needs
 * it to tell a person from a script before it spends an SMS. A fresh verifier
 * per send, because a used one cannot be reused.
 */
export async function sendPhoneCode(phone: string, anchor: HTMLElement): Promise<ConfirmationResult> {
  const auth = firebaseAuth();
  verifier?.clear();
  verifier = new RecaptchaVerifier(auth, anchor, { size: "invisible" });
  return signInWithPhoneNumber(auth, phone, verifier);
}

/** Checks the typed code; returns the ID token proving the phone. */
export async function confirmPhoneCode(confirmation: ConfirmationResult, code: string): Promise<string> {
  const cred = await confirmation.confirm(code);
  const token = await cred.user.getIdToken();
  await signOut(firebaseAuth());
  return token;
}

/** Emails a sign-in link that brings the visitor back to `returnTo`. */
export async function sendEmailLink(email: string, returnTo: string): Promise<void> {
  await sendSignInLinkToEmail(firebaseAuth(), email, { url: returnTo, handleCodeInApp: true });
}

export function isEmailLink(href: string): boolean {
  return isSignInWithEmailLink(firebaseAuth(), href);
}

/** Completes the link; returns the ID token proving the email. */
export async function confirmEmailLink(email: string, href: string): Promise<string> {
  const cred = await signInWithEmailLink(firebaseAuth(), email, href);
  const token = await cred.user.getIdToken();
  await signOut(firebaseAuth());
  return token;
}

/** Firebase error codes, in words a visitor can act on. */
export function explain(err: unknown): string {
  const code = (err as { code?: string })?.code ?? "";
  switch (code) {
    case "auth/invalid-verification-code":
      return "That code isn't right. Check the text and try again.";
    case "auth/code-expired":
      return "That code has expired. Send a new one.";
    case "auth/too-many-requests":
      return "Too many tries from this device. Please wait a little and try again.";
    case "auth/invalid-phone-number":
      return "That phone number doesn't look right.";
    case "auth/invalid-action-code":
    case "auth/expired-action-code":
      return "That email link has expired or was already used. Start again to get a new one.";
    case "auth/operation-not-allowed":
      return "Phone or email sign-in isn't switched on for this site yet.";
    default:
      return err instanceof Error ? err.message : "Something went wrong. Please try again.";
  }
}

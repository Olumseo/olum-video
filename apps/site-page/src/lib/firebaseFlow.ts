/**
 * Every Firebase call the sign-up form makes, in one module.
 *
 * Loaded with a dynamic import() from the form, never statically: Firebase
 * Auth is a sizeable library, and only a visitor who actually starts signing
 * up should download it — not everyone reading the home page.
 *
 * EACH PROOF IS THROWN AWAY AFTER USE
 * -----------------------------------
 * Proving a phone or an email with Firebase signs the visitor in, and signing
 * in with a phone or email Firebase has not seen CREATES a Firebase user.
 * olum.ai signs its users up in the same Firebase project — with
 * createUserWithEmailAndPassword, and linkWithPhoneNumber for the mobile
 * step — and both fail with "already in use" when another Firebase user holds
 * that email or number. So a user this form created must not outlive the form:
 * discard() deletes it — but ONLY a user this flow just created
 * (isNewUser). If the phone or email already belongs to an olum.ai account,
 * that account is left exactly as it was.
 *
 * Call discard() AFTER video-service has the token: the Firebase emulator
 * checks the user still exists when a token is verified.
 */

import {
  RecaptchaVerifier,
  deleteUser,
  getAdditionalUserInfo,
  isSignInWithEmailLink,
  sendSignInLinkToEmail,
  signInWithEmailLink,
  signInWithPhoneNumber,
  signOut,
  type ConfirmationResult,
  type UserCredential,
} from "firebase/auth";

import { firebaseAuth, firebaseEmulator } from "./firebase";

export { firebaseEmulator };

/** An ID token proving a phone or an email, and how to clean up after it. */
export type Proof = {
  token: string;
  /** Delete the Firebase user if this flow created it, then sign out. Never throws. */
  discard: () => Promise<void>;
};

async function proofFrom(cred: UserCredential): Promise<Proof> {
  const token = await cred.user.getIdToken();
  const createdHere = getAdditionalUserInfo(cred)?.isNewUser === true;
  return {
    token,
    discard: async () => {
      if (createdHere) {
        try {
          await deleteUser(cred.user);
        } catch {
          // Best effort: e.g. user deletion switched off in the project.
        }
      }
      try {
        await signOut(firebaseAuth());
      } catch {
        /* in-memory only — nothing to clean */
      }
    },
  };
}

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

/** Checks the typed code; returns the proof of the phone. */
export async function confirmPhoneCode(confirmation: ConfirmationResult, code: string): Promise<Proof> {
  return proofFrom(await confirmation.confirm(code));
}

/** Emails a sign-in link that brings the visitor back to `returnTo`. */
export async function sendEmailLink(email: string, returnTo: string): Promise<void> {
  await sendSignInLinkToEmail(firebaseAuth(), email, { url: returnTo, handleCodeInApp: true });
}

export function isEmailLink(href: string): boolean {
  return isSignInWithEmailLink(firebaseAuth(), href);
}

/** Completes the link; returns the proof of the email. */
export async function confirmEmailLink(email: string, href: string): Promise<Proof> {
  return proofFrom(await signInWithEmailLink(firebaseAuth(), email, href));
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

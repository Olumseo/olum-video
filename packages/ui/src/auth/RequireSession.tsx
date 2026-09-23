import type { ReactNode } from "react";

import { DevSignIn } from "./DevSignIn";
import { useSession } from "./useSession";
import { LoadingRows } from "../components/States";

/**
 * Gate that renders children only for a signed-in, entitled viewer.
 *
 * `signInUrl` and `upgradeUrl` are plain URLs on olum.ai, reached with a real
 * navigation rather than a router redirect: those pages belong to a different
 * application, and a client-side redirect would look for a route that does not
 * exist in this bundle.
 */
export function RequireSession({
  children,
  requires = "client",
  signInUrl = "/",
  upgradeUrl = "/video/welcome/pricing",
}: {
  children: ReactNode;
  /**
   * What this app needs beyond a session.
   *
   * "client" — a video subscription. The customer app.
   * "staff"  — a staff record. The portal.
   *
   * These are genuinely different, and treating them as one is what locked
   * agency staff out: an agency's owner has a staff row and no subscription,
   * so the subscription check told them to buy the product they are employed
   * to operate.
   */
  requires?: "client" | "staff";
  signInUrl?: string;
  upgradeUrl?: string;
}) {
  const session = useSession();

  if (session.status === "loading") {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12">
        <LoadingRows rows={3} />
      </div>
    );
  }

  if (session.status === "unauthenticated") {
    // On a laptop there is no authservice to send them to, so "Go to sign in"
    // is a dead link and the app cannot be opened at all. Offer the seeded
    // users instead.
    //
    // `import.meta.env.DEV` is a compile-time constant: a production build
    // evaluates it to false and the bundler drops DevSignIn entirely, so this
    // is absent rather than merely hidden.
    if (import.meta.env.DEV) {
      return <DevSignIn />;
    }
    return (
      <Gate
        heading="Please sign in"
        body="You need to be signed in to your olum account to use the video product."
        actionLabel="Go to sign in"
        href={signInUrl}
      />
    );
  }

  if (session.status === "forbidden") {
    // Deliberately NOT a sign-in prompt. This viewer is already signed in;
    // sending them to sign in again would loop them with no way forward.
    return (
      <Gate
        heading="Video isn't on your plan yet"
        body={session.reason}
        actionLabel="See plans"
        href={upgradeUrl}
      />
    );
  }

  if (requires === "staff" && !session.staff) {
    // Signed in, but does not work here. NOT an upsell — buying a
    // subscription would not grant portal access, so offering one would send
    // them somewhere that cannot help.
    return (
      <Gate
        heading="This is the staff portal"
        body="Your account isn't on a team. If you were sent an invite link, open that instead."
        actionLabel="Go to olum.video"
        href="/video/"
      />
    );
  }

  if (requires === "client" && !session.account) {
    return (
      <Gate
        heading="Video isn't on your plan yet"
        body="Add the video product to your olum account to get started."
        actionLabel="See plans"
        href={upgradeUrl}
      />
    );
  }

  return <>{children}</>;
}

function Gate({
  heading,
  body,
  actionLabel,
  href,
}: {
  heading: string;
  body: string;
  actionLabel: string;
  href: string;
}) {
  return (
    <div className="mx-auto max-w-md px-6 py-24 text-center">
      <h1 className="font-serif text-2xl">{heading}</h1>
      <p className="mt-3 text-sm text-muted">{body}</p>
      <a
        href={href}
        className="mt-6 inline-block rounded bg-ink px-5 py-2.5 text-sm text-paper transition-colors hover:bg-accent-2"
      >
        {actionLabel}
      </a>
    </div>
  );
}

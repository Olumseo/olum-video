/**
 * Accepting a team invitation.
 *
 * # WHY THIS PAGE IS OUTSIDE THE SIGN-IN GATE
 *
 * The person holding the link has no olum account yet, or has one and is not
 * signed in on this device. Putting the page behind the gate would show them a
 * wall before telling them what they were invited to — and "sign in to find
 * out why you should sign in" is how invites get ignored.
 *
 * So the page describes the invitation first, from a public endpoint that
 * returns only the agency name, the position and the role. No email, no
 * inviter, nothing identifying. Then it asks them to sign in.
 *
 * # WHY THEY SET THEIR OWN PASSWORD
 *
 * The alternative was for the agency owner to type one for them. That needs an
 * endpoint on authservice we do not own, it means the owner knows everybody's
 * credentials, and it makes this service a second place passwords live. Here
 * they use olum's normal sign-in, and we attach the account they already have.
 */

import { useEffect, useState } from "react";
import { api, type InvitePreview } from "@olum-video/api-client";

export default function Join() {
  const token = new URLSearchParams(window.location.search).get("token") ?? "";

  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [dead, setDead] = useState(false);

  const [name, setName] = useState("");
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!token) {
      setDead(true);
      setLoading(false);
      return;
    }
    api
      .peekInvite(token)
      .then((p) => !cancelled && setPreview(p))
      .catch(() => !cancelled && setDead(true))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function accept() {
    setProblem(null);
    setJoining(true);
    try {
      await api.acceptInvite(token, name.trim());
      setJoined(true);
    } catch (err) {
      setProblem(
        err instanceof Error
          ? err.message
          : "We couldn't add you to the team. The link may have expired.",
      );
    } finally {
      setJoining(false);
    }
  }

  return (
    <div className="min-h-screen bg-paper text-ink">
      <div className="mx-auto max-w-lg px-6 py-20">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
          olum.video
        </p>

        {loading && <div className="mt-8 h-40 rounded-panel bg-warm/50" />}

        {!loading && dead && (
          <div className="mt-8">
            <h1 className="font-serif text-[clamp(1.6rem,4vw,2.2rem)] leading-tight">
              This link doesn&rsquo;t work any more.
            </h1>
            <p className="mt-4 text-[14px] leading-relaxed text-muted">
              Invitations expire after a week, and each one can only be used once. Ask
              whoever invited you to send a new one.
            </p>
          </div>
        )}

        {!loading && preview && !joined && (
          <div className="mt-8 overflow-hidden rounded-panel bg-panel px-7 py-9 text-paper sm:px-9">
            <span aria-hidden className="mb-7 block h-px w-full bg-spectrum opacity-70" />

            <h1 className="font-serif text-[clamp(1.5rem,3.6vw,2.1rem)] leading-tight">
              Join {preview.agency_name}
            </h1>
            <p className="mt-3 text-[14px] leading-relaxed text-paper/70">
              You&rsquo;ve been invited as{" "}
              <span className="text-paper">{preview.position || preview.role}</span>. You
              sign in with your own olum account &mdash; nobody else sets or sees your
              password.
            </p>

            <label className="mt-7 block">
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-paper/55">
                Your name
              </span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Sarah Okonkwo"
                className="mt-2 w-full rounded-[12px] border border-paper/20 bg-paper/[0.06] px-4 py-2.5 text-[14px] text-paper placeholder:text-paper/30 focus:border-paper/45 focus:outline-none"
              />
              <span className="mt-2 block text-[12px] text-paper/45">
                How you&rsquo;ll appear to the rest of the team.
              </span>
            </label>

            <button
              onClick={accept}
              disabled={joining || name.trim() === ""}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-paper px-6 py-3 text-sm text-ink transition-opacity duration-300 ease-luxe hover:opacity-90 disabled:opacity-40"
            >
              {joining ? "Joining…" : "Join the team"}
              <span aria-hidden>&rarr;</span>
            </button>

            {problem && (
              <p className="mt-5 rounded-[12px] bg-flare/15 px-4 py-3 text-[13px] leading-relaxed text-paper">
                {problem}
                {/* The most likely cause by far, and not obvious: they are
                    signed in as a different account that is already staff
                    somewhere. Saying so beats "something went wrong". */}
              </p>
            )}
          </div>
        )}

        {joined && preview && (
          <div className="mt-8">
            <h1 className="font-serif text-[clamp(1.6rem,4vw,2.2rem)] leading-tight">
              You&rsquo;re on the {preview.agency_name} team.
            </h1>
            <p className="mt-4 text-[14px] leading-relaxed text-muted">
              You&rsquo;ll see that agency&rsquo;s clients and nothing else.
            </p>
            <a
              href="/staff/"
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm text-paper transition-colors duration-500 ease-luxe hover:bg-accent-2"
            >
              Go to the portal
              <span aria-hidden>&rarr;</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

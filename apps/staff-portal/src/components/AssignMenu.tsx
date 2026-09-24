/**
 * Hand a ticket to someone.
 *
 * # WHY IT SHOWS WORKLOAD
 *
 * A bare list of names makes assignment a guess, and guessing concentrates on
 * whoever comes first alphabetically. The counts come back from the same call
 * as the names — one query, not one per editor — so "who is free" is answerable
 * without leaving the screen.
 *
 * # WHY THE LIST IS LOADED BY THE PAGE, NOT BY EACH ROW
 *
 * A queue of sixty tickets, each fetching its own editor list, is sixty
 * identical requests on mount. The page loads it once and passes it down; this
 * component owns only the open/closed state and the request that actually
 * changes something.
 */

import { useState } from "react";
import { api, type EditorWorkload } from "@olum-video/api-client";

export function AssignMenu({
  ticketId,
  assigneeName,
  editors,
  onAssigned,
}: {
  ticketId: string;
  assigneeName: string | null;
  editors: EditorWorkload[];
  onAssigned: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  async function assign(staffId: string) {
    setProblem(null);
    setBusy(true);
    try {
      await api.assignTicket(ticketId, staffId);
      setOpen(false);
      onAssigned();
    } catch (err) {
      setProblem(err instanceof Error ? err.message : "That didn't work.");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className={`shrink-0 rounded-full border px-3 py-1.5 text-[12px] transition-colors duration-300 ease-luxe ${
          assigneeName
            ? "border-subtle text-muted hover:border-ink/30 hover:text-ink"
            : "border-flare-ink/30 text-flare-ink hover:border-flare-ink/60"
        }`}
      >
        {assigneeName ?? "Assign"}
      </button>
    );
  }

  return (
    <div className="w-full shrink-0 rounded-card border border-subtle bg-cream/50 p-3 sm:w-72">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
          Hand it to
        </span>
        <button
          onClick={() => setOpen(false)}
          className="text-[12px] text-muted transition-colors hover:text-ink"
        >
          Close
        </button>
      </div>

      {editors.length === 0 ? (
        // Not an error. An agency with no editors yet is the ordinary state on
        // day one, and it has an obvious next action.
        <p className="mt-3 text-[12px] leading-relaxed text-muted">
          Nobody on your team has the editor role yet. Add one from{" "}
          <a href="/staff/team" className="text-ink underline decoration-subtle underline-offset-2">
            the team page
          </a>
          .
        </p>
      ) : (
        <ul className="mt-2 space-y-1">
          {editors.map((e) => (
            <li key={e.staff_id}>
              <button
                disabled={busy}
                onClick={() => assign(e.staff_id)}
                // Explicit label. The name is inside nested spans with the
                // workload badge, and an accessibility tree read of this menu
                // came back with unnamed buttons — a screen reader user would
                // hear "button, button, button".
                aria-label={`Assign to ${e.name}${e.position ? `, ${e.position}` : ""}`}
                className="flex w-full items-center justify-between gap-3 rounded-[10px] px-2.5 py-2 text-left transition-colors hover:bg-paper disabled:opacity-40"
              >
                <span className="min-w-0">
                  <span className="block truncate text-[13px] text-ink">{e.name}</span>
                  {e.position && (
                    <span className="block truncate text-[11px] text-muted">{e.position}</span>
                  )}
                </span>
                <Load open={e.open} inFlight={e.in_flight} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {assigneeName && (
        <button
          disabled={busy}
          // "" is the API's way of saying unassign — the server nulls the
          // assignee and puts the ticket back to open.
          onClick={() => assign("")}
          className="mt-2 w-full rounded-[10px] px-2.5 py-2 text-left text-[12px] text-muted transition-colors hover:bg-paper hover:text-danger-ink disabled:opacity-40"
        >
          Put it back in the queue
        </button>
      )}

      {problem && <p className="mt-2 text-[12px] text-danger-ink">{problem}</p>}
    </div>
  );
}

/** How loaded somebody already is, as one glanceable figure. */
function Load({ open, inFlight }: { open: number; inFlight: number }) {
  const total = open + inFlight;
  return (
    <span
      title={`${inFlight} in progress, ${open} not started`}
      className={`shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] ${
        total === 0
          ? "bg-teal/12 text-teal-ink"
          : total > 4
            ? "bg-flare/15 text-flare-ink"
            : "bg-ink/[0.06] text-muted"
      }`}
    >
      {total === 0 ? "free" : `${total} on`}
    </span>
  );
}

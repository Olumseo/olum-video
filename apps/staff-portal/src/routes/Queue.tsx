import { api, type EditorWorkload, type Ticket } from "@olum-video/api-client";
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  LoadingRows,
  relativeTime,
  type Tone,
} from "@olum-video/ui";

import { useAsync } from "../lib/useAsync";
import { AssignMenu } from "../components/AssignMenu";

const TYPE_LABEL: Record<string, string> = {
  script: "Script",
  avatar: "Avatar",
  voice: "Voice",
  video_gen: "Generate",
  edit: "Edit",
  issue: "Issue",
};

const STATUS_TONE: Record<string, Tone> = {
  open: "attention",
  in_progress: "progress",
  blocked: "bad",
  done: "good",
  canceled: "neutral",
};

export default function Queue() {
  const { data, error, loading, retry } = useAsync(() => api.listTickets());

  // Loaded once for the whole page and passed down. Sixty rows each fetching
  // their own copy is sixty identical requests on mount.
  //
  // A failure is swallowed: an empty list makes the menu say "nobody has the
  // editor role yet", which is the same thing a reader needs to do about it,
  // and an error bar over the queue because a dropdown could not load would
  // be worse than the missing dropdown.
  const editors = useAsync(() => api.listEditors().catch((): EditorWorkload[] => []));

  if (loading) return <LoadingRows rows={4} />;
  if (error) return <ErrorState message={error} onRetry={retry} />;
  if (!data?.length) {
    return <EmptyState heading="Queue is clear" body="No open tickets assigned to you." />;
  }

  // Priority 1 is most urgent, so ascending. Ties break by age — the oldest
  // ticket at a given priority has been waiting longest.
  const sorted = [...data].sort(
    (a, b) => a.priority - b.priority || Date.parse(a.created_at) - Date.parse(b.created_at),
  );

  return (
    <div>
      <h1 className="font-serif text-3xl">Work queue</h1>
      <p className="mt-1 text-sm text-muted">{sorted.length} open · most urgent first</p>
      <div className="mt-6 space-y-3">
        {sorted.map((ticket) => (
          <TicketRow
            key={ticket.id}
            ticket={ticket}
            editors={editors.data ?? []}
            onAssigned={retry}
          />
        ))}
      </div>
    </div>
  );
}

function TicketRow({
  ticket,
  editors,
  onAssigned,
}: {
  ticket: Ticket;
  editors: EditorWorkload[];
  onAssigned: () => void;
}) {
  // A due date in the past is a breach, not a countdown. It gets the loud
  // treatment so it cannot be scrolled past.
  const overdue = ticket.sla_due_at != null && Date.parse(ticket.sla_due_at) < Date.now();

  return (
    <Card className={overdue ? "border-danger/40" : ""}>
      <div className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-muted">P{ticket.priority}</span>
            <Badge>{TYPE_LABEL[ticket.type] ?? ticket.type}</Badge>
            <Badge tone={STATUS_TONE[ticket.status] ?? "neutral"}>{ticket.status}</Badge>
          </div>
          <p className="mt-2 line-clamp-2 text-sm sm:truncate">{ticket.subject_title}</p>
          <p className="mt-1 font-mono text-xs text-muted">
            {ticket.client_name} · opened {relativeTime(ticket.created_at)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 sm:justify-end">
          {ticket.sla_due_at && (
            <span
              className={`whitespace-nowrap font-mono text-xs ${overdue ? "text-danger-ink" : "text-muted"}`}
            >
              {overdue ? "overdue " : "due "}
              {relativeTime(ticket.sla_due_at)}
            </span>
          )}
          {/* Assignment is the action this screen exists for, so it is a
              control rather than a line of text saying "unassigned". */}
          <AssignMenu
            ticketId={ticket.id}
            assigneeName={ticket.assignee_name}
            editors={editors}
            onAssigned={onAssigned}
          />
        </div>
      </div>
    </Card>
  );
}

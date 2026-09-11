import { api, type Ticket } from "@olum-video/api-client";
import { Badge, Card, EmptyState, ErrorState, LoadingRows, relativeTime, type Tone } from "@olum-video/ui";

import { useAsync } from "../lib/useAsync";

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
      <p className="mt-1 text-sm text-muted">
        {sorted.length} open · most urgent first
      </p>
      <div className="mt-6 space-y-3">
        {sorted.map((ticket) => (
          <TicketRow key={ticket.id} ticket={ticket} />
        ))}
      </div>
    </div>
  );
}

function TicketRow({ ticket }: { ticket: Ticket }) {
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
            {ticket.assignee_name ? ` · ${ticket.assignee_name}` : " · unassigned"}
          </p>
        </div>
        {ticket.sla_due_at && (
          <span className={`whitespace-nowrap font-mono text-xs ${overdue ? "text-danger" : "text-muted"}`}>
            {overdue ? "overdue " : "due "}
            {relativeTime(ticket.sla_due_at)}
          </span>
        )}
      </div>
    </Card>
  );
}

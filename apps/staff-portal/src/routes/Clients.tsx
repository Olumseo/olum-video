import { api } from "@olum-video/api-client";
import { Badge, Card, ErrorState, LoadingRows, type Tone } from "@olum-video/ui";

import { useAsync } from "../lib/useAsync";

const STATUS_TONE: Record<string, Tone> = {
  active: "good",
  suspended: "attention",
  closed: "neutral",
};

export default function Clients() {
  const { data, error, loading, retry } = useAsync(() => api.listClients());

  if (loading) return <LoadingRows rows={4} />;
  if (error) return <ErrorState message={error} onRetry={retry} />;

  return (
    <div>
      <h1 className="font-serif text-3xl">Clients</h1>
      <p className="mt-1 text-sm text-muted">{data?.length ?? 0} accounts assigned to you</p>

      <Card className="mt-6 overflow-hidden">
        {/* Tables overflow on narrow screens. Scrolling the table inside its
            own container keeps the PAGE from scrolling sideways. */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-subtle text-left">
                <Th>Client</Th>
                <Th>Plan</Th>
                <Th>In flight</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {data?.map((client) => (
                <tr key={client.id} className="border-b border-subtle last:border-0">
                  <td className="px-5 py-3.5">
                    <p>{client.name}</p>
                    <p className="font-mono text-xs text-muted">{client.email}</p>
                  </td>
                  <td className="px-5 py-3.5 text-muted">{client.plan}</td>
                  <td className="px-5 py-3.5 font-mono">{client.videos_in_flight}</td>
                  <td className="px-5 py-3.5">
                    <Badge tone={STATUS_TONE[client.status] ?? "neutral"}>{client.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-5 py-3 font-mono text-xs font-normal uppercase tracking-widest text-muted">
      {children}
    </th>
  );
}

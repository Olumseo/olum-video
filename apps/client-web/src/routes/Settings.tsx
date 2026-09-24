import { Link } from "react-router-dom";
import { api } from "@olum-video/api-client";
import {
  Badge,
  Card,
  CardBody,
  CardHeader,
  ErrorState,
  LoadingRows,
  type Tone,
} from "@olum-video/ui";

import { useAsync } from "../lib/useAsync";
import { AgencyCard } from "../components/AgencyCard";

const ASSET_TONE: Record<string, Tone> = {
  ready: "good",
  training: "progress",
  failed: "bad",
};

export default function Settings() {
  const account = useAsync(() => api.getAccount());
  const entitlement = useAsync(() => api.getEntitlement());
  // Tolerant of a failure: a customer who is not staff gets a 403 here, which
  // is the ordinary case, not an error worth showing.
  const agency = useAsync(() => api.getMyAgency().catch(() => ({ agency: null })));

  if (account.loading || entitlement.loading) return <LoadingRows rows={3} />;
  if (account.error) return <ErrorState message={account.error} onRetry={account.retry} />;
  if (!account.data) return null;

  const { data } = account;
  const plan = entitlement.data;

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="font-serif text-3xl">Settings</h1>

      <AgencyCard agency={agency.data?.agency ?? null} onChanged={agency.retry} />

      <Card>
        <CardHeader>
          <h2 className="text-sm text-ink">Account</h2>
        </CardHeader>
        <CardBody className="space-y-3">
          <Row label="Name" value={data.name} />
          <Row label="Email" value={data.email} />
          {/* Timezone is not cosmetic: the daily video allowance resets at
              midnight in THIS zone, so it decides when quota comes back. */}
          <Row label="Timezone" value={data.timezone} hint="Your daily allowance resets at midnight here." />
        </CardBody>
      </Card>

      {plan && (
        <Card>
          <CardHeader>
            <h2 className="text-sm text-ink">Plan</h2>
          </CardHeader>
          <CardBody className="space-y-3">
            <Row
              label="Product"
              value={plan.product === "ultimate" ? "Ultimate" : "Premium Video"}
            />
            <Row
              label="Today"
              value={`${plan.videos_used_today} of ${plan.daily_video_limit} videos used`}
            />
          </CardBody>
        </Card>
      )}

      {/* Read-only on purpose. Requesting a twin and sending a recording both
          live in Setup — one home per action, so nobody has to guess which of
          two screens holds the button they want. */}
      <Card>
        <CardHeader>
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-sm text-ink">Your digital twin</h2>
            <Link
              to="/setup"
              className="link-underline font-mono text-xs text-muted transition-colors hover:text-ink"
            >
              Manage in Setup →
            </Link>
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          <AssetList title="Avatars" items={data.avatars} />
          <AssetList title="Voices" items={data.voices} />
        </CardBody>
      </Card>
    </div>
  );
}

function Row({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-6">
      <div>
        <span className="text-sm text-muted">{label}</span>
        {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
      </div>
      <span className="text-right text-sm">{value}</span>
    </div>
  );
}

function AssetList({
  title,
  items,
}: {
  title: string;
  items: { id: string; name: string; status: string }[];
}) {
  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-widest text-muted">{title}</p>
      <div className="mt-2 space-y-2">
        {items.length === 0 && <p className="text-sm text-muted">None yet.</p>}
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-4">
            <span className="text-sm">{item.name}</span>
            <Badge tone={ASSET_TONE[item.status] ?? "neutral"}>{item.status}</Badge>
          </div>
        ))}
      </div>
    </div>
  );
}

import { useState } from "react";
import { api } from "@olum-video/api-client";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  ErrorState,
  FileUpload,
  LoadingRows,
  UploadProgress,
  type Tone,
} from "@olum-video/ui";

import { useAsync } from "../lib/useAsync";

const ASSET_TONE: Record<string, Tone> = {
  ready: "good",
  training: "progress",
  failed: "bad",
};

export default function Settings() {
  const account = useAsync(() => api.getAccount());
  const entitlement = useAsync(() => api.getEntitlement());

  if (account.loading || entitlement.loading) return <LoadingRows rows={3} />;
  if (account.error) return <ErrorState message={account.error} onRetry={account.retry} />;
  if (!account.data) return null;

  const { data } = account;
  const plan = entitlement.data;

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="font-serif text-3xl">Settings</h1>

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

      <Card>
        <CardHeader>
          <h2 className="text-sm text-ink">Your digital twin</h2>
        </CardHeader>
        <CardBody className="space-y-4">
          <AssetList title="Avatars" items={data.avatars} />
          <AssetList title="Voices" items={data.voices} />
          <p className="text-xs text-muted">
            Adding or replacing a twin needs a new consent recording. Your account manager will
            walk you through it.
          </p>
          <AvatarSourceUpload />
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
        {hint && <p className="mt-0.5 text-xs text-muted/80">{hint}</p>}
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


/**
 * Uploads the consent/source recording a digital twin is built from.
 *
 * The client uploads here; an employee downloads it and creates the twin in
 * HeyGen's web UI by hand. There is no API call to HeyGen anywhere in this
 * flow — which is exactly why the file has to land somewhere a person can
 * fetch it from.
 */
function AvatarSourceUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [percent, setPercent] = useState(0);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      const ticket = await api.requestUpload({
        filename: file.name,
        content_type: file.type,
        size_bytes: file.size,
        purpose: "avatar_source",
      });
      await api.uploadFile(ticket, file, setPercent);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="rounded border border-success/30 bg-success/5 px-4 py-3">
        <p className="text-sm text-success">
          Recording received. Your account manager will take it from here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 border-t border-subtle pt-4">
      <FileUpload
        label="Send us a recording"
        hint="A short clip of you speaking to camera. MP4 up to 500 MB."
        accept="video/*"
        disabled={busy}
        onSelect={setFile}
      />
      {busy && <UploadProgress percent={percent} />}
      {error && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
      <Button onClick={submit} disabled={!file || busy} loading={busy}>
        Upload recording
      </Button>
    </div>
  );
}

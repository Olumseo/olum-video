import { useState } from "react";
import { api } from "@olum-video/api-client";
import { Button, FileUpload, UploadProgress } from "@olum-video/ui";

/**
 * Uploads the consent/source recording a digital twin is built from.
 *
 * The client uploads here; an employee downloads it and creates the twin in
 * HeyGen's web UI by hand. There is no API call to HeyGen anywhere in this
 * flow — which is exactly why the file has to land somewhere a person can
 * fetch it from.
 *
 * Lives on the Setup screen and nowhere else. It used to sit in Settings while
 * "Request my twin" sat in Setup, so the twin had two homes and a client had
 * to guess which one held the action they wanted.
 */
export function TwinRecordingUpload() {
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
        <p className="text-sm text-success-ink">
          Recording received. Your account manager will take it from here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <FileUpload
        label="Send us a recording"
        hint="A short clip of you speaking to camera. MP4 up to 500 MB."
        accept="video/*"
        disabled={busy}
        onSelect={setFile}
      />
      {busy && <UploadProgress percent={percent} />}
      {error && (
        <p role="alert" className="text-xs text-danger-ink">
          {error}
        </p>
      )}
      <Button onClick={submit} disabled={!file || busy} loading={busy}>
        Upload recording
      </Button>
    </div>
  );
}

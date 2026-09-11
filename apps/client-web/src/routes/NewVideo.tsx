import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@olum-video/api-client";
import { Button, Card, CardBody, Field, inputClass } from "@olum-video/ui";

import { useAsync } from "../lib/useAsync";

type Mode = "prompt" | "script";

export default function NewVideo() {
  const navigate = useNavigate();
  const { data: entitlement } = useAsync(() => api.getEntitlement());

  const [mode, setMode] = useState<Mode>("prompt");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const outOfQuota =
    entitlement != null && entitlement.videos_used_today >= entitlement.daily_video_limit;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const video = await api.createVideo({
        title: title.trim(),
        ...(mode === "prompt" ? { prompt: text } : { script_body: text }),
      });
      navigate(`/videos/${video.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the video.");
      // Only re-enable on failure. On success we navigate away, and clearing
      // it here would briefly re-enable the button mid-transition — long
      // enough for a second click to create a duplicate.
      setSubmitting(false);
    }
  }

  const canSubmit = title.trim().length > 0 && text.trim().length > 0 && !outOfQuota;

  return (
    <div className="max-w-2xl">
      <h1 className="font-serif text-3xl">New video</h1>

      {outOfQuota && entitlement && (
        <div className="mt-6 rounded-lg border border-accent/40 bg-accent/10 px-5 py-4 text-sm">
          <p className="text-ink">
            You've used today's video ({entitlement.videos_used_today} of{" "}
            {entitlement.daily_video_limit}).
          </p>
          <p className="mt-1 text-muted">
            Your allowance resets at midnight in your timezone. You can still draft — you just
            can't submit until then.
          </p>
        </div>
      )}

      <form onSubmit={submit} className="mt-6 space-y-6">
        <Field id="title" label="What's this video about?" hint="Just for you — it isn't spoken.">
          <input
            id="title"
            className={inputClass}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Q3 product update"
          />
        </Field>

        <Card>
          <CardBody>
            <div role="radiogroup" aria-label="Input type" className="flex gap-2">
              <ModeButton active={mode === "prompt"} onClick={() => setMode("prompt")}>
                Give us a prompt
              </ModeButton>
              <ModeButton active={mode === "script"} onClick={() => setMode("script")}>
                I have a script
              </ModeButton>
            </div>

            <div className="mt-5">
              <Field
                id="body"
                label={mode === "prompt" ? "Your prompt" : "Your script"}
                hint={
                  mode === "prompt"
                    ? "Describe what you want to say and who it's for. We'll write it and send it back for approval."
                    : "Paste the finished script. We'll record it as written."
                }
              >
                <textarea
                  id="body"
                  className={`${inputClass} min-h-40 resize-y`}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={
                    mode === "prompt"
                      ? "A warm 60-second update for existing customers about what shipped this quarter…"
                      : "Hi, I'm Priya. This quarter we shipped three things…"
                  }
                />
              </Field>
            </div>
          </CardBody>
        </Card>

        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}

        <div className="flex items-center gap-3">
          <Button type="submit" loading={submitting} disabled={!canSubmit}>
            {mode === "prompt" ? "Send prompt" : "Submit script"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => navigate("/")}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={`rounded border px-3 py-1.5 text-sm transition-colors ${
        active ? "border-ink bg-ink text-paper" : "border-subtle text-muted hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

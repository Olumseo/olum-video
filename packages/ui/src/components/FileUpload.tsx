import { useId, useRef, useState, type DragEvent } from "react";

import { formatBytes } from "../format";

const MB = 1024 * 1024;

export interface FileUploadProps {
  /** Accept attribute, e.g. "video/*". Also enforced in code — see below. */
  accept?: string;
  /** Maximum size in bytes. Rejected client-side with a clear message. */
  maxBytes?: number;
  label: string;
  hint?: string;
  onSelect: (file: File) => void;
  disabled?: boolean;
}

/**
 * File picker with drag-and-drop.
 *
 * Validation here is a COURTESY, not a control: it turns a 20-minute upload
 * that ends in a server rejection into instant feedback. The server must
 * re-check type and size regardless — anyone can POST directly.
 */
export function FileUpload({
  accept = "video/*",
  maxBytes = 500 * MB,
  label,
  hint,
  onSelect,
  disabled,
}: FileUploadProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chosen, setChosen] = useState<File | null>(null);

  function validate(file: File): string | null {
    if (file.size > maxBytes) {
      return `That file is ${formatBytes(file.size)}. The limit is ${formatBytes(maxBytes)}.`;
    }
    // accept="video/*" only filters the OS picker; drag-and-drop bypasses it.
    if (accept.endsWith("/*")) {
      const wanted = accept.slice(0, accept.indexOf("/"));
      if (!file.type.startsWith(wanted + "/")) {
        return `That looks like a ${file.type || "unknown"} file. Please choose a ${wanted} file.`;
      }
    }
    return null;
  }

  function take(file: File | undefined) {
    if (!file) return;
    const problem = validate(file);
    if (problem) {
      setError(problem);
      setChosen(null);
      return;
    }
    setError(null);
    setChosen(file);
    onSelect(file);
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    take(e.dataTransfer.files[0]);
  }

  return (
    <div>
      <div
        // The drop zone is decoration around a real <input type="file">. The
        // input keeps keyboard access and screen-reader support that a div
        // with onClick would throw away.
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`rounded-lg border border-dashed px-6 py-10 text-center transition-colors ${
          dragging ? "border-accent bg-accent/5" : "border-subtle"
        } ${disabled ? "opacity-60" : ""}`}
      >
        <label htmlFor={inputId} className="cursor-pointer text-sm text-ink">
          {label}
        </label>
        {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}

        <input
          id={inputId}
          ref={inputRef}
          type="file"
          accept={accept}
          disabled={disabled}
          onChange={(e) => take(e.target.files?.[0])}
          className="sr-only"
        />

        <div className="mt-4">
          <button
            type="button"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
            className="rounded border border-subtle bg-paper px-4 py-2 text-sm hover:bg-cream disabled:cursor-not-allowed"
          >
            Choose a file
          </button>
          <p className="mt-2 text-xs text-muted">or drag one here</p>
        </div>

        {chosen && (
          <p className="mt-4 font-mono text-xs text-muted">
            {chosen.name} · {formatBytes(chosen.size)}
          </p>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-2 text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

/** Progress bar for an in-flight upload. */
export function UploadProgress({ percent }: { percent: number }) {
  const clamped = Math.max(0, Math.min(100, Math.round(percent)));
  return (
    <div>
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Upload progress"
        className="h-1.5 w-full overflow-hidden rounded-full bg-cream"
      >
        <div
          className="h-full bg-accent transition-[width] duration-200"
          style={{ width: `${clamped}%` }}
        />
      </div>
      <p className="mt-1.5 font-mono text-xs text-muted">{clamped}% uploaded</p>
    </div>
  );
}

import type { ReactNode } from "react";

/**
 * Shown while data is loading.
 *
 * Skeleton rows rather than a spinner: they hold the same space the real
 * content will, so the page does not jump when it arrives.
 */
export function LoadingRows({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-16 animate-pulse rounded-lg border border-subtle bg-cream" />
      ))}
    </div>
  );
}

/**
 * Shown when a list is legitimately empty.
 *
 * Always offers the next action. An empty state that only says "nothing here"
 * leaves the user to work out what to do about it.
 */
export function EmptyState({
  heading,
  body,
  action,
}: {
  heading: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-dashed border-subtle px-6 py-12 text-center">
      <p className="font-serif text-lg">{heading}</p>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/**
 * Shown when a request failed.
 *
 * Always offers a retry: most failures here are transient, and a dead end for
 * a network blip is a support ticket.
 */
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-danger/30 bg-danger/5 px-5 py-4 text-sm"
    >
      <p className="text-danger">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-2 text-xs text-muted underline underline-offset-4">
          Try again
        </button>
      )}
    </div>
  );
}

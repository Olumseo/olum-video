import { Component, type ErrorInfo, type ReactNode } from "react";

/**
 * Catches rendering errors so one broken component does not blank the page.
 *
 * Must be a CLASS: componentDidCatch has no hook equivalent. This is the one
 * place React still requires class syntax.
 *
 * It catches errors thrown during render, in lifecycle methods, and in
 * constructors below it. It does NOT catch errors in event handlers, async
 * callbacks, or timers — those never reach React's render path, so they still
 * need their own try/catch.
 */
interface Props {
  children: ReactNode;
  /** Where this boundary sits, e.g. "video detail". Shown in logs. */
  name?: string;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    // Console for now. Point this at real error reporting when there is some —
    // an error the user recovers from by reloading is invisible otherwise.
    console.error(`[${this.props.name ?? "app"}] render error`, error, info.componentStack);
  }

  override render() {
    if (!this.state.error) return this.props.children;

    return (
      <div role="alert" className="mx-auto max-w-md px-6 py-24 text-center">
        <h1 className="font-serif text-2xl">Something broke on this page</h1>
        <p className="mt-3 text-sm text-muted">
          This is our fault, not yours. Reloading usually fixes it.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={() => window.location.reload()}
            className="rounded bg-ink px-4 py-2 text-sm text-paper hover:bg-accent-2"
          >
            Reload
          </button>
          {/* Clearing the error re-renders the same subtree. It works when the
              cause was transient (a bad fetch result, say) and fails again
              immediately when it wasn't — which is the right behaviour. */}
          <button
            onClick={() => this.setState({ error: null })}
            className="rounded border border-subtle px-4 py-2 text-sm hover:bg-cream"
          >
            Try again
          </button>
        </div>
        {import.meta.env.DEV && (
          <pre className="mt-8 overflow-x-auto rounded border border-subtle bg-cream p-4 text-left font-mono text-xs">
            {this.state.error.message}
          </pre>
        )}
      </div>
    );
  }
}

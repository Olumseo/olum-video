import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-widest text-muted">404</p>
      <h1 className="mt-2 font-serif text-3xl">Page not found</h1>
      <Link to="/" className="mt-6 inline-block text-sm text-accent-ink underline underline-offset-4">
        Back to start
      </Link>
    </div>
  );
}

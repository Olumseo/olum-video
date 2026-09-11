import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg border border-subtle bg-paper ${className}`}>{children}</div>
  );
}

export function CardHeader({ children }: { children: ReactNode }) {
  return <div className="border-b border-subtle px-5 py-3.5">{children}</div>;
}

export function CardBody({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`px-5 py-4 ${className}`}>{children}</div>;
}

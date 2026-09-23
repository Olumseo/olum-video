// Shared UI. A component earns a place here on its SECOND use — extracting
// something used once costs indirection and buys no reuse.

export { Badge, type Tone } from "./components/Badge";
export { Button } from "./components/Button";
export { Card, CardHeader, CardBody } from "./components/Card";
export { EmptyState, ErrorState, LoadingRows } from "./components/States";
export { Field, inputClass } from "./components/Field";
export { ErrorBoundary } from "./components/ErrorBoundary";
export { VideoPlayer } from "./components/VideoPlayer";
export { FileUpload, UploadProgress } from "./components/FileUpload";

export { SessionProvider } from "./auth/SessionProvider";
export { useSession, useAccount } from "./auth/useSession";
export type { Session } from "./auth/context";
export { RequireSession } from "./auth/RequireSession";

// Motion. The paired CSS lives in ./motion.css — an app that imports these
// components without that stylesheet renders them permanently invisible.
export { Reveal, RevealLines } from "./motion/Reveal";
export { useInView, useReducedMotion, useScrollProgress, useScrolled } from "./motion/hooks";

export { presentStatus } from "./status";
export { relativeTime, duration, formatBytes } from "./format";

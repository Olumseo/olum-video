import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ErrorBoundary, SessionProvider } from "@olum-video/ui";

import App from "./App";
import "./index.css";

const root = document.getElementById("root");
if (!root) throw new Error("#root not found");

// BASE_URL is what vite.config.ts set as `base`, injected at build time.
// Reusing it as the router basename means the two can never disagree —
// hardcoding the prefix here is how apps end up serving 404s after a path
// change that only updated one of the two places.
//
// react-router wants no trailing slash; Vite's BASE_URL always has one.
const basename = import.meta.env.BASE_URL.replace(/\/$/, "");

createRoot(root).render(
  <StrictMode>
    {/* Outside the router on purpose: a crash inside routing itself would
        escape a boundary placed within it. */}
    <ErrorBoundary name={basename || "app"}>
      <BrowserRouter basename={basename}>
        <SessionProvider>
          <App />
        </SessionProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
);

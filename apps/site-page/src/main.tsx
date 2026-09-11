import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ErrorBoundary } from "@olum-video/ui";

import App from "./App";
import "./index.css";

const root = document.getElementById("root");
if (!root) throw new Error("#root not found");

const basename = import.meta.env.BASE_URL.replace(/\/$/, "");

// No SessionProvider here: this page is public, and looking up an account
// would make a signed-out visitor wait on a request that is meant to fail.
createRoot(root).render(
  <StrictMode>
    <ErrorBoundary name="site-page">
      <BrowserRouter basename={basename}>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
);

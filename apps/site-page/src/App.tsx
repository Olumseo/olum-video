import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";

import Shell from "./routes/Shell";
import NotFound from "./routes/NotFound";
import Home from "./routes/Home";
import HowItWorks from "./routes/HowItWorks";
import Results from "./routes/Results";
import Pricing from "./routes/Pricing";
// Loaded only when visited: the sign-up page carries the phone-number rules for
// every country (and pulls in Firebase), which every other visitor would
// otherwise download for nothing.
const GetStarted = lazy(() => import("./routes/GetStarted"));

// Results comes first: it is the page that answers "does this actually work",
// which is the only question a visitor has before any of the others.
const NAV = [
  { to: "/results", label: "Results" },
  { to: "/how-it-works", label: "How it works" },
  { to: "/pricing", label: "Pricing" },
];

export default function App() {
  return (
    <Shell title="olum.video" nav={NAV}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/results" element={<Results />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/pricing" element={<Pricing />} />
        {/* Where every "Get started" and "Create my AI clone" leads. */}
        <Route
          path="/get-started"
          element={
            <Suspense fallback={<div className="min-h-screen" />}>
              <GetStarted />
            </Suspense>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Shell>
  );
}

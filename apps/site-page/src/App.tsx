import { Route, Routes } from "react-router-dom";

import Shell from "./routes/Shell";
import NotFound from "./routes/NotFound";
import Home from "./routes/Home";
import HowItWorks from "./routes/HowItWorks";
import Results from "./routes/Results";
import Pricing from "./routes/Pricing";
import GetStarted from "./routes/GetStarted";

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
        {/* Where every "Open the app" and "Create my AI clone" leads. */}
        <Route path="/get-started" element={<GetStarted />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Shell>
  );
}

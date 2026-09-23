import { Route, Routes } from "react-router-dom";

import Shell from "./routes/Shell";
import NotFound from "./routes/NotFound";
import Home from "./routes/Home";
import HowItWorks from "./routes/HowItWorks";
import Pricing from "./routes/Pricing";

const NAV = [
  { to: "/how-it-works", label: "How it works" },
  { to: "/pricing", label: "Pricing" },
];

export default function App() {
  return (
    <Shell title="olum.video" nav={NAV}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Shell>
  );
}

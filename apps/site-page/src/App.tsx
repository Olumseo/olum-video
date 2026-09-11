import { Route, Routes } from "react-router-dom";

import Shell from "./routes/Shell";
import NotFound from "./routes/NotFound";
import Landing from "./routes/Landing";
import Pricing from "./routes/Pricing";

const NAV = [
  { to: "/", label: "Overview" },
  { to: "/pricing", label: "Pricing" },
];

export default function App() {
  return (
    <Shell title="olum.video" nav={NAV}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Shell>
  );
}

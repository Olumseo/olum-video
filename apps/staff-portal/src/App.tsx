import { Route, Routes } from "react-router-dom";
import { RequireSession } from "@olum-video/ui";

import Shell from "./routes/Shell";
import NotFound from "./routes/NotFound";
import Queue from "./routes/Queue";
import Clients from "./routes/Clients";
import EditQueue from "./routes/EditQueue";
import Onboarding from "./routes/Onboarding";
import BriefReview from "./routes/BriefReview";

// One app, not two. `staff_role` already models editor as a ROLE rather than an
// identity, so account managers and editors differ only in which rows they see.
//
// NOTE: RequireSession proves the viewer is signed in, NOT that they are staff.
// Role checking belongs on the SERVER — every staff endpoint must verify the
// role itself. Hiding a nav link is presentation, never protection.
// Ordered by urgency, not by how the product was built. Onboarding first:
// everyone on that screen has paid and cannot use anything yet.
const NAV = [
  { to: "/onboarding", label: "Onboarding" },
  { to: "/briefs", label: "Briefs" },
  { to: "/", label: "Queue" },
  { to: "/clients", label: "Clients" },
  { to: "/edits", label: "Edit queue" },
];

export default function App() {
  return (
    <RequireSession>
      <Shell title="olum.video · staff" nav={NAV}>
        <Routes>
          <Route path="/" element={<Queue />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/briefs" element={<BriefReview />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/edits" element={<EditQueue />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Shell>
    </RequireSession>
  );
}

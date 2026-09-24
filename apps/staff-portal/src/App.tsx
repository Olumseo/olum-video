import { Route, Routes } from "react-router-dom";
import { RequireSession } from "@olum-video/ui";

import Shell from "./routes/Shell";
import NotFound from "./routes/NotFound";
import Queue from "./routes/Queue";
import Clients from "./routes/Clients";
import EditQueue from "./routes/EditQueue";
import Onboarding from "./routes/Onboarding";
import BriefReview from "./routes/BriefReview";
import MyWork from "./routes/MyWork";
import Team from "./routes/Team";
import Join from "./routes/Join";
import Publish from "./routes/Publish";
import Leads from "./routes/Leads";

// One app, not two. `staff_role` already models editor as a ROLE rather than an
// identity, so account managers and editors differ only in which rows they see.
//
// NOTE: RequireSession proves the viewer is signed in, NOT that they are staff.
// Role checking belongs on the SERVER — every staff endpoint must verify the
// role itself. Hiding a nav link is presentation, never protection.
//
// The same goes for the agency scope. "Team" is hidden from olum's own staff
// because they have no team to manage, but the endpoints behind it refuse a
// caller with no agency regardless of what the nav shows.
//
// Ordered by urgency, not by how the product was built. Your own work first —
// it is the only list that is definitely yours — then onboarding, where
// everyone has paid and cannot use anything yet.
const NAV = [
  { to: "/my-work", label: "My work" },
  { to: "/onboarding", label: "Onboarding" },
  { to: "/briefs", label: "Briefs" },
  { to: "/", label: "Queue" },
  { to: "/clients", label: "Clients" },
  { to: "/edits", label: "Edit queue" },
  // Last step of the pipeline: approved by the client, not yet live.
  { to: "/publish", label: "Publish" },
  // Landing-page sign-ups waiting for a call. Olum's staff only.
  { to: "/leads", label: "Sign-ups" },
  { to: "/team", label: "Team" },
];

export default function App() {
  return (
    <Routes>
      {/* OUTSIDE RequireSession, deliberately.

          Somebody opening an invite link has no session yet — that is what an
          invite is for. Putting this behind the gate would show them a sign-in
          wall before telling them what they were invited to, and the screen
          itself asks them to sign in at the right moment. */}
      <Route path="/join" element={<Join />} />

      <Route
        path="*"
        element={
          <RequireSession requires="staff">
            <Shell title="olum.video · staff" nav={NAV}>
              <Routes>
                <Route path="/" element={<Queue />} />
                <Route path="/my-work" element={<MyWork />} />
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/briefs" element={<BriefReview />} />
                <Route path="/clients" element={<Clients />} />
                <Route path="/edits" element={<EditQueue />} />
                <Route path="/publish" element={<Publish />} />
                <Route path="/leads" element={<Leads />} />
                <Route path="/team" element={<Team />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Shell>
          </RequireSession>
        }
      />
    </Routes>
  );
}

import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { api } from "@olum-video/api-client";
import { RequireSession } from "@olum-video/ui";

import Shell from "./routes/Shell";
import NotFound from "./routes/NotFound";
import VideoList from "./routes/VideoList";
import VideoDetail from "./routes/VideoDetail";
import NewBrief from "./routes/NewBrief";
import BriefList from "./routes/BriefList";
import BriefDetail from "./routes/BriefDetail";
import Setup from "./routes/Setup";
import Settings from "./routes/Settings";
import { useAsync } from "./lib/useAsync";

/**
 * The nav changes with the client's state, and that is the point.
 *
 * Someone still being set up has nothing to look at in Videos and cannot use
 * New — showing both would be four dead ends and one live page. They get the
 * one screen that is about them.
 */
const NAV_READY = [
  { to: "/", label: "Videos" },
  { to: "/briefs", label: "Requests" },
  { to: "/new", label: "New" },
  { to: "/settings", label: "Settings" },
];

const NAV_SETUP = [
  { to: "/setup", label: "Getting set up" },
  { to: "/settings", label: "Settings" },
];

export default function App() {
  return (
    // Wraps the whole app rather than each route: every screen here needs a
    // session, so gating once avoids repeating the check (and forgetting it on
    // the next route someone adds).
    <RequireSession>
      <Gated />
    </RequireSession>
  );
}

/**
 * Reads readiness once, at the top, and routes on it.
 *
 * ONE call for the whole app, not one per screen. The answer is the same for
 * every route, and asking repeatedly would let two screens disagree about
 * whether the client is set up.
 *
 * The server enforces this regardless — `createBrief` returns 409 whatever the
 * UI does. This is navigation, not security: it stops someone being shown a
 * form that cannot succeed.
 */
function Gated() {
  const { pathname } = useLocation();
  const { data: readiness, loading } = useAsync(() => api.getReadiness());

  // Render the frame immediately and let the body settle. Holding the whole
  // app back for a 200ms call makes every visit feel like a cold start.
  const ready = readiness?.ready ?? true;
  const nav = loading ? [] : ready ? NAV_READY : NAV_SETUP;

  // Settings stays reachable in both states: a client who is mid-setup still
  // has a legitimate reason to look at their account.
  const alwaysAllowed = pathname === "/settings" || pathname === "/setup";

  return (
    <Shell title="olum.video" nav={nav}>
      <Routes>
        <Route path="/setup" element={<Setup />} />
        <Route path="/settings" element={<Settings />} />

        {!loading && !ready && !alwaysAllowed ? (
          // `replace`, so Back does not bounce them between a page they cannot
          // use and the one that redirected them away from it.
          <Route path="*" element={<Navigate to="/setup" replace />} />
        ) : (
          <>
            <Route path="/" element={<VideoList />} />
            <Route path="/briefs" element={<BriefList />} />
            <Route path="/briefs/:id" element={<BriefDetail />} />
            <Route path="/new" element={<NewBrief />} />
            <Route path="/videos/:id" element={<VideoDetail />} />
            <Route path="*" element={<NotFound />} />
          </>
        )}
      </Routes>
    </Shell>
  );
}

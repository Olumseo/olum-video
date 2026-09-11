import { Route, Routes } from "react-router-dom";
import { RequireSession } from "@olum-video/ui";

import Shell from "./routes/Shell";
import NotFound from "./routes/NotFound";
import VideoList from "./routes/VideoList";
import VideoDetail from "./routes/VideoDetail";
import NewVideo from "./routes/NewVideo";
import Settings from "./routes/Settings";

const NAV = [
  { to: "/", label: "Videos" },
  { to: "/new", label: "New" },
  { to: "/settings", label: "Settings" },
];

export default function App() {
  return (
    // Wraps the whole app rather than each route: every screen here needs a
    // session, so gating once avoids repeating the check (and forgetting it on
    // the next route someone adds).
    <RequireSession>
      <Shell title="olum.video" nav={NAV}>
        <Routes>
          <Route path="/" element={<VideoList />} />
          <Route path="/new" element={<NewVideo />} />
          <Route path="/videos/:id" element={<VideoDetail />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Shell>
    </RequireSession>
  );
}

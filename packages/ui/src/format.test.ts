import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import { duration, relativeTime } from "./format";

describe("duration", () => {
  it("formats mm:ss with a zero-padded seconds field", () => {
    expect(duration(61_000)).toBe("1:01");
    expect(duration(600_000)).toBe("10:00");
    expect(duration(9_000)).toBe("0:09");
  });

  // A version with no asset yet has no duration. Rendering "NaN:NaN" in a
  // video list is the kind of bug users screenshot.
  it("renders an em dash rather than NaN when duration is unknown", () => {
    expect(duration(null)).toBe("—");
  });
});

describe("relativeTime", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-09T12:00:00Z"));
  });
  afterEach(() => vi.useRealTimers());

  it("describes recent past times", () => {
    expect(relativeTime("2026-09-09T11:58:00Z")).toBe("2m ago");
    expect(relativeTime("2026-09-09T09:00:00Z")).toBe("3h ago");
    expect(relativeTime("2026-09-07T12:00:00Z")).toBe("2d ago");
  });

  // SLA due dates are in the FUTURE. Without this branch every deadline would
  // read "-2h ago", which is the opposite of a countdown.
  it("describes future times as a countdown", () => {
    expect(relativeTime("2026-09-09T14:00:00Z")).toBe("in 2h");
    expect(relativeTime("2026-09-11T12:00:00Z")).toBe("in 2d");
  });

  it("falls back to a calendar date beyond a week", () => {
    expect(relativeTime("2026-01-15T12:00:00Z")).toMatch(/Jan/);
  });

  // A malformed timestamp from the API must not render "Invalid Date".
  it("survives an unparseable timestamp", () => {
    expect(relativeTime("not-a-date")).toBe("—");
  });
});

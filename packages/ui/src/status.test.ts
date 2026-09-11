import { describe, expect, it } from "vitest";

import { presentStatus } from "./status";

describe("presentStatus", () => {
  it("hides internal workflow stages from clients", () => {
    // A client must never read our internal vocabulary. Several distinct
    // internal stages collapse to one honest client-facing phrase.
    expect(presentStatus("internal_qa", "client").label).toBe("In production");
    expect(presentStatus("gen_running", "client").label).toBe("In production");
    expect(presentStatus("edit_queued", "client").label).toBe("Being edited");
  });

  it("shows staff the precise stage", () => {
    expect(presentStatus("internal_qa", "staff").label).toBe("internal QA");
    expect(presentStatus("gen_failed", "staff").label).toBe("gen FAILED");
  });

  it("tones a failure as reassuring for clients and urgent for staff", () => {
    expect(presentStatus("gen_failed", "client").tone).toBe("attention");
    expect(presentStatus("gen_failed", "staff").tone).toBe("bad");
  });

  // The backend can add a status and deploy before the frontend does. That is
  // normal, and it must degrade to a plain label rather than a blank screen.
  it("falls back gracefully for an unknown status", () => {
    expect(presentStatus("some_future_status", "client")).toEqual({
      label: "Unknown",
      tone: "neutral",
    });
  });
});

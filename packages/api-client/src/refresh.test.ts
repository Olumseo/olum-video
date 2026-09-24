import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

// The three properties worth defending, none of which is obvious from reading
// the happy path:
//
//   1. a refresh must never be attempted WITHOUT a DPoP proof, because
//      authservice would answer with an unbound token and video-service
//      rejects those — trading an expired session for a permanently dead one;
//   2. concurrent callers must share ONE refresh, or with token rotation all
//      but the winner spend an already-spent token;
//   3. the retry happens exactly once, so a refused token cannot become a
//      request loop.

const dpopHeaderMock = vi.fn(async () => ({ DPoP: "proof" }));
vi.mock("./dpop", () => ({
  dpopHeader: (...a: unknown[]) => dpopHeaderMock(...(a as [])),
  dpopFetch: vi.fn(),
}));

const fetchMock = vi.fn();

function jsonOk(): Response {
  return {
    ok: true,
    status: 200,
    headers: new Headers({ "content-type": "application/json" }),
  } as Response;
}
function status(code: number): Response {
  return {
    ok: code >= 200 && code < 300,
    status: code,
    headers: new Headers({ "content-type": "application/json" }),
  } as Response;
}

let withRefresh: typeof import("./refresh").withRefresh;

beforeEach(async () => {
  vi.resetModules(); // the single-flight promise is module state
  dpopHeaderMock.mockClear();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  vi.stubGlobal("window", {
    location: { origin: "https://olum.ai" },
    dispatchEvent: vi.fn(),
  });
  ({ withRefresh } = await import("./refresh"));
});
afterEach(() => vi.unstubAllGlobals());

describe("withRefresh", () => {
  it("does not refresh when the request succeeds", async () => {
    const call = vi.fn(async () => status(200));
    await withRefresh(call);

    expect(call).toHaveBeenCalledTimes(1);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refreshes on 401 and retries the request once", async () => {
    const call = vi.fn().mockResolvedValueOnce(status(401)).mockResolvedValueOnce(status(200));
    fetchMock.mockResolvedValue(jsonOk());

    const res = await withRefresh(call);

    expect(res.status).toBe(200);
    expect(call).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  // The reason this file exists. A refresh without a proof yields a token with
  // no cnf.jkt, which this service refuses on every subsequent request.
  it("sends a DPoP proof on the refresh itself", async () => {
    const call = vi.fn().mockResolvedValueOnce(status(401)).mockResolvedValueOnce(status(200));
    fetchMock.mockResolvedValue(jsonOk());

    await withRefresh(call);

    expect(dpopHeaderMock).toHaveBeenCalledWith("POST", "https://olum.ai/api/v1/auth/token/refresh");
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>).DPoP).toBe("proof");
    expect(init.credentials).toBe("include");
  });

  it("abandons the refresh rather than proceeding unproofed", async () => {
    dpopHeaderMock.mockRejectedValueOnce(new Error("no WebCrypto"));
    const call = vi.fn().mockResolvedValue(status(401));

    const res = await withRefresh(call);

    // No refresh request was sent at all — an unbound token is worse than the
    // expiry, so failing here is the intended outcome.
    expect(fetchMock).not.toHaveBeenCalled();
    expect(res.status).toBe(401);
    expect(call).toHaveBeenCalledTimes(1);
  });

  it("gives up after one retry instead of looping", async () => {
    const call = vi.fn().mockResolvedValue(status(401)); // still 401 after refresh
    fetchMock.mockResolvedValue(jsonOk());

    const res = await withRefresh(call);

    expect(res.status).toBe(401);
    expect(call).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("shares one refresh between concurrent callers", async () => {
    fetchMock.mockResolvedValue(jsonOk());
    const make = () => vi.fn().mockResolvedValueOnce(status(401)).mockResolvedValueOnce(status(200));
    const calls = [make(), make(), make(), make()];

    await Promise.all(calls.map((c) => withRefresh(c)));

    // Four 401s, one refresh.
    expect(fetchMock).toHaveBeenCalledTimes(1);
    calls.forEach((c) => expect(c).toHaveBeenCalledTimes(2));
  });

  it("signals logout when the refresh is refused", async () => {
    fetchMock.mockResolvedValue(status(401));
    const call = vi.fn().mockResolvedValue(status(401));

    await withRefresh(call);

    expect((window.dispatchEvent as ReturnType<typeof vi.fn>).mock.calls.length).toBe(1);
  });

  // A dev server or a misrouted proxy answers 200 with index.html. Treating
  // that as a successful refresh would send every 401 through a pointless
  // second round trip and hide the real misconfiguration.
  it("does not accept an HTML 200 as a refreshed session", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "text/html" }),
    } as Response);
    const call = vi.fn().mockResolvedValue(status(401));

    const res = await withRefresh(call);

    expect(res.status).toBe(401);
    expect(call).toHaveBeenCalledTimes(1); // no retry
  });
});

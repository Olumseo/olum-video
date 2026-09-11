import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import { ForbiddenError, NotFoundError, QuotaError, UnauthorizedError } from "./errors";

// dpopFetch is stubbed rather than exercised: WebCrypto and IndexedDB are not
// what these tests are about. What matters is that a status code becomes the
// RIGHT error type, because the UI branches on that and nothing else checks it.
const fetchMock = vi.fn();
vi.mock("./dpop", () => ({
  dpopFetch: (...args: unknown[]) => fetchMock(...args),
}));

function response(status: number, body: unknown = {}): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

let httpApi: typeof import("./http").httpApi;

beforeEach(async () => {
  fetchMock.mockReset();
  ({ httpApi } = await import("./http"));
});
afterEach(() => vi.restoreAllMocks());

describe("status code to error mapping", () => {
  it("401 becomes UnauthorizedError so the UI can send the user to sign in", async () => {
    fetchMock.mockResolvedValue(response(401));
    await expect(httpApi.listVideos()).rejects.toBeInstanceOf(UnauthorizedError);
  });

  // A signed-in user without the video product must NOT be bounced to sign-in;
  // that would loop them forever, since signing in is not the problem.
  it("403 becomes ForbiddenError, not UnauthorizedError", async () => {
    fetchMock.mockResolvedValue(response(403, { message: "Video isn't on your plan." }));
    const err = await httpApi.listVideos().catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ForbiddenError);
    expect(err).not.toBeInstanceOf(UnauthorizedError);
    expect((err as Error).message).toBe("Video isn't on your plan.");
  });

  it("404 becomes NotFoundError", async () => {
    fetchMock.mockResolvedValue(response(404, { message: "No such video." }));
    await expect(httpApi.getVideo("nope")).rejects.toBeInstanceOf(NotFoundError);
  });

  // A plan limit is a RULE, not a failure. It must never surface as a generic
  // error with a "try again" button that can only fail again.
  it("429 becomes QuotaError carrying the server's explanation", async () => {
    fetchMock.mockResolvedValue(response(429, { message: "You've used today's video." }));
    const err = await httpApi
      .createVideo({ title: "t", prompt: "p" })
      .catch((e: unknown) => e);
    expect(err).toBeInstanceOf(QuotaError);
    expect((err as Error).message).toBe("You've used today's video.");
  });

  it("500 becomes a plain Error", async () => {
    fetchMock.mockResolvedValue(response(500));
    const err = await httpApi.listVideos().catch((e: unknown) => e);
    expect(err).toBeInstanceOf(Error);
    expect(err).not.toBeInstanceOf(QuotaError);
  });

  // FastAPI and the gateway use `detail`; our own envelope uses `message`.
  it("reads the message from either error envelope", async () => {
    fetchMock.mockResolvedValue(response(403, { detail: "from FastAPI" }));
    const err = await httpApi.listVideos().catch((e: unknown) => e);
    expect((err as Error).message).toBe("from FastAPI");
  });

  it("survives a non-JSON error body", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 502,
      json: async () => {
        throw new SyntaxError("Unexpected token < in JSON");
      },
    } as unknown as Response);
    await expect(httpApi.listVideos()).rejects.toThrow(/502/);
  });
});

describe("requests", () => {
  // A retried request must not consume two videos' worth of quota. The server
  // matches on this header, so omitting it silently breaks retry safety.
  it("sends an Idempotency-Key on mutations", async () => {
    fetchMock.mockResolvedValue(response(200, { id: "v1" }));
    await httpApi.createVideo({ title: "t", prompt: "p" });

    const init = fetchMock.mock.calls[0]![1] as RequestInit;
    const headers = init.headers as Record<string, string>;
    expect(headers["Idempotency-Key"]).toBeTruthy();
    expect(init.method).toBe("POST");
  });

  it("does not send an Idempotency-Key on reads", async () => {
    fetchMock.mockResolvedValue(response(200, []));
    await httpApi.listVideos();

    const init = (fetchMock.mock.calls[0]![1] ?? {}) as RequestInit;
    const headers = (init.headers ?? {}) as Record<string, string>;
    expect(headers["Idempotency-Key"]).toBeUndefined();
  });

  // Ids go into the URL path, so a value containing "/" or "?" would otherwise
  // change which endpoint is called.
  it("encodes ids in the path", async () => {
    fetchMock.mockResolvedValue(response(200, {}));
    await httpApi.getVideo("a/b?c");
    expect(fetchMock.mock.calls[0]![0]).toBe("/api/v1/video/videos/a%2Fb%3Fc");
  });
});

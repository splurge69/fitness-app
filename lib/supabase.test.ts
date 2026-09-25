import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const { fetchWithClockSkewRetry } = await import("./supabase");

function reply(status: number, body: string) {
  return new Response(body, { status });
}

describe("fetchWithClockSkewRetry", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("retries a 'JWT issued at future' rejection", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(reply(401, '{"message":"JWT issued at future"}'))
      .mockResolvedValueOnce(reply(200, "[]"));
    vi.stubGlobal("fetch", fetch);

    const response = await fetchWithClockSkewRetry("https://db/rest/v1/x");
    expect(response.status).toBe(200);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("does not retry other 401s", async () => {
    const fetch = vi.fn().mockResolvedValue(reply(401, '{"message":"Invalid API key"}'));
    vi.stubGlobal("fetch", fetch);

    const response = await fetchWithClockSkewRetry("https://db/rest/v1/x");
    expect(response.status).toBe(401);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});

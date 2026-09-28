import { beforeEach, expect, it, vi } from "vitest";

const { requireSession, getSession, savePostSessionLog, revalidatePath } =
  vi.hoisted(() => ({
    requireSession: vi.fn(),
    getSession: vi.fn(),
    savePostSessionLog: vi.fn(),
    revalidatePath: vi.fn(),
  }));
vi.mock("@/lib/session", () => ({ requireSession }));
vi.mock("@/lib/data", () => ({ getSession, savePostSessionLog }));
vi.mock("next/cache", () => ({ revalidatePath }));
import { savePostSessionAction } from "./post-session";

beforeEach(() => {
  vi.resetAllMocks();
  getSession.mockResolvedValue({
    id: "session",
    completedAt: "2026-09-28T12:00:00Z",
  });
});

it("requires authentication before reading or saving measurements", async () => {
  requireSession.mockRejectedValue(new Error("Unauthorized"));
  await expect(
    savePostSessionAction("session", {}, new FormData()),
  ).rejects.toThrow("Unauthorized");
  expect(getSession).not.toHaveBeenCalled();
  expect(savePostSessionLog).not.toHaveBeenCalled();
});

it.each([null, { completedAt: null }])(
  "rejects extras for missing or unfinished sessions",
  async (session) => {
    getSession.mockResolvedValue(session);
    expect(
      await savePostSessionAction("session", {}, new FormData()),
    ).toHaveProperty("error");
    expect(savePostSessionLog).not.toHaveBeenCalled();
  },
);

it("saves all extras together and refreshes the session and history", async () => {
  const form = new FormData();
  form.set("weightKg", "96");
  form.set("sauna", "15");
  expect(await savePostSessionAction("session", {}, form)).toEqual({
    saved: true,
  });
  expect(savePostSessionLog).toHaveBeenCalledWith("session", {
    weightKg: 96,
    activities: [{ kind: "sauna", name: "Sauna", minutes: 15 }],
  });
  expect(revalidatePath).toHaveBeenCalledWith("/history");
  expect(revalidatePath).toHaveBeenCalledWith("/workout/session");
});

it("returns validation errors without writing", async () => {
  const form = new FormData();
  form.set("sauna", "-10");
  expect(await savePostSessionAction("session", {}, form)).toHaveProperty(
    "error",
  );
  expect(savePostSessionLog).not.toHaveBeenCalled();
});

it("reports failed persistence instead of claiming success", async () => {
  savePostSessionLog.mockRejectedValue(new Error("Database unavailable"));
  expect(await savePostSessionAction("session", {}, new FormData())).toEqual({
    error:
      "Your extras could not be saved. Your programme is already recorded. Please try again.",
  });
  expect(revalidatePath).not.toHaveBeenCalled();
});

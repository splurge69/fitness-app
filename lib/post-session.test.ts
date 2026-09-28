import { describe, expect, it } from "vitest";
import { parsePostSession } from "./post-session";

describe("post-session logging", () => {
  it("records a weigh-in and optional activities independently of a programme", () => {
    const form = new FormData();
    form.set("weightKg", "95.8");
    form.set("assault_bike", "7.5");
    form.set("sauna", "12");
    expect(parsePostSession(form)).toEqual({
      weightKg: 95.8,
      activities: [
        { kind: "assault_bike", name: "Assault bike", minutes: 7.5 },
        { kind: "sauna", name: "Sauna", minutes: 12 },
      ],
    });
  });
});

it("allows every extra to be skipped and removed on a later save", () => {
  const form = new FormData();
  form.set("weightKg", "");
  expect(parsePostSession(form)).toEqual({ weightKg: null, activities: [] });
});

it.each(["0", "-1", "NaN", "Infinity", "1.23", "1001", " ", "1e2"])(
  "rejects invalid measurements: %s",
  (value) => {
    for (const field of ["weightKg", "assault_bike", "sauna"]) {
      const form = new FormData();
      form.set(field, value);
      expect(() => parsePostSession(form)).toThrow();
    }
  },
);

it("accepts decimal commas and does not trust submitted activity names", () => {
  const form = new FormData();
  form.set("weightKg", "95,6");
  form.set("sauna", "10");
  form.set("name", "Untrusted name");
  expect(parsePostSession(form)).toEqual({
    weightKg: 95.6,
    activities: [{ kind: "sauna", name: "Sauna", minutes: 10 }],
  });
});

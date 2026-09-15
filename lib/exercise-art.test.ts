import { describe, expect, it } from "vitest";
import { artKeyFor } from "./exercise-art";

describe("artKeyFor", () => {
  it("uses the seeded exercise id when present", () => {
    expect(artKeyFor("Renamed", "21111111-1111-4111-8111-111111111114")).toBe(
      "split-squat",
    );
  });

  it("matches the current ACL programme by name", () => {
    expect(artKeyFor("Movement preparation")).toBe("movement-prep");
    expect(artKeyFor("Assault bike")).toBe("assault-bike");
    expect(artKeyFor("Exercise ball + walking lunges with rotation")).toBe(
      "ball-lunges",
    );
    expect(artKeyFor("Bulgarian split squat")).toBe("split-squat");
    expect(artKeyFor("Single-leg leg extension")).toBe("leg-extension");
    expect(artKeyFor("Single-leg leg curl")).toBe("leg-curl");
    expect(artKeyFor("Calf raise")).toBe("calf-raise");
  });

  it("falls back for an unknown lift", () => {
    expect(artKeyFor("Farmers carry")).toBe("fallback");
    expect(artKeyFor("")).toBe("fallback");
  });
});

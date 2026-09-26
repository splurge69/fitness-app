import { describe, expect, it } from "vitest";
import { muscleFor } from "./muscles";

describe("muscleFor", () => {
  it("labels the working lifts", () => {
    expect(muscleFor("Bulgarian split squat")).toBe("Glutes");
    expect(muscleFor("Single-leg leg extension")).toBe("Quads");
    expect(muscleFor("Single-leg leg curl")).toBe("Hamstrings");
    expect(muscleFor("Calf raise")).toBe("Calves");
    expect(muscleFor("Dumbbell bench press")).toBe("Chest");
    expect(muscleFor("Pallof press")).toBe("Core");
  });

  it("does not invent a muscle for warm-ups", () => {
    expect(muscleFor("Assault bike")).toBeNull();
    expect(muscleFor("Movement preparation")).toBeNull();
    expect(muscleFor("Band pull-aparts")).toBeNull();
  });
});

import { describe, expect, it } from "vitest";
import {
  CELL,
  HOME_COLS,
  ROWS,
  WIDTH,
  createFrogger,
  hop,
  laneFor,
  laneItems,
  lanes,
  stepFrogger,
  type Frogger,
} from "./frogger";

/** Find a time when the frog's column in `row` is clear (or covered, for the river). */
function timeWhen(game: Frogger, row: number, want: "clear" | "covered"): number {
  const lane = laneFor(row)!;
  for (let t = 0; t < 60; t += 0.01) {
    const covered = laneItems(lane, t, game.level).some(
      (x) => game.frog.x + 20 > x && game.frog.x - 20 < x + lane.width,
    );
    const centred = laneItems(lane, t, game.level).some(
      (x) => game.frog.x >= x + 10 && game.frog.x <= x + lane.width - 10,
    );
    if (want === "clear" ? !covered : centred) return t;
  }
  throw new Error("no gap found");
}

describe("lanes", () => {
  it("keeps every lane crossable: items never fill the whole period", () => {
    for (const lane of lanes()) {
      expect(lane.width * lane.count).toBeLessThan(WIDTH + 360);
    }
  });

  it("moves traffic in the lane's direction over time", () => {
    const lane = laneFor(2)!;
    const [a] = laneItems(lane, 0);
    const [b] = laneItems(lane, 0.5);
    expect(b - a).toBeCloseTo(lane.speed * 0.5);
  });
});

describe("hop", () => {
  it("starts the game, moves on the grid and scores new rows once", () => {
    const game = createFrogger();
    game.t = timeWhen(game, 1, "clear");
    const { events } = hop(game, "up");
    expect(game.state).toBe("playing");
    expect(game.frog.row).toBe(1);
    expect(game.score).toBe(10);
    expect(events.map((event) => event.kind)).toContain("points");

    hop(game, "down");
    expect(game.frog.row).toBe(0);
    game.t = timeWhen(game, 1, "clear");
    hop(game, "up");
    expect(game.score).toBe(10);
  });

  it("stays inside the side walls", () => {
    const game = createFrogger();
    for (let i = 0; i < 10; i++) hop(game, "left");
    expect(game.frog.x).toBe(CELL / 2);
  });
});

describe("hazards", () => {
  it("squashes the frog when it hops into traffic", () => {
    const game = createFrogger();
    game.state = "playing";
    const lane = laneFor(1)!;
    // Wait until a car is right under the frog's landing column.
    for (let t = 0; t < 30; t += 0.01) {
      const hit = laneItems(lane, t).some((x) => game.frog.x > x + 6 && game.frog.x < x + lane.width - 6);
      if (hit) {
        game.t = t;
        break;
      }
    }
    const { events } = hop(game, "up");
    expect(events.map((event) => event.kind)).toContain("splat");
    expect(game.lives).toBe(2);
    expect(game.frog.row).toBe(0);
  });

  it("carries the frog on a log and drowns it in open water", () => {
    const game = createFrogger();
    game.state = "playing";
    game.frog.row = 7;
    game.t = timeWhen(game, 7, "covered");
    const before = game.frog.x;
    expect(stepFrogger(game, 0.05)).toEqual([]);
    expect(game.frog.x).toBeCloseTo(before + laneFor(7)!.speed * 0.05);

    const wet = createFrogger();
    wet.state = "playing";
    wet.frog.row = 7;
    wet.t = timeWhen(wet, 7, "clear");
    expect(stepFrogger(wet, 0.01).map((event) => event.kind)).toContain("splash");
  });

  it("ends the game on the last life and restarts on the next tap", () => {
    const game = createFrogger(1, 0, 1);
    game.state = "playing";
    game.frog.row = 7;
    game.t = timeWhen(game, 7, "clear");
    expect(stepFrogger(game, 0.01).map((event) => event.kind)).toEqual(["splash", "over"]);
    expect(hop(game, "up").game.lives).toBe(3);
  });
});

describe("home bays", () => {
  it("fills a bay, rejects a wall or full bay, and clears the level when all are home", () => {
    const game = createFrogger();
    game.state = "playing";

    const land = (col: number) => {
      game.frog = { x: col * CELL + CELL / 2, row: ROWS - 2 };
      return hop(game, "up").events.map((event) => event.kind);
    };

    expect(land(1)).toContain("splash");
    expect(game.lives).toBe(2);

    expect(land(0)).toContain("home");
    expect(game.homes[0]).toBe(true);
    expect(land(0)).toContain("splash");

    for (const col of HOME_COLS.slice(1)) land(col);
    expect(game.state).toBe("cleared");
    const next = hop(game, "up").game;
    expect(next.level).toBe(2);
    expect(next.homes.every((home) => !home)).toBe(true);
  });
});

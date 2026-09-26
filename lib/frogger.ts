/**
 * A small Frogger-style game, kept free of the DOM so it can be tested.
 * Rows count up from the start pavement (0) to the home bays (ROWS - 1).
 * Lane traffic is a pure function of time, so the state stays tiny.
 */

export const WIDTH = 360;
export const HEIGHT = 540;
export const CELL = 40;
export const COLS = 9;
export const ROWS = 12;
export const TOP = 40;

const MARGIN = 180;
const PERIOD = WIDTH + MARGIN * 2;
const FROG_W = 26;
/** Home bays sit in the even columns of the top row. */
export const HOME_COLS = [0, 2, 4, 6, 8];
export const MEDIAN_ROW = 6;

export type LaneKind = "car" | "truck" | "log" | "turtle";

export type Lane = {
  row: number;
  kind: LaneKind;
  speed: number;
  width: number;
  count: number;
  colour: string;
};

const LANES: Lane[] = [
  { row: 1, kind: "car", speed: -60, width: 44, count: 3, colour: "#ff2e93" },
  { row: 2, kind: "car", speed: 80, width: 44, count: 3, colour: "#26e7ff" },
  { row: 3, kind: "truck", speed: -50, width: 84, count: 2, colour: "#ff8a3d" },
  { row: 4, kind: "car", speed: 110, width: 40, count: 2, colour: "#ffcc33" },
  { row: 5, kind: "car", speed: -70, width: 44, count: 3, colour: "#b37bff" },
  { row: 7, kind: "log", speed: 50, width: 140, count: 2, colour: "#ff8a3d" },
  { row: 8, kind: "turtle", speed: -60, width: 100, count: 3, colour: "#3dffa6" },
  { row: 9, kind: "log", speed: 80, width: 180, count: 2, colour: "#ff8a3d" },
  { row: 10, kind: "log", speed: -45, width: 120, count: 3, colour: "#ff8a3d" },
];

export type Direction = "up" | "down" | "left" | "right";

export type FroggerState = "ready" | "playing" | "cleared" | "over";

export type Frogger = {
  t: number;
  frog: { x: number; row: number };
  homes: boolean[];
  furthest: number;
  score: number;
  lives: number;
  level: number;
  state: FroggerState;
};

export type FroggerEvent =
  | { kind: "hop" }
  | { kind: "points"; points: number; x: number; y: number }
  | { kind: "home"; points: number; x: number; y: number }
  | { kind: "splat"; x: number; y: number }
  | { kind: "splash"; x: number; y: number }
  | { kind: "cleared" }
  | { kind: "over" };

export function lanes(): Lane[] {
  return LANES;
}

export function laneFor(row: number): Lane | undefined {
  return LANES.find((lane) => lane.row === row);
}

export function isRiver(row: number): boolean {
  return row > MEDIAN_ROW && row < ROWS - 1;
}

export function rowY(row: number): number {
  return TOP + (ROWS - 1 - row) * CELL;
}

function speedFactor(level: number): number {
  return 1 + (level - 1) * 0.15;
}

function mod(value: number, by: number): number {
  return ((value % by) + by) % by;
}

/** Left edges of every item in a lane at time `t`. */
export function laneItems(lane: Lane, t: number, level = 1): number[] {
  const shift = lane.speed * speedFactor(level) * t;
  return Array.from(
    { length: lane.count },
    (_, i) => mod((i * PERIOD) / lane.count + shift, PERIOD) - MARGIN,
  );
}

function startFrog() {
  return { x: CELL * 4 + CELL / 2, row: 0 };
}

export function createFrogger(level = 1, score = 0, lives = 3): Frogger {
  return {
    t: 0,
    frog: startFrog(),
    homes: HOME_COLS.map(() => false),
    furthest: 0,
    score,
    lives,
    level,
    state: "ready",
  };
}

function loseLife(game: Frogger, kind: "splat" | "splash"): FroggerEvent[] {
  const events: FroggerEvent[] = [
    { kind, x: game.frog.x, y: rowY(game.frog.row) + CELL / 2 },
  ];
  game.lives -= 1;
  game.frog = startFrog();
  game.furthest = 0;
  if (game.lives <= 0) {
    game.state = "over";
    events.push({ kind: "over" });
  }
  return events;
}

function reachTop(game: Frogger): FroggerEvent[] {
  const col = Math.round((game.frog.x - CELL / 2) / CELL);
  const slot = HOME_COLS.indexOf(col);
  if (slot < 0 || game.homes[slot]) return loseLife(game, "splash");

  game.homes[slot] = true;
  const points = 50 * game.level;
  game.score += points;
  const events: FroggerEvent[] = [
    { kind: "home", points, x: col * CELL + CELL / 2, y: rowY(ROWS - 1) },
  ];
  game.frog = startFrog();
  game.furthest = 0;
  if (game.homes.every(Boolean)) {
    game.score += 200 * game.level;
    game.state = "cleared";
    events.push({ kind: "cleared" });
  }
  return events;
}

/** One hop. Tapping when the game is waiting starts it, or the next level. */
export function hop(game: Frogger, direction: Direction): { game: Frogger; events: FroggerEvent[] } {
  if (game.state === "cleared") return { game: createFrogger(game.level + 1, game.score, game.lives), events: [] };
  if (game.state === "over") return { game: createFrogger(), events: [] };
  if (game.state === "ready") game.state = "playing";

  const { frog } = game;
  if (direction === "up") frog.row = Math.min(ROWS - 1, frog.row + 1);
  if (direction === "down") frog.row = Math.max(0, frog.row - 1);
  if (direction === "left") frog.x = Math.max(CELL / 2, frog.x - CELL);
  if (direction === "right") frog.x = Math.min(WIDTH - CELL / 2, frog.x + CELL);
  // Snap to the grid when landing on solid ground.
  if (!isRiver(frog.row)) frog.x = Math.round((frog.x - CELL / 2) / CELL) * CELL + CELL / 2;

  const events: FroggerEvent[] = [{ kind: "hop" }];
  if (frog.row > game.furthest) {
    game.furthest = frog.row;
    game.score += 10;
    events.push({ kind: "points", points: 10, x: frog.x, y: rowY(frog.row) });
  }
  if (frog.row === ROWS - 1) events.push(...reachTop(game));
  else events.push(...check(game));
  return { game, events };
}

/** Squashed on the road, or drowned / swept off in the river. */
function check(game: Frogger): FroggerEvent[] {
  const { frog } = game;
  const lane = laneFor(frog.row);
  if (!lane) return [];
  const left = frog.x - FROG_W / 2;
  const right = frog.x + FROG_W / 2;
  const items = laneItems(lane, game.t, game.level);

  if (isRiver(frog.row)) {
    const riding = items.some((x) => frog.x >= x && frog.x <= x + lane.width);
    if (!riding || frog.x < 0 || frog.x > WIDTH) return loseLife(game, "splash");
    return [];
  }
  const hit = items.some((x) => right - 4 > x && left + 4 < x + lane.width);
  return hit ? loseLife(game, "splat") : [];
}

/** Advance traffic by `dt` seconds, carrying the frog if it is on a log. */
export function stepFrogger(game: Frogger, dt: number): FroggerEvent[] {
  if (game.state !== "playing") return [];
  const h = Math.min(dt, 0.05);
  game.t += h;
  const lane = laneFor(game.frog.row);
  if (lane && isRiver(game.frog.row)) {
    game.frog.x += lane.speed * speedFactor(game.level) * h;
  }
  return check(game);
}

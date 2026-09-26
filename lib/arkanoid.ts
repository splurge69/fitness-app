/**
 * A small Arkanoid-style breakout game, kept free of the DOM so it can be tested.
 * Everything runs in fixed logical units; the canvas scales it to fit.
 */

export const WIDTH = 360;
export const HEIGHT = 540;

const COLS = 8;
const SIDE = 12;
const GAP = 4;
const TOP = 70;
const BRICK_H = 16;
const PADDLE_Y = HEIGHT - 48;
const BALL_R = 6;
const MAX_BOUNCE = (60 * Math.PI) / 180;

export const ROW_COLOURS = ["#ff2e93", "#ff8a3d", "#ffcc33", "#3dffa6", "#26e7ff", "#b37bff"];

export type Brick = {
  x: number;
  y: number;
  w: number;
  h: number;
  hits: number;
  colour: string;
};

export type Ball = { x: number; y: number; vx: number; vy: number; r: number };

export type GameState = "ready" | "playing" | "cleared" | "over";

export type Game = {
  paddle: { x: number; y: number; w: number; h: number };
  ball: Ball;
  bricks: Brick[];
  score: number;
  lives: number;
  level: number;
  combo: number;
  state: GameState;
};

export type GameEvent =
  | { kind: "brick"; x: number; y: number; points: number; combo: number }
  | { kind: "paddle" }
  | { kind: "life-lost" }
  | { kind: "cleared" }
  | { kind: "over" };

export function speedFor(level: number): number {
  return 300 + (level - 1) * 30;
}

export function buildBricks(level: number): Brick[] {
  const rows = Math.min(4 + level, ROW_COLOURS.length);
  const w = (WIDTH - SIDE * 2 - GAP * (COLS - 1)) / COLS;
  const bricks: Brick[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < COLS; col++) {
      // From level 2 the top row is chrome and takes two hits.
      bricks.push({
        x: SIDE + col * (w + GAP),
        y: TOP + row * (BRICK_H + GAP),
        w,
        h: BRICK_H,
        hits: level >= 2 && row === 0 ? 2 : 1,
        colour: ROW_COLOURS[row],
      });
    }
  }
  return bricks;
}

function restingBall(paddle: Game["paddle"]): Ball {
  return { x: paddle.x, y: paddle.y - BALL_R - 1, vx: 0, vy: 0, r: BALL_R };
}

export function createGame(level = 1, score = 0, lives = 3): Game {
  const paddle = { x: WIDTH / 2, y: PADDLE_Y, w: 72, h: 12 };
  return {
    paddle,
    ball: restingBall(paddle),
    bricks: buildBricks(level),
    score,
    lives,
    level,
    combo: 0,
    state: "ready",
  };
}

/** Centre the paddle on `x`, kept inside the walls. The resting ball rides along. */
export function movePaddle(game: Game, x: number): void {
  const half = game.paddle.w / 2;
  game.paddle.x = Math.min(WIDTH - half, Math.max(half, x));
  if (game.state === "ready") game.ball = restingBall(game.paddle);
}

/** Tap to serve, or to start the next level / a new game. */
export function launch(game: Game): Game {
  if (game.state === "cleared") return createGame(game.level + 1, game.score, game.lives);
  if (game.state === "over") return createGame();
  if (game.state === "ready") {
    const speed = speedFor(game.level);
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.6;
    game.ball.vx = Math.cos(angle) * speed;
    game.ball.vy = Math.sin(angle) * speed;
    game.state = "playing";
  }
  return game;
}

/** Bounce off the paddle at an angle set by where it hit, like the arcade. */
export function paddleBounce(ball: Ball, paddle: Game["paddle"], speed: number): void {
  const offset = Math.max(-1, Math.min(1, (ball.x - paddle.x) / (paddle.w / 2)));
  const angle = offset * MAX_BOUNCE;
  ball.vx = Math.sin(angle) * speed;
  ball.vy = -Math.cos(angle) * speed;
  ball.y = paddle.y - ball.r - 0.5;
}

function hitsRect(ball: Ball, x: number, y: number, w: number, h: number): boolean {
  const nx = Math.max(x, Math.min(ball.x, x + w));
  const ny = Math.max(y, Math.min(ball.y, y + h));
  return (ball.x - nx) ** 2 + (ball.y - ny) ** 2 <= ball.r ** 2;
}

/** Advance the game by `dt` seconds. Mutates `game` and reports what happened. */
export function step(game: Game, dt: number): GameEvent[] {
  if (game.state !== "playing") return [];
  const events: GameEvent[] = [];
  const { ball, paddle } = game;
  const speed = speedFor(game.level);
  // Small sub-steps so a fast ball cannot tunnel through a brick.
  const steps = Math.max(1, Math.ceil((speed * dt) / (ball.r * 0.8)));
  const h = Math.min(dt, 0.05) / steps;

  for (let i = 0; i < steps; i++) {
    ball.x += ball.vx * h;
    ball.y += ball.vy * h;

    if (ball.x - ball.r < 0) {
      ball.x = ball.r;
      ball.vx = Math.abs(ball.vx);
    } else if (ball.x + ball.r > WIDTH) {
      ball.x = WIDTH - ball.r;
      ball.vx = -Math.abs(ball.vx);
    }
    if (ball.y - ball.r < 0) {
      ball.y = ball.r;
      ball.vy = Math.abs(ball.vy);
    }

    if (
      ball.vy > 0 &&
      hitsRect(ball, paddle.x - paddle.w / 2, paddle.y, paddle.w, paddle.h)
    ) {
      paddleBounce(ball, paddle, speed);
      game.combo = 0;
      events.push({ kind: "paddle" });
    }

    const index = game.bricks.findIndex((brick) =>
      hitsRect(ball, brick.x, brick.y, brick.w, brick.h),
    );
    if (index >= 0) {
      const brick = game.bricks[index];
      const overlapX = Math.min(ball.x + ball.r - brick.x, brick.x + brick.w - (ball.x - ball.r));
      const overlapY = Math.min(ball.y + ball.r - brick.y, brick.y + brick.h - (ball.y - ball.r));
      if (overlapX < overlapY) ball.vx = ball.x < brick.x + brick.w / 2 ? -Math.abs(ball.vx) : Math.abs(ball.vx);
      else ball.vy = ball.y < brick.y + brick.h / 2 ? -Math.abs(ball.vy) : Math.abs(ball.vy);

      brick.hits -= 1;
      if (brick.hits <= 0) {
        game.bricks.splice(index, 1);
        game.combo += 1;
        const points = 10 * game.level * game.combo;
        game.score += points;
        events.push({
          kind: "brick",
          x: brick.x + brick.w / 2,
          y: brick.y,
          points,
          combo: game.combo,
        });
        if (game.bricks.length === 0) {
          game.state = "cleared";
          events.push({ kind: "cleared" });
          return events;
        }
      }
    }

    if (ball.y - ball.r > HEIGHT) {
      game.lives -= 1;
      game.combo = 0;
      if (game.lives <= 0) {
        game.state = "over";
        events.push({ kind: "over" });
      } else {
        game.state = "ready";
        game.ball = restingBall(paddle);
        events.push({ kind: "life-lost" });
      }
      return events;
    }
  }

  return events;
}

const SHOUTS = ["RADICAL!", "TUBULAR!", "PUMP IT!", "TOTALLY!", "MAX POWER!", "GNARLY!"];

export function shoutFor(combo: number): string | null {
  if (combo < 3) return null;
  return SHOUTS[(combo - 3) % SHOUTS.length];
}

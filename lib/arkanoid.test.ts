import { describe, expect, it } from "vitest";
import {
  HEIGHT,
  WIDTH,
  buildBricks,
  createGame,
  launch,
  movePaddle,
  paddleBounce,
  shoutFor,
  speedFor,
  step,
} from "./arkanoid";

describe("buildBricks", () => {
  it("adds a row per level and makes the top row chrome from level 2", () => {
    expect(buildBricks(1)).toHaveLength(5 * 8);
    expect(buildBricks(1).every((brick) => brick.hits === 1)).toBe(true);
    const level2 = buildBricks(2);
    expect(level2).toHaveLength(6 * 8);
    expect(level2.slice(0, 8).every((brick) => brick.hits === 2)).toBe(true);
  });

  it("keeps every brick inside the playfield", () => {
    for (const brick of buildBricks(5)) {
      expect(brick.x).toBeGreaterThanOrEqual(0);
      expect(brick.x + brick.w).toBeLessThanOrEqual(WIDTH);
    }
  });
});

describe("paddle", () => {
  it("stays inside the walls and carries the resting ball", () => {
    const game = createGame();
    movePaddle(game, -100);
    expect(game.paddle.x).toBe(game.paddle.w / 2);
    expect(game.ball.x).toBe(game.paddle.x);
    movePaddle(game, 1000);
    expect(game.paddle.x).toBe(WIDTH - game.paddle.w / 2);
  });

  it("sends the ball straight up from the centre and angled from the edge", () => {
    const game = createGame();
    const speed = speedFor(1);
    const ball = { ...game.ball, x: game.paddle.x, vy: 100 };
    paddleBounce(ball, game.paddle, speed);
    expect(ball.vx).toBeCloseTo(0);
    expect(ball.vy).toBeCloseTo(-speed);

    const edge = { ...game.ball, x: game.paddle.x + game.paddle.w / 2, vy: 100 };
    paddleBounce(edge, game.paddle, speed);
    expect(edge.vx).toBeGreaterThan(0);
    expect(edge.vy).toBeLessThan(0);
    expect(Math.hypot(edge.vx, edge.vy)).toBeCloseTo(speed);
  });
});

describe("step", () => {
  it("does nothing until served", () => {
    const game = createGame();
    expect(step(game, 0.016)).toEqual([]);
    launch(game);
    expect(game.state).toBe("playing");
  });

  it("breaks a brick, scores and bounces back down", () => {
    const game = createGame();
    const target = game.bricks[game.bricks.length - 1];
    game.state = "playing";
    game.ball = {
      x: target.x + target.w / 2,
      y: target.y + target.h + 10,
      vx: 0,
      vy: -speedFor(1),
      r: 6,
    };
    const count = game.bricks.length;
    const events = step(game, 0.05);
    expect(game.bricks).toHaveLength(count - 1);
    expect(game.score).toBe(10);
    expect(game.ball.vy).toBeGreaterThan(0);
    expect(events[0]).toMatchObject({ kind: "brick", points: 10, combo: 1 });
  });

  it("loses a life when the ball drops, and ends the game on the last one", () => {
    const game = createGame(1, 0, 2);
    game.state = "playing";
    game.ball = { x: 20, y: HEIGHT - 2, vx: 0, vy: 300, r: 6 };
    expect(step(game, 0.05)).toEqual([{ kind: "life-lost" }]);
    expect(game.lives).toBe(1);
    expect(game.state).toBe("ready");

    game.state = "playing";
    game.ball = { x: 20, y: HEIGHT - 2, vx: 0, vy: 300, r: 6 };
    expect(step(game, 0.05)).toEqual([{ kind: "over" }]);
    expect(launch(game).lives).toBe(3);
  });

  it("clears the level on the last brick and carries score into the next", () => {
    const game = createGame();
    game.bricks = [game.bricks[0]];
    const [brick] = game.bricks;
    game.state = "playing";
    game.ball = { x: brick.x + brick.w / 2, y: brick.y + brick.h + 8, vx: 0, vy: -300, r: 6 };
    expect(step(game, 0.05).map((event) => event.kind)).toEqual(["brick", "cleared"]);
    const next = launch(game);
    expect(next.level).toBe(2);
    expect(next.score).toBe(10);
  });
});

describe("shoutFor", () => {
  it("cheers from a three-brick combo", () => {
    expect(shoutFor(2)).toBeNull();
    expect(shoutFor(3)).toBe("RADICAL!");
  });
});

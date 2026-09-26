"use client";

import { useEffect, useRef } from "react";
import {
  HEIGHT,
  WIDTH,
  createGame,
  launch,
  movePaddle,
  shoutFor,
  step,
  type Game,
} from "@/lib/arkanoid";
import {
  NEON,
  agePopups,
  drawBanner,
  drawHud,
  drawPopups,
  readBest,
  saveBest,
  startLoop,
  toGame,
  type Popup,
} from "./canvas";

const BEST_KEY = "break-game:best";

export function BrickBreaker() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let game: Game = createGame();
    let best = readBest(BEST_KEY);
    let popups: Popup[] = [];

    const x = (event: PointerEvent) => toGame(canvas, WIDTH, HEIGHT, event).x;
    const onMove = (event: PointerEvent) => movePaddle(game, x(event));
    const onDown = (event: PointerEvent) => {
      canvas.setPointerCapture(event.pointerId);
      movePaddle(game, x(event));
      if (game.state !== "playing") {
        game = launch(game);
        movePaddle(game, x(event));
      }
    };
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerdown", onDown);

    const stop = startLoop(canvas, WIDTH, HEIGHT, (ctx, dt) => {
      for (const event of step(game, dt)) {
        if (event.kind !== "brick") continue;
        popups.push({ text: `+${event.points}`, x: event.x, y: event.y, age: 0, colour: NEON.sun });
        const shout = shoutFor(event.combo);
        if (shout) popups.push({ text: shout, x: WIDTH / 2, y: HEIGHT / 2, age: 0, colour: NEON.pink });
      }
      if (game.score > best) {
        best = game.score;
        saveBest(BEST_KEY, best);
      }
      popups = agePopups(popups, dt);
      draw(ctx, game, best, popups);
    });

    return () => {
      stop();
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerdown", onDown);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-label="Brick breaker. Drag to move the paddle, tap to serve."
      className="block max-h-full w-full touch-none rounded-3xl border-2 border-accent"
      style={{ aspectRatio: `${WIDTH} / ${HEIGHT}`, maxWidth: `calc((100dvh - 12rem) * ${WIDTH / HEIGHT})` }}
    />
  );
}

function draw(ctx: CanvasRenderingContext2D, game: Game, best: number, popups: Popup[]) {
  // Night sky fading into a neon floor grid.
  const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  sky.addColorStop(0, "#1a0a33");
  sky.addColorStop(1, "#12081f");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.save();
  ctx.strokeStyle = "rgba(255, 46, 147, 0.25)";
  ctx.lineWidth = 1;
  const horizon = HEIGHT - 120;
  for (let gx = -WIDTH; gx <= WIDTH * 2; gx += 45) {
    ctx.beginPath();
    ctx.moveTo(WIDTH / 2, horizon);
    ctx.lineTo(gx, HEIGHT);
    ctx.stroke();
  }
  for (let i = 0; i < 6; i++) {
    const y = horizon + 120 * (i / 6) ** 1.8;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(WIDTH, y);
    ctx.stroke();
  }
  ctx.restore();

  drawHud(ctx, WIDTH, { score: game.score, best, level: game.level, lives: game.lives });

  for (const brick of game.bricks) {
    ctx.save();
    const chrome = brick.hits > 1;
    ctx.shadowColor = chrome ? "#d9e4ff" : brick.colour;
    ctx.shadowBlur = 10;
    if (chrome) {
      const metal = ctx.createLinearGradient(0, brick.y, 0, brick.y + brick.h);
      metal.addColorStop(0, "#ffffff");
      metal.addColorStop(0.5, "#6a5a9e");
      metal.addColorStop(1, "#ffb3de");
      ctx.fillStyle = metal;
    } else {
      ctx.fillStyle = brick.colour;
    }
    ctx.fillRect(brick.x, brick.y, brick.w, brick.h);
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
    ctx.fillRect(brick.x, brick.y, brick.w, 3);
    ctx.restore();
  }

  const { paddle, ball } = game;
  ctx.save();
  ctx.shadowColor = NEON.cyan;
  ctx.shadowBlur = 16;
  ctx.fillStyle = NEON.cyan;
  ctx.beginPath();
  ctx.roundRect(paddle.x - paddle.w / 2, paddle.y, paddle.w, paddle.h, 4);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.shadowColor = "#ffffff";
  ctx.shadowBlur = 14;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  drawPopups(ctx, popups);

  if (game.state === "ready") {
    drawBanner(ctx, WIDTH, HEIGHT, game.score === 0 && game.level === 1 ? "READY?" : "GO AGAIN!", "Tap to serve");
  } else if (game.state === "cleared") {
    drawBanner(ctx, WIDTH, HEIGHT, "LEVEL CLEAR!", "Tap for the next one");
  } else if (game.state === "over") {
    drawBanner(ctx, WIDTH, HEIGHT, "GAME OVER", "Tap to insert coin");
  }
}

"use client";

import { useEffect, useRef, useState } from "react";
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
import { formatClock } from "@/lib/workout";

const PEP_TALK = [
  "Breathe in. Shake it out. Next set is yours.",
  "Sip some water between rounds.",
  "Every rep counts. So does rest.",
  "Your knee thanks you for the patience.",
  "Strong today, stronger next week.",
  "Stay loose. You have got this.",
];

type Popup = { text: string; x: number; y: number; age: number; colour: string };

const BEST_KEY = "break-game:best";

function readBest(): number {
  try {
    return Number(window.localStorage.getItem(BEST_KEY)) || 0;
  } catch {
    return 0;
  }
}

function saveBest(score: number) {
  try {
    window.localStorage.setItem(BEST_KEY, String(score));
  } catch {}
}

/** Full-screen break with a timer, a pep talk and a neon brick breaker. */
export function BreakGame({ onClose }: { onClose: () => void }) {
  const [openedAt] = useState(() => Date.now());
  const [now, setNow] = useState(openedAt);
  const [pep, setPep] = useState(0);

  useEffect(() => {
    const clock = window.setInterval(() => setNow(Date.now()), 500);
    const talk = window.setInterval(() => setPep((i) => (i + 1) % PEP_TALK.length), 8000);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      window.clearInterval(clock);
      window.clearInterval(talk);
      document.body.style.overflow = overflow;
    };
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Take a break"
      className="fixed inset-0 z-50 flex flex-col bg-paper/95 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur"
    >
      <div className="mx-auto flex w-full max-w-lg items-end justify-between gap-3">
        <div>
          <p className="font-display text-sm uppercase tracking-[0.2em] text-accent">
            Break · <span className="font-mono text-base">{formatClock((now - openedAt) / 1000)}</span>
          </p>
          <h2 className="chrome font-display text-3xl uppercase italic">Take a break</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-2xl bg-electric px-4 py-3 font-display text-base uppercase tracking-[0.08em] text-accent-ink"
        >
          Back to it
        </button>
      </div>
      <p className="mx-auto mt-2 w-full max-w-lg text-sm text-muted">{PEP_TALK[pep]}</p>
      <div className="mx-auto mt-3 flex min-h-0 w-full max-w-lg flex-1 items-center justify-center">
        <BrickBreaker />
      </div>
    </div>
  );
}

function BrickBreaker() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let game: Game = createGame();
    let best = readBest();
    let popups: Popup[] = [];
    let frame = 0;
    let last = performance.now();

    const resize = () => {
      const ratio = window.devicePixelRatio || 1;
      canvas.width = WIDTH * ratio;
      canvas.height = HEIGHT * ratio;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    };
    resize();

    const toGameX = (clientX: number) => {
      const rect = canvas.getBoundingClientRect();
      return ((clientX - rect.left) / rect.width) * WIDTH;
    };

    const onMove = (event: PointerEvent) => movePaddle(game, toGameX(event.clientX));
    const onDown = (event: PointerEvent) => {
      canvas.setPointerCapture(event.pointerId);
      movePaddle(game, toGameX(event.clientX));
      if (game.state !== "playing") {
        game = launch(game);
        movePaddle(game, toGameX(event.clientX));
      }
    };
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerdown", onDown);

    const loop = (time: number) => {
      const dt = Math.min(0.05, (time - last) / 1000);
      last = time;

      for (const event of step(game, dt)) {
        if (event.kind === "brick") {
          const shout = shoutFor(event.combo);
          popups.push({ text: `+${event.points}`, x: event.x, y: event.y, age: 0, colour: "#ffcc33" });
          if (shout) popups.push({ text: shout, x: WIDTH / 2, y: HEIGHT / 2, age: 0, colour: "#ff2e93" });
        }
      }
      if (game.score > best) {
        best = game.score;
        saveBest(best);
      }
      popups = popups
        .map((popup) => ({ ...popup, age: popup.age + dt, y: popup.y - dt * 30 }))
        .filter((popup) => popup.age < 1.1);

      draw(ctx, game, best, popups);
      frame = requestAnimationFrame(loop);
    };

    const start = () => {
      last = performance.now();
      frame = requestAnimationFrame(loop);
    };
    const onVisibility = () => {
      cancelAnimationFrame(frame);
      if (!document.hidden) start();
    };
    document.addEventListener("visibilitychange", onVisibility);
    start();

    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerdown", onDown);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-label="Brick breaker game. Drag to move the paddle, tap to serve."
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
  for (let x = -WIDTH; x <= WIDTH * 2; x += 45) {
    ctx.beginPath();
    ctx.moveTo(WIDTH / 2, horizon);
    ctx.lineTo(x, HEIGHT);
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

  // HUD
  ctx.font = '22px "VT323", monospace';
  ctx.textBaseline = "top";
  ctx.fillStyle = "#fbf4ff";
  ctx.textAlign = "left";
  ctx.fillText(`SCORE ${game.score}`, 12, 14);
  ctx.textAlign = "center";
  ctx.fillStyle = "#b7a2d6";
  ctx.fillText(`HI ${best}`, WIDTH / 2, 14);
  ctx.textAlign = "right";
  ctx.fillStyle = "#ff2e93";
  ctx.fillText(`LV ${game.level} ${"♥".repeat(Math.max(0, game.lives))}`, WIDTH - 12, 14);

  // Bricks
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

  // Paddle
  const { paddle, ball } = game;
  ctx.save();
  ctx.shadowColor = "#26e7ff";
  ctx.shadowBlur = 16;
  ctx.fillStyle = "#26e7ff";
  ctx.beginPath();
  ctx.roundRect(paddle.x - paddle.w / 2, paddle.y, paddle.w, paddle.h, 4);
  ctx.fill();
  ctx.restore();

  // Ball
  ctx.save();
  ctx.shadowColor = "#ffffff";
  ctx.shadowBlur = 14;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Score pops and combo shouts
  ctx.textAlign = "center";
  for (const popup of popups) {
    ctx.globalAlpha = Math.max(0, 1 - popup.age);
    ctx.fillStyle = popup.colour;
    const big = popup.text.endsWith("!");
    ctx.font = big ? 'italic 40px "Racing Sans One", sans-serif' : '20px "VT323", monospace';
    ctx.fillText(popup.text, popup.x, popup.y);
  }
  ctx.globalAlpha = 1;

  const banner: Record<Exclude<Game["state"], "playing">, [string, string]> = {
    ready: [game.score === 0 && game.level === 1 ? "READY?" : "GO AGAIN!", "Tap to serve"],
    cleared: ["LEVEL CLEAR!", "Tap for the next one"],
    over: ["GAME OVER", "Tap to insert coin"],
  };
  if (game.state !== "playing") {
    const [title, hint] = banner[game.state];
    ctx.save();
    ctx.textAlign = "center";
    ctx.shadowColor = "#ff2e93";
    ctx.shadowBlur = 18;
    ctx.fillStyle = "#fbf4ff";
    ctx.font = 'italic 44px "Racing Sans One", sans-serif';
    ctx.fillText(title, WIDTH / 2, HEIGHT / 2 + 10);
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#26e7ff";
    ctx.font = '24px "VT323", monospace';
    ctx.fillText(hint, WIDTH / 2, HEIGHT / 2 + 62);
    ctx.restore();
  }
}

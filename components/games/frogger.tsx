"use client";

import { useEffect, useRef } from "react";
import {
  CELL,
  HEIGHT,
  HOME_COLS,
  MEDIAN_ROW,
  ROWS,
  WIDTH,
  createFrogger,
  hop,
  isRiver,
  laneItems,
  lanes,
  rowY,
  stepFrogger,
  type Direction,
  type Frogger,
  type FroggerEvent,
  type Lane,
} from "@/lib/frogger";
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

const BEST_KEY = "frogger:best";
const KEYS: Record<string, Direction> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
};

export function FroggerGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let game: Frogger = createFrogger();
    let best = readBest(BEST_KEY);
    let popups: Popup[] = [];
    let hopAge = 1;
    let start: { x: number; y: number } | null = null;

    const react = (events: FroggerEvent[]) => {
      for (const event of events) {
        if (event.kind === "hop") hopAge = 0;
        if (event.kind === "points") {
          popups.push({ text: `+${event.points}`, x: event.x, y: event.y, age: 0, colour: NEON.sun });
        }
        if (event.kind === "home") {
          popups.push({ text: `+${event.points}`, x: event.x, y: event.y + 30, age: 0, colour: NEON.sun });
          popups.push({ text: "HOME!", x: WIDTH / 2, y: HEIGHT / 2, age: 0, colour: NEON.green });
        }
        if (event.kind === "splat") {
          popups.push({ text: "SPLAT!", x: WIDTH / 2, y: HEIGHT / 2, age: 0, colour: NEON.pink });
        }
        if (event.kind === "splash") {
          popups.push({ text: "SPLASH!", x: WIDTH / 2, y: HEIGHT / 2, age: 0, colour: NEON.cyan });
        }
      }
    };

    const move = (direction: Direction) => {
      const result = hop(game, direction);
      game = result.game;
      react(result.events);
    };

    const onDown = (event: PointerEvent) => {
      canvas.setPointerCapture(event.pointerId);
      start = toGame(canvas, WIDTH, HEIGHT, event);
    };
    const onUp = (event: PointerEvent) => {
      if (!start) return;
      const end = toGame(canvas, WIDTH, HEIGHT, event);
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      start = null;
      if (Math.hypot(dx, dy) < 18) return move("up");
      if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? "right" : "left");
      else move(dy > 0 ? "down" : "up");
    };
    const onKey = (event: KeyboardEvent) => {
      const direction = KEYS[event.key];
      if (!direction) return;
      event.preventDefault();
      move(direction);
    };
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointerup", onUp);
    window.addEventListener("keydown", onKey);

    const stop = startLoop(canvas, WIDTH, HEIGHT, (ctx, dt) => {
      react(stepFrogger(game, dt));
      if (game.score > best) {
        best = game.score;
        saveBest(BEST_KEY, best);
      }
      hopAge += dt;
      popups = agePopups(popups, dt);
      draw(ctx, game, best, popups, hopAge);
    });

    return () => {
      stop();
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointerup", onUp);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-label="Frogger. Swipe to hop, tap to hop forward."
      className="block max-h-full w-full touch-none rounded-3xl border-2 border-accent"
      style={{ aspectRatio: `${WIDTH} / ${HEIGHT}`, maxWidth: `calc((100dvh - 12rem) * ${WIDTH / HEIGHT})` }}
    />
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  game: Frogger,
  best: number,
  popups: Popup[],
  hopAge: number,
) {
  ctx.fillStyle = "#12081f";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Ground: pavements, road, river and the home bank.
  for (let row = 0; row < ROWS; row++) {
    const y = rowY(row);
    if (row === 0 || row === MEDIAN_ROW) {
      ctx.fillStyle = "#2a1450";
      ctx.fillRect(0, y, WIDTH, CELL);
      ctx.fillStyle = NEON.pink;
      ctx.fillRect(0, y, WIDTH, 2);
      ctx.fillRect(0, y + CELL - 2, WIDTH, 2);
    } else if (isRiver(row)) {
      ctx.fillStyle = "#0b1646";
      ctx.fillRect(0, y, WIDTH, CELL);
      ctx.strokeStyle = "rgba(38, 231, 255, 0.18)";
      ctx.lineWidth = 1.5;
      const drift = (game.t * 20 * (row % 2 ? 1 : -1)) % 30;
      ctx.beginPath();
      for (let x = -30 + drift; x < WIDTH + 30; x += 30) {
        ctx.moveTo(x, y + CELL / 2);
        ctx.quadraticCurveTo(x + 7.5, y + CELL / 2 - 4, x + 15, y + CELL / 2);
      }
      ctx.stroke();
    } else if (row === ROWS - 1) {
      ctx.fillStyle = "#0b1646";
      ctx.fillRect(0, y, WIDTH, CELL);
    } else {
      ctx.fillStyle = "#170b2b";
      ctx.fillRect(0, y, WIDTH, CELL);
      if (row < MEDIAN_ROW - 1) {
        ctx.fillStyle = "rgba(255, 46, 147, 0.5)";
        for (let x = 6; x < WIDTH; x += 30) ctx.fillRect(x, y, 14, 2);
      }
    }
  }

  // Home bank: neon hedges with five bays.
  const homeY = rowY(ROWS - 1);
  ctx.save();
  ctx.shadowColor = NEON.green;
  ctx.shadowBlur = 10;
  ctx.fillStyle = "#1e7a52";
  for (let col = 0; col < 9; col++) {
    if (HOME_COLS.includes(col)) continue;
    ctx.fillRect(col * CELL, homeY, CELL, CELL);
  }
  ctx.fillRect(0, homeY, WIDTH, 6);
  ctx.restore();
  HOME_COLS.forEach((col, slot) => {
    const x = col * CELL + CELL / 2;
    ctx.strokeStyle = NEON.pink;
    ctx.lineWidth = 2;
    ctx.strokeRect(col * CELL + 4, homeY + 8, CELL - 8, CELL - 12);
    if (game.homes[slot]) drawFrog(ctx, x, homeY + CELL / 2 + 2, 0.8, 1);
  });

  for (const lane of lanes()) {
    for (const x of laneItems(lane, game.t, game.level)) drawItem(ctx, lane, x, rowY(lane.row));
  }

  if (game.state !== "over") {
    const bounce = hopAge < 0.15 ? 1 + Math.sin((hopAge / 0.15) * Math.PI) * 0.25 : 1;
    drawFrog(ctx, game.frog.x, rowY(game.frog.row) + CELL / 2, bounce, 1);
  }

  drawHud(ctx, WIDTH, { score: game.score, best, level: game.level, lives: game.lives });

  ctx.save();
  ctx.fillStyle = NEON.muted;
  ctx.font = '18px "VT323", monospace';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("SWIPE TO HOP · TAP = FORWARD", WIDTH / 2, HEIGHT - 10);
  ctx.restore();

  drawPopups(ctx, popups);

  if (game.state === "ready") {
    drawBanner(ctx, WIDTH, HEIGHT, game.score === 0 && game.level === 1 ? "READY?" : "HOP ON!", "Tap to start");
  } else if (game.state === "cleared") {
    drawBanner(ctx, WIDTH, HEIGHT, "ALL HOME!", "Tap for the next level");
  } else if (game.state === "over") {
    drawBanner(ctx, WIDTH, HEIGHT, "GAME OVER", "Tap to insert coin");
  }
}

function drawItem(ctx: CanvasRenderingContext2D, lane: Lane, x: number, y: number) {
  const w = lane.width;
  ctx.save();
  ctx.shadowColor = lane.colour;
  ctx.shadowBlur = 10;
  ctx.fillStyle = lane.colour;

  if (lane.kind === "turtle") {
    const count = Math.round(w / 32);
    for (let i = 0; i < count; i++) {
      const cx = x + (i + 0.5) * (w / count);
      ctx.beginPath();
      ctx.arc(cx, y + CELL / 2, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = "#0b3b2a";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, y + CELL / 2, 7, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 10;
    }
  } else if (lane.kind === "log") {
    ctx.beginPath();
    ctx.roundRect(x, y + 7, w, CELL - 14, 12);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(25, 4, 31, 0.45)";
    ctx.lineWidth = 2;
    for (let gx = x + 18; gx < x + w - 10; gx += 26) {
      ctx.beginPath();
      ctx.moveTo(gx, y + 13);
      ctx.lineTo(gx + 10, y + 13);
      ctx.moveTo(gx + 6, y + CELL - 13);
      ctx.lineTo(gx + 16, y + CELL - 13);
      ctx.stroke();
    }
  } else {
    const facingRight = lane.speed > 0;
    ctx.beginPath();
    ctx.roundRect(x, y + 8, w, CELL - 16, 6);
    ctx.fill();
    ctx.shadowBlur = 0;
    // Windscreen and headlights on the leading edge.
    ctx.fillStyle = "rgba(18, 8, 31, 0.7)";
    const glassX = facingRight ? x + w - 18 : x + 8;
    ctx.fillRect(glassX, y + 12, 10, CELL - 24);
    if (lane.kind === "truck") {
      ctx.fillStyle = "rgba(18, 8, 31, 0.35)";
      ctx.fillRect(facingRight ? x + 4 : x + 26, y + 11, w - 30, CELL - 22);
    }
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "#ffffff";
    ctx.shadowBlur = 8;
    const lampX = facingRight ? x + w - 3 : x + 1;
    ctx.fillRect(lampX, y + 10, 2, 4);
    ctx.fillRect(lampX, y + CELL - 14, 2, 4);
  }
  ctx.restore();
}

function drawFrog(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, alpha: number) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.shadowColor = NEON.green;
  ctx.shadowBlur = 14;
  ctx.fillStyle = NEON.green;
  // Legs
  ctx.fillRect(-14, -10, 6, 8);
  ctx.fillRect(8, -10, 6, 8);
  ctx.fillRect(-14, 4, 6, 9);
  ctx.fillRect(8, 4, 6, 9);
  // Body
  ctx.beginPath();
  ctx.ellipse(0, 0, 11, 13, 0, 0, Math.PI * 2);
  ctx.fill();
  // Eyes
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(-5, -9, 4, 0, Math.PI * 2);
  ctx.arc(5, -9, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#12081f";
  ctx.beginPath();
  ctx.arc(-5, -10, 2, 0, Math.PI * 2);
  ctx.arc(5, -10, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

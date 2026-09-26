/** Shared plumbing for the break games: crisp canvas, frame loop, HUD, banners. */

export const NEON = {
  ink: "#fbf4ff",
  muted: "#b7a2d6",
  pink: "#ff2e93",
  cyan: "#26e7ff",
  sun: "#ffcc33",
  orange: "#ff8a3d",
  green: "#3dffa6",
};

export type Popup = { text: string; x: number; y: number; age: number; colour: string };

/**
 * Size the canvas for the screen's pixel density and run `frame` every
 * animation frame, pausing while the phone is locked or the tab is hidden.
 */
export function startLoop(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  frame: (ctx: CanvasRenderingContext2D, dt: number) => void,
): () => void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};
  const ratio = window.devicePixelRatio || 1;
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

  let id = 0;
  let last = performance.now();
  const tick = (time: number) => {
    const dt = Math.min(0.05, (time - last) / 1000);
    last = time;
    frame(ctx, dt);
    id = requestAnimationFrame(tick);
  };
  const start = () => {
    last = performance.now();
    id = requestAnimationFrame(tick);
  };
  const onVisibility = () => {
    cancelAnimationFrame(id);
    if (!document.hidden) start();
  };
  document.addEventListener("visibilitychange", onVisibility);
  start();

  return () => {
    cancelAnimationFrame(id);
    document.removeEventListener("visibilitychange", onVisibility);
  };
}

/** Convert a pointer position to the game's logical coordinates. */
export function toGame(canvas: HTMLCanvasElement, width: number, height: number, event: PointerEvent) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * width,
    y: ((event.clientY - rect.top) / rect.height) * height,
  };
}

export function readBest(key: string): number {
  try {
    return Number(window.localStorage.getItem(key)) || 0;
  } catch {
    return 0;
  }
}

export function saveBest(key: string, score: number) {
  try {
    window.localStorage.setItem(key, String(score));
  } catch {}
}

export function agePopups(popups: Popup[], dt: number): Popup[] {
  return popups
    .map((popup) => ({ ...popup, age: popup.age + dt, y: popup.y - dt * 30 }))
    .filter((popup) => popup.age < 1.1);
}

export function drawHud(
  ctx: CanvasRenderingContext2D,
  width: number,
  { score, best, level, lives }: { score: number; best: number; level: number; lives: number },
) {
  ctx.save();
  ctx.font = '22px "VT323", monospace';
  ctx.textBaseline = "top";
  ctx.fillStyle = NEON.ink;
  ctx.textAlign = "left";
  ctx.fillText(`SCORE ${score}`, 12, 12);
  ctx.textAlign = "center";
  ctx.fillStyle = NEON.muted;
  ctx.fillText(`HI ${best}`, width / 2, 12);
  ctx.textAlign = "right";
  ctx.fillStyle = NEON.pink;
  ctx.fillText(`LV ${level} ${"♥".repeat(Math.max(0, lives))}`, width - 12, 12);
  ctx.restore();
}

export function drawPopups(ctx: CanvasRenderingContext2D, popups: Popup[]) {
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  for (const popup of popups) {
    ctx.globalAlpha = Math.max(0, 1 - popup.age);
    ctx.fillStyle = popup.colour;
    const big = popup.text.endsWith("!");
    ctx.shadowColor = popup.colour;
    ctx.shadowBlur = big ? 14 : 0;
    ctx.font = big ? 'italic 40px "Racing Sans One", sans-serif' : '20px "VT323", monospace';
    ctx.fillText(popup.text, popup.x, popup.y);
  }
  ctx.restore();
}

export function drawBanner(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  title: string,
  hint: string,
) {
  ctx.save();
  ctx.fillStyle = "rgba(18, 8, 31, 0.55)";
  ctx.fillRect(0, height / 2 - 44, width, 124);
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.shadowColor = NEON.pink;
  ctx.shadowBlur = 18;
  ctx.fillStyle = NEON.ink;
  ctx.font = 'italic 44px "Racing Sans One", sans-serif';
  ctx.fillText(title, width / 2, height / 2 + 10);
  ctx.shadowBlur = 0;
  ctx.fillStyle = NEON.cyan;
  ctx.font = '24px "VT323", monospace';
  ctx.fillText(hint, width / 2, height / 2 + 62);
  ctx.restore();
}

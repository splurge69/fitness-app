"use client";

import { useEffect, useState } from "react";
import { BrickBreaker } from "@/components/games/brick-breaker";
import { FroggerGame } from "@/components/games/frogger";
import { formatClock } from "@/lib/workout";

const PEP_TALK = [
  "Breathe in. Shake it out. Next set is yours.",
  "Sip some water between rounds.",
  "Every rep counts. So does rest.",
  "Your knee thanks you for the patience.",
  "Strong today, stronger next week.",
  "Stay loose. You have got this.",
];

const GAMES = [
  { name: "Brick breaker", Game: BrickBreaker },
  { name: "Frogger", Game: FroggerGame },
];

/** Full-screen break with a timer, a pep talk and a randomly picked arcade game. */
export function BreakGame({ onClose }: { onClose: () => void }) {
  const [openedAt] = useState(() => Date.now());
  const [now, setNow] = useState(openedAt);
  const [pep, setPep] = useState(0);
  const [{ name, Game }] = useState(() => GAMES[Math.floor(Math.random() * GAMES.length)]);

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
            {name} · <span className="font-mono text-base">{formatClock((now - openedAt) / 1000)}</span>
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
        <Game />
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";

export function NumberStepper({
  label,
  value,
  onChange,
  step,
  min = 0,
  suffix,
  decimals = false,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  step: number;
  min?: number;
  suffix: string;
  decimals?: boolean;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const display = draft ?? formatDisplay(value, decimals);

  function commit(next: number) {
    onChange(clamp(next, min, decimals));
    setDraft(null);
  }

  return (
    <div className="rounded-3xl border border-line bg-card p-4">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">
        {label}
      </p>
      <div className="mt-3 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => commit(value - step)}
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-paper text-3xl text-ink"
          aria-label={`Decrease ${label}`}
        >
          −
        </button>
        <label className="flex min-w-0 flex-1 flex-col items-center">
          <span className="sr-only">{label}</span>
          <input
            type="text"
            inputMode={decimals ? "decimal" : "numeric"}
            pattern={decimals ? "[0-9]*[.,]?[0-9]*" : "[0-9]*"}
            enterKeyHint="done"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            value={display}
            onFocus={(event) => {
              setDraft(formatDisplay(value, decimals));
              event.currentTarget.select();
            }}
            onChange={(event) => {
              const raw = event.target.value.replace(",", ".");
              if (!isAllowedDraft(raw, decimals)) return;
              setDraft(raw);
              const parsed = parseDraft(raw);
              if (parsed !== null) onChange(clamp(parsed, min, decimals));
            }}
            onBlur={() => {
              if (draft === null || parseDraft(draft) === null) {
                setDraft(null);
                return;
              }
              commit(parseDraft(draft) ?? value);
            }}
            className="w-full bg-transparent text-center font-mono text-4xl tabular-nums text-ink outline-none"
          />
          <span className="text-sm text-muted">{suffix}</span>
        </label>
        <button
          type="button"
          onClick={() => commit(value + step)}
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-electric text-3xl text-accent-ink"
          aria-label={`Increase ${label}`}
        >
          +
        </button>
      </div>
    </div>
  );
}

function formatDisplay(value: number, decimals: boolean): string {
  if (!decimals) return String(Math.round(value));
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function isAllowedDraft(raw: string, decimals: boolean): boolean {
  if (raw === "") return true;
  return decimals ? /^\d*[.]?\d*$/.test(raw) : /^\d*$/.test(raw);
}

function parseDraft(raw: string): number | null {
  if (raw === "" || raw === ".") return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function clamp(value: number, min: number, decimals: boolean): number {
  const rounded = decimals ? Math.round(value * 10) / 10 : Math.round(value);
  return Math.max(min, rounded);
}

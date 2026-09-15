"use client";

export function NumberStepper({
  label,
  value,
  onChange,
  step,
  min = 0,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  step: number;
  min?: number;
  suffix: string;
}) {
  return (
    <div className="rounded-3xl border border-line bg-card p-4">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">
        {label}
      </p>
      <div className="mt-3 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, Math.round((value - step) * 10) / 10))}
          className="flex h-16 w-16 items-center justify-center rounded-2xl bg-paper text-3xl text-ink"
          aria-label={`Decrease ${label}`}
        >
          −
        </button>
        <p className="font-mono text-4xl tabular-nums text-ink">
          {value}
          <span className="ml-1 text-lg text-muted">{suffix}</span>
        </p>
        <button
          type="button"
          onClick={() => onChange(Math.round((value + step) * 10) / 10)}
          className="flex h-16 w-16 items-center justify-center rounded-2xl bg-ink text-3xl text-paper"
          aria-label={`Increase ${label}`}
        >
          +
        </button>
      </div>
    </div>
  );
}

import type { ReactNode } from "react";
import type { ExerciseArtKey } from "@/lib/exercise-art";
import { artKeyFor } from "@/lib/exercise-art";

const sizes = {
  chip: "h-8 w-8",
  sm: "h-11 w-11",
  md: "h-16 w-16",
  lg: "h-44 w-full",
} as const;

export function ExerciseArt({
  name,
  exerciseId,
  size,
}: {
  name: string;
  exerciseId?: string | null;
  size: keyof typeof sizes;
}) {
  const key = artKeyFor(name, exerciseId);
  const Mark = marks[key];

  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-paper ${sizes[size]} ${
        size === "lg" ? "rounded-3xl" : ""
      }`}
    >
      <Mark label={name} />
    </div>
  );
}

const figure = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2.4,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const accent = {
  ...figure,
  stroke: "var(--accent)",
};

function Plate({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <svg
      viewBox="0 0 96 96"
      role="img"
      aria-label={label}
      className="h-full w-full text-ink"
    >
      <path
        d="M20 82.5 H76"
        fill="none"
        stroke="var(--line)"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      {children}
    </svg>
  );
}

function Head({ cx, cy }: { cx: number; cy: number }) {
  return <circle cx={cx} cy={cy} r={5} {...figure} />;
}

function MovementPrep({ label }: { label: string }) {
  return (
    <Plate label={label}>
      <Head cx={24} cy={40} />
      <path d="M28 44 L34 52" {...figure} />
      <path d="M34 52 Q 50 28 68 54" {...accent} />
      <path d="M34 52 L22 72" {...figure} />
      <path d="M30 54 L36 72" {...figure} />
      <path d="M68 54 L62 72" {...figure} />
      <path d="M68 54 L78 70" {...figure} />
    </Plate>
  );
}

function AssaultBike({ label }: { label: string }) {
  return (
    <Plate label={label}>
      <circle cx={32} cy={64} r={15} {...accent} />
      <path d="M32 64 L58 50 L40 38 L32 64" {...figure} />
      <path d="M40 38 H52" {...figure} />
      <path d="M58 50 L66 50" {...figure} />
      <Head cx={62} cy={26} />
      <path d="M60 31 L56 50" {...figure} />
      <path d="M58 36 L42 38" {...figure} />
      <path d="M56 50 L36 66" {...figure} />
      <path d="M56 50 L30 60" {...figure} />
    </Plate>
  );
}

function BallLunges({ label }: { label: string }) {
  return (
    <Plate label={label}>
      <Head cx={40} cy={18} />
      <path d="M42 23 L48 48" {...figure} />
      <circle cx={56} cy={34} r={9} {...accent} />
      <path d="M46 32 L50 38" {...figure} />
      <path d="M48 48 L34 56 L28 80" {...figure} />
      <path d="M48 48 L66 68 L74 80" {...figure} />
    </Plate>
  );
}

function SplitSquat({ label }: { label: string }) {
  return (
    <Plate label={label}>
      <rect
        x="64"
        y="50"
        width="20"
        height="7"
        rx="2"
        fill="none"
        stroke="var(--line)"
        strokeWidth="1.8"
      />
      <Head cx={44} cy={16} />
      <path d="M44 21 L48 44" {...figure} />
      <path d="M48 44 L34 60" {...figure} />
      <path d="M34 60 L30 80" {...accent} />
      <path d="M48 44 L62 40 L72 50" {...figure} />
    </Plate>
  );
}

function LegExtension({ label }: { label: string }) {
  return (
    <Plate label={label}>
      <path d="M26 30 V60 H60" {...figure} />
      <path d="M26 60 V74" {...figure} />
      <path d="M58 60 V74" {...figure} />
      <Head cx={36} cy={22} />
      <path d="M38 27 L42 56" {...figure} />
      <path d="M42 56 L40 80" {...figure} />
      <path d="M42 56 L64 50" {...figure} />
      <path d="M64 50 L80 36" {...accent} />
      <path d="M40 34 H54" {...figure} />
    </Plate>
  );
}

function LegCurl({ label }: { label: string }) {
  return (
    <Plate label={label}>
      <path d="M18 56 H78" {...figure} />
      <path d="M24 56 V74" {...figure} />
      <path d="M72 56 V74" {...figure} />
      <Head cx={22} cy={40} />
      <path d="M27 42 L66 50" {...figure} />
      <path d="M66 50 L82 50" {...figure} />
      <path d="M64 50 L72 28" {...accent} />
    </Plate>
  );
}

function CalfRaise({ label }: { label: string }) {
  return (
    <Plate label={label}>
      <path d="M70 22 V80" {...figure} />
      <Head cx={48} cy={16} />
      <path d="M48 21 V46" {...figure} />
      <path d="M48 46 L40 74" {...figure} />
      <path d="M48 46 L56 74" {...figure} />
      <path d="M38 78 L42 74" {...accent} />
      <path d="M54 74 L58 78" {...accent} />
      <path d="M48 32 L30 52" {...figure} />
      <path d="M48 32 L68 40" {...figure} />
      <circle cx={28} cy={58} r={5.5} {...accent} />
      <path d="M28 52.5 V48" {...accent} />
    </Plate>
  );
}

function Fallback({ label }: { label: string }) {
  return (
    <Plate label={label}>
      <Head cx={48} cy={18} />
      <path d="M48 23 V48" {...figure} />
      <path d="M48 32 L30 46" {...figure} />
      <path d="M48 32 L66 46" {...figure} />
      <path d="M48 48 L38 80" {...figure} />
      <path d="M48 48 L58 80" {...figure} />
    </Plate>
  );
}

const marks: Record<
  ExerciseArtKey,
  (props: { label: string }) => ReactNode
> = {
  "movement-prep": MovementPrep,
  "assault-bike": AssaultBike,
  "ball-lunges": BallLunges,
  "split-squat": SplitSquat,
  "leg-extension": LegExtension,
  "leg-curl": LegCurl,
  "calf-raise": CalfRaise,
  fallback: Fallback,
};

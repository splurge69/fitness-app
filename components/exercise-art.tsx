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
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-line bg-[var(--tile)] ${sizes[size]} ${
        size === "lg" ? "rounded-3xl border-b-2 border-b-accent" : ""
      }`}
    >
      <Mark label={name} />
    </div>
  );
}

/** Shared gradient and glow, rendered once in the root layout. */
export function ArtDefs() {
  return (
    <svg width="0" height="0" aria-hidden className="absolute">
      <defs>
        <linearGradient id="art-sun" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--sun)" />
          <stop offset="55%" stopColor="#ff8a3d" />
          <stop offset="100%" stopColor="var(--accent)" />
        </linearGradient>
        <filter id="art-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
    </svg>
  );
}

const figure = {
  fill: "none",
  stroke: "var(--electric)",
  strokeWidth: 3.2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const load = { ...figure, stroke: "var(--accent)" };

const kit = {
  fill: "none",
  stroke: "var(--muted)",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/** Striped sunset over a neon grid floor, with the figure glowing on top. */
function Plate({ label, children }: { label: string; children: ReactNode }) {
  return (
    <svg viewBox="0 0 96 96" role="img" aria-label={label} className="h-full w-full">
      <circle cx="48" cy="60" r="26" fill="url(#art-sun)" opacity="0.7" />
      <g fill="var(--tile)">
        <rect x="16" y="63" width="64" height="2" />
        <rect x="16" y="69" width="64" height="3" />
        <rect x="16" y="75.5" width="64" height="4" />
        <rect x="-200" y="80" width="496" height="16" />
      </g>
      {/* The floor runs past the square so it reaches the edges of wide tiles. */}
      <g stroke="var(--accent)" fill="none" strokeWidth="0.9" opacity="0.6">
        <path d="M48 80 L-112 96 M48 80 L-72 96 M48 80 L-32 96 M48 80 L8 96 M48 80 L28 96 M48 80 V96 M48 80 L68 96 M48 80 L88 96 M48 80 L128 96 M48 80 L168 96 M48 80 L208 96" />
        <path d="M-200 85.5 H296 M-200 91.5 H296" />
      </g>
      <path d="M-200 80 H296" stroke="var(--accent)" strokeWidth="1.4" />
      <g filter="url(#art-glow)">{children}</g>
    </svg>
  );
}

function Head({ cx, cy }: { cx: number; cy: number }) {
  return <circle cx={cx} cy={cy} r={5} {...figure} />;
}

function Dumbbell({ x, y, width = 12 }: { x: number; y: number; width?: number }) {
  return (
    <>
      <path d={`M${x - width / 2} ${y} H${x + width / 2}`} {...load} />
      <path
        d={`M${x - width / 2} ${y - 4} V${y + 4} M${x + width / 2} ${y - 4} V${y + 4}`}
        {...load}
      />
    </>
  );
}

function MovementPrep({ label }: { label: string }) {
  return (
    <Plate label={label}>
      <Head cx={24} cy={40} />
      <path d="M28 44 L34 52" {...figure} />
      <path d="M34 52 Q 50 28 68 54" {...load} />
      <path d="M34 52 L22 72 M30 54 L36 72 M68 54 L62 72 M68 54 L78 70" {...figure} />
    </Plate>
  );
}

function AssaultBike({ label }: { label: string }) {
  return (
    <Plate label={label}>
      <circle cx={32} cy={64} r={15} {...load} />
      <path d="M32 64 L58 50 L40 38 L32 64 M40 38 H52 M58 50 L66 50" {...kit} />
      <Head cx={62} cy={26} />
      <path d="M60 31 L56 50 M58 36 L42 38 M56 50 L36 66 M56 50 L30 60" {...figure} />
    </Plate>
  );
}

function BallLunges({ label }: { label: string }) {
  return (
    <Plate label={label}>
      <Head cx={40} cy={18} />
      <circle cx={56} cy={34} r={9} {...load} />
      <path d="M42 23 L48 48 M46 32 L50 38 M48 48 L34 56 L28 80 M48 48 L66 68 L74 80" {...figure} />
    </Plate>
  );
}

function SplitSquat({ label }: { label: string }) {
  return (
    <Plate label={label}>
      <rect x="64" y="50" width="20" height="7" rx="1" {...kit} />
      <path d="M68 57 V80 M80 57 V80" {...kit} />
      <Head cx={44} cy={16} />
      <path d="M44 21 L48 44 M48 44 L34 60 M48 44 L62 40 L72 50" {...figure} />
      <path d="M34 60 L30 80" {...load} />
      <Dumbbell x={40} y={46} width={8} />
    </Plate>
  );
}

function LegExtension({ label }: { label: string }) {
  return (
    <Plate label={label}>
      <path d="M26 30 V60 H60 M26 60 V80 M58 60 V80" {...kit} />
      <Head cx={36} cy={22} />
      <path d="M38 27 L42 56 M42 56 L40 80 M42 56 L64 50 M40 34 H54" {...figure} />
      <path d="M64 50 L80 36" {...load} />
    </Plate>
  );
}

function LegCurl({ label }: { label: string }) {
  return (
    <Plate label={label}>
      <path d="M18 56 H78 M24 56 V80 M72 56 V80" {...kit} />
      <Head cx={22} cy={40} />
      <path d="M27 42 L66 50 M66 50 L82 50" {...figure} />
      <path d="M64 50 L72 28" {...load} />
    </Plate>
  );
}

function CalfRaise({ label }: { label: string }) {
  return (
    <Plate label={label}>
      <path d="M70 22 V80" {...kit} />
      <Head cx={48} cy={16} />
      <path d="M48 21 V46 M48 46 L40 74 M48 46 L56 74 M48 32 L30 52 M48 32 L68 40" {...figure} />
      <path d="M38 78 L42 74 M54 74 L58 78" {...load} />
      <circle cx={28} cy={58} r={5.5} {...load} />
      <path d="M28 52.5 V48" {...load} />
    </Plate>
  );
}

function BandPullApart({ label }: { label: string }) {
  return (
    <Plate label={label}>
      <Head cx={48} cy={18} />
      <path d="M48 23 V50 M48 50 L40 80 M48 50 L56 80 M48 32 L22 32 M48 32 L74 32" {...figure} />
      <path d="M22 35 Q 48 44 74 35" {...load} />
    </Plate>
  );
}

function BenchPress({ label }: { label: string }) {
  return (
    <Plate label={label}>
      <path d="M16 60 H70 M22 60 V80 M64 60 V80" {...kit} />
      <Head cx={22} cy={52} />
      <path d="M27 54 L58 56 M58 56 L70 64 L72 80 M34 54 L36 36" {...figure} />
      <Dumbbell x={36} y={32} width={16} />
    </Plate>
  );
}

function LatPulldown({ label }: { label: string }) {
  return (
    <Plate label={label}>
      <path d="M78 12 V80 M44 12 H78 M34 62 H58" {...kit} />
      <path d="M48 12 V26" {...kit} strokeWidth={1.2} />
      <path d="M30 26 H66" {...load} />
      <Head cx={48} cy={40} />
      <path
        d="M48 45 V62 M48 49 L37 40 L33 27 M48 49 L59 40 L63 27 M48 62 L64 64 L64 80"
        {...figure}
      />
    </Plate>
  );
}

function Deadlift({ label }: { label: string }) {
  return (
    <Plate label={label}>
      <Head cx={28} cy={30} />
      <path d="M33 33 L60 44 M60 44 L56 62 L60 80 M36 36 L40 62" {...figure} />
      <path d="M26 64 H56" {...load} />
      <circle cx={30} cy={64} r={8} {...load} />
    </Plate>
  );
}

function LegPress({ label }: { label: string }) {
  return (
    <Plate label={label}>
      <path d="M36 80 L84 32" {...kit} strokeWidth={1.4} />
      <path d="M12 44 L22 70 H44" {...kit} />
      <Head cx={20} cy={40} />
      <path d="M22 46 L32 66 M32 66 L50 46 M50 46 L66 54" {...figure} />
      <path d="M58 44 L76 62" {...load} strokeWidth={4} />
    </Plate>
  );
}

function CableRow({ label }: { label: string }) {
  return (
    <Plate label={label}>
      <path d="M86 36 V80 M18 70 H42 M70 56 V76" {...kit} />
      <Head cx={32} cy={32} />
      <path d="M32 37 L34 64 M34 64 L60 64 L70 66 M33 45 L46 52 L56 50" {...figure} />
      <path d="M56 50 L86 62" {...load} strokeWidth={1.8} />
      <path d="M56 45 V55" {...load} />
    </Plate>
  );
}

function ShoulderPress({ label }: { label: string }) {
  return (
    <Plate label={label}>
      <path d="M30 28 V64 H54 M34 64 V80 M50 64 V80" {...kit} />
      <Head cx={40} cy={24} />
      <path
        d="M40 29 V60 M40 36 L28 30 L28 16 M40 36 L52 30 L52 16 M40 60 L58 62 L58 80"
        {...figure}
      />
      <Dumbbell x={28} y={12} width={10} />
      <Dumbbell x={52} y={12} width={10} />
    </Plate>
  );
}

function PallofPress({ label }: { label: string }) {
  return (
    <Plate label={label}>
      <path d="M84 18 V80" {...kit} />
      <Head cx={38} cy={18} />
      <path d="M38 23 V50 M38 50 L30 80 M38 50 L48 80 M38 32 L60 32" {...figure} />
      <path d="M60 32 L84 30" {...load} strokeWidth={1.8} />
      <circle cx={61} cy={32} r={3} {...load} />
      <path d="M26 42 Q 38 50 50 42" {...load} strokeWidth={2} strokeDasharray="3 4" />
    </Plate>
  );
}

function Fallback({ label }: { label: string }) {
  return (
    <Plate label={label}>
      <Head cx={48} cy={20} />
      <path d="M48 25 V50 M48 34 L30 26 M48 34 L66 26 M48 50 L38 80 M48 50 L58 80" {...figure} />
      <Dumbbell x={28} y={24} width={10} />
      <Dumbbell x={68} y={24} width={10} />
    </Plate>
  );
}

const marks: Record<ExerciseArtKey, (props: { label: string }) => ReactNode> = {
  "movement-prep": MovementPrep,
  "assault-bike": AssaultBike,
  "ball-lunges": BallLunges,
  "split-squat": SplitSquat,
  "leg-extension": LegExtension,
  "leg-curl": LegCurl,
  "calf-raise": CalfRaise,
  "band-pull-apart": BandPullApart,
  "bench-press": BenchPress,
  "lat-pulldown": LatPulldown,
  deadlift: Deadlift,
  "leg-press": LegPress,
  "cable-row": CableRow,
  "shoulder-press": ShoulderPress,
  "pallof-press": PallofPress,
  fallback: Fallback,
};

"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { NumberStepper } from "@/components/stepper";
import {
  checkWarmupAction,
  finishSessionAction,
  logSetAction,
} from "@/lib/actions/sessions";
import type { ProgrammeExercise, SetLog, WarmupCheck } from "@/lib/types";
import {
  getWorkoutStep,
  lastRepsForExercise,
  lastWeightForExercise,
  setsLoggedFor,
  sidesFor,
  targetSetsFor,
} from "@/lib/workout";

export function WorkoutClient({
  sessionId,
  completed,
  items,
  logs,
  checks,
  history,
}: {
  sessionId: string;
  completed: boolean;
  items: ProgrammeExercise[];
  logs: SetLog[];
  checks: WarmupCheck[];
  history: SetLog[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const step = useMemo(
    () => getWorkoutStep(items, logs, checks),
    [items, logs, checks],
  );

  if (completed || step.kind === "complete") {
    return (
      <section className="rounded-3xl border border-line bg-card p-5">
        <h2 className="font-display text-3xl text-ink">That is the session</h2>
        <p className="mt-2 text-sm text-muted">
          {logs.length} working sets logged. Finish to count it toward the week.
        </p>
        {!completed ? (
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await finishSessionAction(sessionId);
              })
            }
            className="mt-6 w-full rounded-2xl bg-ink px-4 py-4 text-base font-medium text-paper"
          >
            Mark session complete
          </button>
        ) : null}
      </section>
    );
  }

  if (step.kind === "warmup") {
    return (
      <div className="space-y-4">
        <WarmupCard
          item={step.item}
          pending={pending}
          onDone={() =>
            startTransition(async () => {
              await checkWarmupAction(sessionId, step.item.id);
              router.refresh();
            })
          }
        />
        <EndSessionButton sessionId={sessionId} pending={pending} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <WorkCard
        key={`${step.item.id}-${step.side}-${step.setNumber}`}
        item={step.item}
        side={step.side}
        setNumber={step.setNumber}
        logs={logs}
        history={history}
        pending={pending}
        onLog={(reps, weightKg) =>
          startTransition(async () => {
            await logSetAction({
              sessionId,
              exerciseId: step.item.exerciseId,
              programmeExerciseId: step.item.id,
              exerciseName: step.item.name,
              side: step.side,
              setNumber: step.setNumber,
              reps,
              weightKg,
            });
            router.refresh();
          })
        }
      />
      <EndSessionButton sessionId={sessionId} pending={pending} />
    </div>
  );
}

function WarmupCard({
  item,
  pending,
  onDone,
}: {
  item: ProgrammeExercise;
  pending: boolean;
  onDone: () => void;
}) {
  return (
    <section className="rounded-3xl border border-line bg-card p-5">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">
        Warm-up
      </p>
      <h2 className="mt-2 font-display text-3xl text-ink">{item.name}</h2>
      {item.cues ? <p className="mt-3 text-sm leading-6 text-muted">{item.cues}</p> : null}
      {item.notes ? <p className="mt-2 text-sm text-ink">{item.notes}</p> : null}
      <button
        type="button"
        disabled={pending}
        onClick={onDone}
        className="mt-6 w-full rounded-2xl bg-ink px-4 py-4 text-base font-medium text-paper"
      >
        Done — next
      </button>
    </section>
  );
}

function WorkCard({
  item,
  side,
  setNumber,
  logs,
  history,
  pending,
  onLog,
}: {
  item: ProgrammeExercise;
  side: "left" | "right" | "none";
  setNumber: number;
  logs: SetLog[];
  history: SetLog[];
  pending: boolean;
  onLog: (reps: number, weightKg: number) => void;
}) {
  const suggestedWeight =
    lastWeightForExercise(history, item.exerciseId, side) ??
    item.targetWeightKg ??
    0;
  const suggestedReps =
    lastRepsForExercise(history, item.exerciseId, side) ??
    item.targetReps ??
    8;
  const [weight, setWeight] = useState(suggestedWeight);
  const [reps, setReps] = useState(suggestedReps);

  const sideLabel =
    side === "left" ? "Left" : side === "right" ? "Right" : "Both / single";
  const progress = sidesFor(item)
    .map((entry) => {
      const done = setsLoggedFor(logs, item.id, entry);
      const label = entry === "left" ? "L" : entry === "right" ? "R" : "Sets";
      return `${label} ${done}/${targetSetsFor(item)}`;
    })
    .join(" · ");

  return (
    <section className="space-y-4">
      <div className="rounded-3xl border border-line bg-card p-5">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">
          {sideLabel} · set {setNumber} of {targetSetsFor(item)}
        </p>
        <h2 className="mt-2 font-display text-3xl text-ink">{item.name}</h2>
        <p className="mt-2 text-sm text-muted">{progress}</p>
        {item.cues ? <p className="mt-3 text-sm leading-6 text-ink">{item.cues}</p> : null}
        {item.notes ? <p className="mt-2 text-sm text-muted">{item.notes}</p> : null}
      </div>

      <NumberStepper
        label="Weight"
        value={weight}
        onChange={setWeight}
        step={weight >= 20 ? 2.5 : 1}
        suffix="kg"
      />
      <NumberStepper
        label="Reps"
        value={reps}
        onChange={setReps}
        step={1}
        min={1}
        suffix="reps"
      />

      <button
        type="button"
        disabled={pending}
        onClick={() => onLog(reps, weight)}
        className="w-full rounded-3xl bg-accent px-4 py-5 text-lg font-medium text-accent-ink"
      >
        Log set
      </button>
    </section>
  );
}

function EndSessionButton({
  sessionId,
  pending,
}: {
  sessionId: string;
  pending: boolean;
}) {
  return (
    <form action={finishSessionAction.bind(null, sessionId)} className="pt-2">
      <button
        type="submit"
        disabled={pending}
        className="w-full text-sm text-muted underline decoration-line underline-offset-4"
      >
        End session early
      </button>
    </form>
  );
}

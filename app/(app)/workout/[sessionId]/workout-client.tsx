"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { ExerciseArt } from "@/components/exercise-art";
import { DeleteSessionButton } from "@/components/delete-session-button";
import { SessionLogList } from "@/components/session-log-list";
import { NumberStepper } from "@/components/stepper";
import {
  checkWarmupAction,
  deleteSetAction,
  finishSessionAction,
  logSetAction,
} from "@/lib/actions/sessions";
import type { ProgrammeExercise, SetLog, Side, WarmupCheck } from "@/lib/types";
import { formatSide } from "@/lib/rehab";
import { muscleFor } from "@/lib/muscles";
import {
  formatKg,
  getWorkoutStep,
  isExerciseComplete,
  formatLoggedSet,
  lastRepsForExercise,
  lastSessionSetsForExercise,
  lastWeightForExercise,
  logsForItem,
  nextAlternatingSide,
  nextSetNumber,
  nextWorkItem,
  setsLoggedFor,
  sidesFor,
  targetSetsFor,
} from "@/lib/workout";

type Focus = { itemId: string; side: Side };

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
  const [focus, setFocus] = useState<Focus | null>(null);
  const workItems = useMemo(
    () =>
      [...items]
        .filter((item) => !item.isWarmup)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [items],
  );
  const step = useMemo(
    () => getWorkoutStep(items, logs, checks),
    [items, logs, checks],
  );

  const focusedItem =
    (focus && workItems.find((item) => item.id === focus.itemId)) ||
    (step.kind === "work" ? step.item : null);
  const focusedSide =
    focus?.side ??
    (step.kind === "work" ? step.side : focusedItem ? sidesFor(focusedItem)[0] : "none");

  function run(task: () => Promise<void>) {
    startTransition(async () => {
      await task();
      router.refresh();
    });
  }

  if (completed) {
    return (
      <SessionReview
        sessionId={sessionId}
        logs={logs}
        canFinish={false}
        pending={pending}
      />
    );
  }

  if (step.kind === "warmup") {
    return (
      <div className="space-y-4">
        <WarmupCard
          item={step.item}
          pending={pending}
          onDone={() =>
            run(() => checkWarmupAction(sessionId, step.item.id))
          }
        />
        <EndSessionButton sessionId={sessionId} pending={pending} />
        <DeleteSessionButton sessionId={sessionId} label="Delete this session" />
      </div>
    );
  }

  if (!focusedItem) {
    return (
      <SessionReview
        sessionId={sessionId}
        logs={logs}
        canFinish
        pending={pending}
        onFinish={() => run(() => finishSessionAction(sessionId))}
        onBack={
          workItems[0]
            ? () => {
                const last = workItems[workItems.length - 1];
                setFocus({
                  itemId: last.id,
                  side: nextAlternatingSide(last, logs),
                });
              }
            : undefined
        }
        workItems={workItems}
        onJump={(item) =>
          setFocus({
            itemId: item.id,
            side: nextAlternatingSide(item, logs),
          })
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <WorkCard
        key={`${focusedItem.id}-${focusedSide}`}
        sessionId={sessionId}
        item={focusedItem}
        side={focusedSide}
        workItems={workItems}
        logs={logs}
        history={history}
        pending={pending}
        onSelectExercise={(item) =>
          setFocus({
            itemId: item.id,
            side: nextAlternatingSide(item, logs),
          })
        }
        onSelectSide={(side) => setFocus({ itemId: focusedItem.id, side })}
        onLog={(reps, weightKg) => {
          setFocus({
            itemId: focusedItem.id,
            side: nextAlternatingSide(focusedItem, logs, focusedSide),
          });
          run(() =>
            logSetAction({
              sessionId,
              exerciseId: focusedItem.exerciseId,
              programmeExerciseId: focusedItem.id,
              exerciseName: focusedItem.name,
              side: focusedSide,
              setNumber: nextSetNumber(logs, focusedItem.id, focusedSide),
              reps,
              weightKg,
            }),
          );
        }}
        onDeleteSet={(setLogId) =>
          run(() => deleteSetAction(sessionId, setLogId))
        }
        onNext={() => {
          const next = nextWorkItem(items, focusedItem.id);
          if (next) {
            setFocus({
              itemId: next.id,
              side: nextAlternatingSide(next, logs),
            });
            return;
          }
          setFocus(null);
        }}
      />
      <EndSessionButton sessionId={sessionId} pending={pending} />
      <DeleteSessionButton sessionId={sessionId} label="Delete this session" />
    </div>
  );
}

function SessionReview({
  sessionId,
  logs,
  canFinish,
  pending,
  onFinish,
  onBack,
  workItems,
  onJump,
}: {
  sessionId: string;
  logs: SetLog[];
  canFinish: boolean;
  pending: boolean;
  onFinish?: () => void;
  onBack?: () => void;
  workItems?: ProgrammeExercise[];
  onJump?: (item: ProgrammeExercise) => void;
}) {
  return (
    <section className="space-y-4">
      <div className="rounded-3xl border border-line bg-card p-5">
        <h2 className="font-display text-3xl text-ink">
          {canFinish ? "Review this session" : "That is the session"}
        </h2>
        <p className="mt-2 text-sm text-muted">
          {logs.length} working {logs.length === 1 ? "set" : "sets"} logged
          {canFinish ? ". Add a missed set or mark it complete." : "."}
        </p>
        <div className="mt-4">
          <SessionLogList logs={logs} />
        </div>
        {canFinish && workItems && onJump ? (
          <ExerciseChips
            items={workItems}
            logs={logs}
            selectedId={null}
            onSelect={onJump}
          />
        ) : null}
        {canFinish && onFinish ? (
          <button
            type="button"
            disabled={pending}
            onClick={onFinish}
            className="mt-6 w-full rounded-2xl bg-ink px-4 py-4 text-base font-medium text-paper"
          >
            Mark session complete
          </button>
        ) : null}
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="mt-3 w-full text-sm text-ink underline decoration-line underline-offset-4"
          >
            Back to last lift
          </button>
        ) : null}
      </div>
      <DeleteSessionButton sessionId={sessionId} />
    </section>
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
      <ExerciseArt
        name={item.name}
        exerciseId={item.exerciseId}
        size="lg"
      />
      <p className="mt-4 text-xs font-medium uppercase tracking-[0.16em] text-muted">
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
  sessionId,
  item,
  side,
  workItems,
  logs,
  history,
  pending,
  onSelectExercise,
  onSelectSide,
  onLog,
  onDeleteSet,
  onNext,
}: {
  sessionId: string;
  item: ProgrammeExercise;
  side: Side;
  workItems: ProgrammeExercise[];
  logs: SetLog[];
  history: SetLog[];
  pending: boolean;
  onSelectExercise: (item: ProgrammeExercise) => void;
  onSelectSide: (side: Side) => void;
  onLog: (reps: number, weightKg: number) => void;
  onDeleteSet: (setLogId: string) => void;
  onNext: () => void;
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

  const targetSets = targetSetsFor(item);
  const logged = logsForItem(logs, item.id, side);
  const allLogged = logsForItem(logs, item.id);
  const extras = Math.max(0, logged.length - targetSets);
  const nextLabel = nextWorkItem(workItems, item.id)
    ? "Next exercise"
    : "Review session";
  const lastSession = lastSessionSetsForExercise(
    history,
    item.exerciseId,
    sessionId,
  );
  const bilateral = sidesFor(item).length > 1;
  const sideLabel = side === "none" ? null : side;
  const muscle = muscleFor(item.name, item.exerciseId);
  const prescription = [
    muscle,
    bilateral ? `${targetSets} sets each side, alternating` : `${targetSets} sets`,
    item.targetReps ? `${item.targetReps} reps` : null,
    item.targetWeightKg ? `${formatKg(item.targetWeightKg)} kg` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <section className="space-y-4">
      <ExerciseChips
        items={workItems}
        logs={logs}
        selectedId={item.id}
        onSelect={onSelectExercise}
      />

      <div className="rounded-3xl border border-line bg-card p-5">
        <ExerciseArt
          name={item.name}
          exerciseId={item.exerciseId}
          size="lg"
        />
        <p className="mt-4 text-xs font-medium uppercase tracking-[0.16em] text-muted">
          {prescription || "Working set"}
        </p>
        <h2 className="mt-2 font-display text-3xl text-ink">{item.name}</h2>
        {item.cues ? <p className="mt-3 text-sm leading-6 text-ink">{item.cues}</p> : null}
        {item.notes ? <p className="mt-2 text-sm text-muted">{item.notes}</p> : null}
        {bilateral ? (
          <div className="mt-4 grid grid-cols-2 gap-2">
            {sidesFor(item).map((entry) => {
              const done = setsLoggedFor(logs, item.id, entry);
              const selected = entry === side;
              return (
                <button
                  key={entry}
                  type="button"
                  onClick={() => onSelectSide(entry)}
                  className={`rounded-2xl px-3 py-3 text-sm font-medium ${
                    selected
                      ? "bg-ink text-paper"
                      : "bg-paper text-ink"
                  }`}
                >
                  {formatSide(entry)} · {done}/{targetSets}
                </button>
              );
            })}
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted">
            {logged.length}/{targetSets} sets
            {extras > 0 ? ` · ${extras} extra` : ""}
          </p>
        )}
      </div>

      <LastSessionSets logs={lastSession} bilateral={bilateral} />

      <LoggedSets
        logs={allLogged}
        showSide={bilateral}
        pending={pending}
        onDelete={onDeleteSet}
      />

      <NumberStepper
        label="Weight"
        value={weight}
        onChange={setWeight}
        step={weight >= 20 ? 2.5 : 1}
        suffix="kg"
        decimals
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
        disabled={pending || reps < 1}
        onClick={() => onLog(reps, weight)}
        className="w-full rounded-3xl bg-accent px-4 py-5 text-lg font-medium text-accent-ink"
      >
        Log {sideLabel ? `${sideLabel} ` : ""}set {logged.length + 1}
        {logged.length >= targetSets ? " (extra)" : ""}
      </button>

      <button
        type="button"
        onClick={onNext}
        className="w-full rounded-2xl border border-line bg-card px-4 py-4 text-base font-medium text-ink"
      >
        {nextLabel}
      </button>
    </section>
  );
}

function ExerciseChips({
  items,
  logs,
  selectedId,
  onSelect,
}: {
  items: ProgrammeExercise[];
  logs: SetLog[];
  selectedId: string | null;
  onSelect: (item: ProgrammeExercise) => void;
}) {
  if (items.length === 0) return null;

  return (
    <div className="-mx-4 overflow-x-auto px-4">
      <div className="flex gap-2 pb-1">
        {items.map((item) => {
          const done = isExerciseComplete(item, logs);
          const selected = item.id === selectedId;
          const count = logsForItem(logs, item.id).length;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item)}
              className={`flex shrink-0 items-center gap-2 rounded-full py-1.5 pr-3 pl-1.5 text-sm ${
                selected
                  ? "bg-ink text-paper"
                  : done
                    ? "bg-card text-good"
                    : "border border-line bg-card text-ink"
              }`}
            >
              <ExerciseArt
                name={item.name}
                exerciseId={item.exerciseId}
                size="chip"
              />
              {done ? "✓ " : ""}
              {item.name}
              {count > 0 ? ` · ${count}` : ""}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function LastSessionSets({
  logs,
  bilateral,
}: {
  logs: SetLog[];
  bilateral: boolean;
}) {
  return (
    <div className="rounded-3xl border border-line bg-card p-4">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">
        Last session
      </p>
      {logs.length === 0 ? (
        <p className="mt-3 text-sm text-muted">No previous sets for this lift.</p>
      ) : (
        <ul className="mt-3 space-y-1 font-mono text-base text-ink">
          {logs.map((log, index) => (
            <li key={log.id}>
              {index + 1}.{" "}
              {bilateral
                ? formatLoggedSet(log)
                : `${formatKg(log.weightKg)} kg × ${log.reps}`}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function LoggedSets({
  logs,
  showSide,
  pending,
  onDelete,
}: {
  logs: SetLog[];
  showSide: boolean;
  pending: boolean;
  onDelete: (setLogId: string) => void;
}) {
  if (logs.length === 0) {
    return (
      <p className="px-1 text-sm text-muted">
        Nothing logged yet. Type the kg and reps you actually did.
      </p>
    );
  }

  return (
    <div className="rounded-3xl border border-line bg-card p-4">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">
        This exercise
      </p>
      <ul className="mt-3 divide-y divide-line">
        {logs.map((log, index) => (
          <li key={log.id} className="flex items-center justify-between gap-3 py-2">
            <p className="font-mono text-base text-ink">
              {index + 1}.{" "}
              {showSide
                ? formatLoggedSet(log)
                : `${formatKg(log.weightKg)} kg × ${log.reps}`}
            </p>
            <button
              type="button"
              disabled={pending}
              onClick={() => onDelete(log.id)}
              className="min-h-11 min-w-11 text-sm text-accent"
            >
              Undo
            </button>
          </li>
        ))}
      </ul>
    </div>
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

"use client";

import {
  useEffect,
  useMemo,
  useOptimistic,
  useState,
  useSyncExternalStore,
  useTransition,
} from "react";
import { ExerciseArt } from "@/components/exercise-art";
import { DeleteSessionButton } from "@/components/delete-session-button";
import {
  SessionLogList,
  type TimedWarmup,
} from "@/components/session-log-list";
import { NumberStepper } from "@/components/stepper";
import { SubmitButton } from "@/components/submit-button";
import {
  checkWarmupAction,
  deleteExerciseLogAction,
  finishSessionAction,
  saveExerciseLogAction,
} from "@/lib/actions/sessions";
import type { ExerciseLog, ProgrammeExercise, WarmupCheck } from "@/lib/types";
import { muscleFor } from "@/lib/muscles";
import {
  formatClock,
  formatLog,
  getWorkoutStep,
  lastLogForExercise,
  logFor,
  nextWorkItem,
  prescriptionFor,
  suggestedEntry,
  workItemsOf,
  type LogEntry,
} from "@/lib/workout";

type LogChange =
  | { kind: "save"; log: ExerciseLog }
  | { kind: "remove"; exerciseId: string };

function applyLogChange(logs: ExerciseLog[], change: LogChange): ExerciseLog[] {
  const exerciseId = change.kind === "save" ? change.log.exerciseId : change.exerciseId;
  const rest = logs.filter((log) => log.exerciseId !== exerciseId);
  return change.kind === "save" ? [...rest, change.log] : rest;
}

export function WorkoutClient({
  sessionId,
  completed,
  items,
  logs: savedLogs,
  checks: savedChecks,
  history,
}: {
  sessionId: string;
  completed: boolean;
  items: ProgrammeExercise[];
  logs: ExerciseLog[];
  checks: WarmupCheck[];
  history: ExerciseLog[];
}) {
  const [, startTransition] = useTransition();
  const [finishing, startFinishing] = useTransition();
  // Taps update the screen straight away; the save catches up in the background.
  const [logs, changeLogs] = useOptimistic(savedLogs, applyLogChange);
  const [checks, addCheck] = useOptimistic(
    savedChecks,
    (current: WarmupCheck[], check: WarmupCheck) => [...current, check],
  );
  // null = follow the programme order; "review" = the review screen.
  const [focusId, setFocusId] = useState<string | null>(null);
  const workItems = useMemo(() => workItemsOf(items), [items]);
  const step = useMemo(
    () => getWorkoutStep(items, logs, checks),
    [items, logs, checks],
  );
  const timedWarmups = useMemo(
    () => timedWarmupsFor(items, checks),
    [items, checks],
  );

  function save(optimistic: () => void, task: () => Promise<void>) {
    startTransition(async () => {
      optimistic();
      await task();
    });
  }

  if (completed) {
    return (
      <section className="space-y-4">
        <div className="rounded-3xl border border-line bg-card p-5">
          <h2 className="font-display text-3xl text-ink">That is the session</h2>
          <div className="mt-4">
            <SessionLogList logs={logs} warmups={timedWarmups} />
          </div>
        </div>
        <DeleteSessionButton sessionId={sessionId} />
      </section>
    );
  }

  if (step.kind === "warmup") {
    const item = step.item;
    return (
      <div className="space-y-4">
        <WarmupCard
          key={item.id}
          sessionId={sessionId}
          item={item}
          onDone={(durationSeconds) =>
            save(
              () =>
                addCheck({
                  sessionId,
                  programmeExerciseId: item.id,
                  durationSeconds,
                  completedAt: new Date().toISOString(),
                }),
              () => checkWarmupAction(sessionId, item.id, durationSeconds),
            )
          }
        />
        <SessionFooter sessionId={sessionId} />
      </div>
    );
  }

  const focused =
    focusId === "review"
      ? null
      : (focusId && workItems.find((item) => item.id === focusId)) ||
        (step.kind === "work" ? step.item : null);

  if (!focused) {
    return (
      <section className="space-y-4">
        <ExerciseChips
          items={workItems}
          logs={logs}
          selectedId={null}
          onSelect={(item) => setFocusId(item.id)}
        />
        <div className="rounded-3xl border border-line bg-card p-5">
          <h2 className="font-display text-3xl text-ink">Review this session</h2>
          <p className="mt-2 text-sm text-muted">
            {logs.length} of {workItems.length} exercises logged. Tap one above
            to change it.
          </p>
          <div className="mt-4">
            <SessionLogList logs={logs} warmups={timedWarmups} />
          </div>
          <button
            type="button"
            disabled={finishing}
            onClick={() => startFinishing(() => finishSessionAction(sessionId))}
            className="mt-6 w-full rounded-2xl bg-ink px-4 py-4 text-base font-medium text-paper disabled:opacity-60"
          >
            {finishing ? "Finishing…" : "Mark session complete"}
          </button>
        </div>
        <DeleteSessionButton sessionId={sessionId} label="Delete this session" />
      </section>
    );
  }

  const current = logFor(logs, focused);

  return (
    <div className="space-y-4">
      <ExerciseChips
        items={workItems}
        logs={logs}
        selectedId={focused.id}
        onSelect={(item) => setFocusId(item.id)}
      />
      <WorkCard
        key={`${focused.id}-${current ? "logged" : "new"}`}
        item={focused}
        current={current}
        previous={lastLogForExercise(history, focused.exerciseId, sessionId)}
        onSave={(entry) => {
          const log: ExerciseLog = {
            id: `pending-${focused.exerciseId}`,
            sessionId,
            exerciseId: focused.exerciseId,
            programmeExerciseId: focused.id,
            exerciseNameSnapshot: focused.name,
            completedAt: new Date().toISOString(),
            ...entry,
          };
          setFocusId(
            nextWorkItem(items, applyLogChange(logs, { kind: "save", log }), focused.id)
              ?.id ?? "review",
          );
          save(
            () => changeLogs({ kind: "save", log }),
            () =>
              saveExerciseLogAction({
                sessionId,
                exerciseId: focused.exerciseId,
                programmeExerciseId: focused.id,
                exerciseName: focused.name,
                ...entry,
              }),
          );
        }}
        onRemove={() =>
          save(
            () => changeLogs({ kind: "remove", exerciseId: focused.exerciseId }),
            () => deleteExerciseLogAction(sessionId, focused.exerciseId),
          )
        }
      />
      <button
        type="button"
        onClick={() => setFocusId("review")}
        className="w-full rounded-2xl border border-line bg-card px-4 py-4 text-base font-medium text-ink"
      >
        Review session
      </button>
      <SessionFooter sessionId={sessionId} />
    </div>
  );
}

function timedWarmupsFor(
  items: ProgrammeExercise[],
  checks: WarmupCheck[],
): TimedWarmup[] {
  return items.flatMap((item) => {
    const check = checks.find((entry) => entry.programmeExerciseId === item.id);
    if (!check || check.durationSeconds === null) return [];
    return [
      {
        name: item.name,
        exerciseId: item.exerciseId,
        durationSeconds: check.durationSeconds,
      },
    ];
  });
}

function WarmupCard({
  sessionId,
  item,
  onDone,
}: {
  sessionId: string;
  item: ProgrammeExercise;
  onDone: (durationSeconds: number | null) => void;
}) {
  const timer = useStopwatch(`timer:${sessionId}:${item.id}`);

  return (
    <section className="rounded-3xl border border-line bg-card p-5">
      <ExerciseArt name={item.name} exerciseId={item.exerciseId} size="lg" />
      <p className="mt-4 text-xs font-medium uppercase tracking-[0.16em] text-muted">
        Warm-up
      </p>
      <h2 className="mt-2 font-display text-3xl text-ink">{item.name}</h2>
      {item.cues ? <p className="mt-3 text-sm leading-6 text-muted">{item.cues}</p> : null}
      {item.notes ? <p className="mt-2 text-sm text-ink">{item.notes}</p> : null}

      {item.tracksDuration ? (
        <div className="mt-5 space-y-3">
          <div className="rounded-3xl bg-paper p-4 text-center">
            <p className="font-mono text-5xl tabular-nums text-ink">
              {formatClock(timer.seconds)}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={timer.running ? timer.pause : timer.start}
                className="rounded-2xl bg-ink px-3 py-3 text-base font-medium text-paper"
              >
                {timer.running ? "Pause" : timer.seconds > 0 ? "Resume" : "Start timer"}
              </button>
              <button
                type="button"
                onClick={timer.reset}
                disabled={timer.seconds === 0}
                className="rounded-2xl border border-line px-3 py-3 text-base text-ink disabled:opacity-40"
              >
                Reset
              </button>
            </div>
          </div>
          <NumberStepper
            label="Or set minutes"
            value={Math.round(timer.seconds / 60)}
            onChange={(minutes) => timer.set(minutes * 60)}
            step={1}
            suffix="min"
          />
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => {
          const seconds = item.tracksDuration && timer.seconds > 0 ? timer.seconds : null;
          timer.clear();
          onDone(seconds);
        }}
        className="mt-6 w-full rounded-2xl bg-ink px-4 py-4 text-base font-medium text-paper disabled:opacity-60"
      >
        {item.tracksDuration && timer.seconds > 0
          ? `Done — log ${formatClock(timer.seconds)}`
          : "Done — next"}
      </button>
    </section>
  );
}

type StopwatchState = { baseSeconds: number; startedAt: number | null };

const STOPPED: StopwatchState = { baseSeconds: 0, startedAt: null };
const storageListeners = new Set<() => void>();

function subscribeToStorage(listener: () => void) {
  storageListeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    storageListeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function readStorage(key: string): string {
  try {
    return window.localStorage.getItem(key) ?? "";
  } catch {
    return "";
  }
}

function writeStorage(key: string, value: string | null) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {}
  storageListeners.forEach((listener) => listener());
}

/**
 * A stopwatch that survives the phone locking or the page reloading: it keeps
 * the start time, not a tick count, in localStorage.
 */
function useStopwatch(storageKey: string) {
  const raw = useSyncExternalStore(
    subscribeToStorage,
    () => readStorage(storageKey),
    () => "",
  );
  const state = useMemo<StopwatchState>(() => {
    try {
      return raw ? (JSON.parse(raw) as StopwatchState) : STOPPED;
    } catch {
      return STOPPED;
    }
  }, [raw]);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (state.startedAt === null) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [state.startedAt]);

  const running = state.startedAt !== null;
  const seconds = Math.floor(
    state.baseSeconds +
      (running ? Math.max(0, (now - state.startedAt!) / 1000) : 0),
  );
  const store = (next: StopwatchState) =>
    writeStorage(storageKey, JSON.stringify(next));

  return {
    seconds,
    running,
    start: () => {
      const at = Date.now();
      setNow(at);
      store({ baseSeconds: state.baseSeconds, startedAt: at });
    },
    pause: () => store({ baseSeconds: seconds, startedAt: null }),
    reset: () => writeStorage(storageKey, null),
    set: (value: number) => store({ baseSeconds: Math.max(0, value), startedAt: null }),
    clear: () => writeStorage(storageKey, null),
  };
}

function WorkCard({
  item,
  current,
  previous,
  onSave,
  onRemove,
}: {
  item: ProgrammeExercise;
  current: ExerciseLog | null;
  previous: ExerciseLog | null;
  onSave: (entry: LogEntry) => void;
  onRemove: () => void;
}) {
  const [entry, setEntry] = useState(() => suggestedEntry(item, current, previous));
  const bilateral = item.laterality === "bilateral";
  const muscle = muscleFor(item.name, item.exerciseId);
  const eyebrow = [muscle, prescriptionFor(item)].filter(Boolean).join(" · ");

  return (
    <section className="space-y-4">
      <div className="rounded-3xl border border-line bg-card p-5">
        <ExerciseArt name={item.name} exerciseId={item.exerciseId} size="lg" />
        <p className="mt-4 text-xs font-medium uppercase tracking-[0.16em] text-muted">
          {eyebrow}
        </p>
        <h2 className="mt-2 font-display text-3xl text-ink">{item.name}</h2>
        {item.cues ? <p className="mt-3 text-sm leading-6 text-ink">{item.cues}</p> : null}
        {item.notes ? <p className="mt-2 text-sm text-muted">{item.notes}</p> : null}
        <p className="mt-4 text-sm text-muted">
          Last time:{" "}
          <span className="font-mono text-ink">
            {previous ? formatLog(previous) : "not done yet"}
          </span>
        </p>
      </div>

      {current ? (
        <div className="flex items-center justify-between gap-3 rounded-3xl border border-line bg-card px-4 py-3">
          <p className="text-sm text-good">
            ✓ Logged <span className="font-mono">{formatLog(current)}</span>
          </p>
          <button
            type="button"
            onClick={onRemove}
            className="min-h-11 min-w-11 text-sm text-accent"
          >
            Remove
          </button>
        </div>
      ) : null}

      <NumberStepper
        label="Weight"
        value={entry.weightKg}
        onChange={(weightKg) => setEntry((prev) => ({ ...prev, weightKg }))}
        step={1}
        suffix="kg"
        decimals
      />
      <NumberStepper
        label="Reps"
        value={entry.reps}
        onChange={(reps) => setEntry((prev) => ({ ...prev, reps }))}
        step={1}
        min={1}
        suffix="reps"
      />
      <NumberStepper
        label={bilateral ? "Sets (left + right = 1)" : "Sets"}
        value={entry.sets}
        onChange={(sets) => setEntry((prev) => ({ ...prev, sets }))}
        step={1}
        min={1}
        suffix="sets"
      />

      <button
        type="button"
        onClick={() => onSave(entry)}
        className="w-full rounded-3xl bg-accent px-4 py-5 text-lg font-medium text-accent-ink disabled:opacity-60"
      >
        {current ? "Update" : "Log"} {formatLog(entry)}
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
  logs: ExerciseLog[];
  selectedId: string | null;
  onSelect: (item: ProgrammeExercise) => void;
}) {
  if (items.length === 0) return null;

  return (
    <div className="-mx-4 overflow-x-auto px-4">
      <div className="flex gap-2 pb-1">
        {items.map((item) => {
          const done = Boolean(logFor(logs, item));
          const selected = item.id === selectedId;
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
              <ExerciseArt name={item.name} exerciseId={item.exerciseId} size="chip" />
              {done ? "✓ " : ""}
              {item.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SessionFooter({ sessionId }: { sessionId: string }) {
  return (
    <>
      <form action={finishSessionAction.bind(null, sessionId)} className="pt-2">
        <SubmitButton
          pendingLabel="Ending…"
          className="w-full text-sm text-muted underline decoration-line underline-offset-4"
        >
          End session early
        </SubmitButton>
      </form>
      <DeleteSessionButton sessionId={sessionId} label="Delete this session" />
    </>
  );
}

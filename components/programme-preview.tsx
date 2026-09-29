"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ExerciseArt } from "@/components/exercise-art";
import type { Programme, ProgrammeExercise } from "@/lib/types";
import { prescriptionFor } from "@/lib/workout";

export function ProgrammePreview({
  programme,
  items,
}: {
  programme: Programme;
  items: ProgrammeExercise[];
}) {
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const element = dialog.current!;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    element.showModal();
    return () => {
      element.close();
      document.body.style.overflow = overflow;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className="min-h-12 w-full rounded-2xl border border-line px-4 py-3 text-sm font-medium text-ink"
      >
        Preview
        <span className="sr-only"> {programme.name}</span>
      </button>
      <dialog
        ref={dialog}
        aria-labelledby={titleId}
        onClose={() => setOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) setOpen(false);
        }}
        className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg overflow-hidden rounded-3xl border border-line bg-card p-0 text-ink backdrop:bg-black/70 backdrop:backdrop-blur-sm"
      >
        <div className="flex max-h-[90dvh] flex-col">
          <header className="flex shrink-0 items-start justify-between gap-4 border-b border-line p-5">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.16em] text-muted">
                Programme preview
              </p>
              <h2
                id={titleId}
                className="mt-2 break-words font-display text-2xl"
              >
                {programme.name}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="min-h-11 shrink-0 rounded-xl bg-electric px-4 py-2 text-sm font-medium text-accent-ink"
            >
              Close
            </button>
          </header>
          <div className="min-h-0 overflow-y-auto overscroll-contain p-5">
            <p className="text-sm text-muted">
              Take a look before you train. Previewing does not start a session.
            </p>
            {programme.notes ? (
              <p className="mt-3 whitespace-pre-line text-sm leading-6">
                {programme.notes}
              </p>
            ) : null}
            {items.length === 0 ? (
              <p className="mt-5 text-sm text-muted">
                No exercises in this programme yet.
              </p>
            ) : null}
            {[
              { name: "Warm-up", warmup: true },
              { name: "Exercises", warmup: false },
            ].map((group) => {
              const exercises = items.filter(
                (item) => item.isWarmup === group.warmup,
              );
              if (exercises.length === 0) return null;
              return (
                <section key={group.name} className="mt-6">
                  <h3 className="font-display text-xl text-electric">
                    {group.name}
                  </h3>
                  <ol className="mt-3 divide-y divide-line">
                    {exercises.map((item) => (
                      <li key={item.id} className="flex gap-3 py-4 first:pt-0">
                        <ExerciseArt
                          name={item.name}
                          exerciseId={item.exerciseId}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <h4 className="font-medium">{item.name}</h4>
                          {!item.isWarmup ||
                          item.tracksDuration ||
                          item.targetSets ||
                          item.targetReps ||
                          item.targetWeightKg ? (
                            <p className="mt-1 font-mono text-sm text-accent">
                              {prescriptionFor(item)}
                            </p>
                          ) : null}
                          {item.laterality === "bilateral" ? (
                            <p className="mt-1 text-xs text-muted">
                              Both sides · left + right = 1 set
                            </p>
                          ) : null}
                          {item.cues ? (
                            <p className="mt-2 whitespace-pre-line text-sm leading-6">
                              {item.cues}
                            </p>
                          ) : null}
                          {item.notes ? (
                            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-muted">
                              {item.notes}
                            </p>
                          ) : null}
                        </div>
                      </li>
                    ))}
                  </ol>
                </section>
              );
            })}
          </div>
        </div>
      </dialog>
    </>
  );
}

import {
  addProgrammeItemAction,
  moveProgrammeItemAction,
  removeProgrammeItemAction,
  saveProgrammeItemAction,
} from "@/lib/actions/programme";
import type { ProgrammeExercise } from "@/lib/types";

export function ProgrammeEditor({
  programmeId,
  items,
}: {
  programmeId: string;
  items: ProgrammeExercise[];
}) {
  return (
    <div className="space-y-6">
      {items.map((item, index) => (
        <article
          key={item.id}
          className="rounded-3xl border border-line bg-card p-4"
        >
          <form action={saveProgrammeItemAction} className="space-y-3">
            <input type="hidden" name="id" value={item.id} />
            <input type="hidden" name="exerciseId" value={item.exerciseId} />
            <label className="block">
              <span className="text-xs uppercase tracking-[0.14em] text-muted">
                Name
              </span>
              <input
                name="name"
                defaultValue={item.name}
                className="mt-1 w-full rounded-2xl border border-line bg-paper px-3 py-3 text-ink"
              />
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-[0.14em] text-muted">
                Cues
              </span>
              <textarea
                name="cues"
                defaultValue={item.cues ?? ""}
                rows={2}
                className="mt-1 w-full rounded-2xl border border-line bg-paper px-3 py-3 text-ink"
              />
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-[0.14em] text-muted">
                Notes
              </span>
              <textarea
                name="notes"
                defaultValue={item.notes ?? ""}
                rows={2}
                className="mt-1 w-full rounded-2xl border border-line bg-paper px-3 py-3 text-ink"
              />
            </label>
            <div className="grid grid-cols-3 gap-2">
              <NumberField
                name="targetSets"
                label="Sets"
                defaultValue={item.targetSets}
              />
              <NumberField
                name="targetReps"
                label="Reps"
                defaultValue={item.targetReps}
              />
              <NumberField
                name="targetWeightKg"
                label="Kg"
                defaultValue={item.targetWeightKg}
              />
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="isWarmup"
                  defaultChecked={item.isWarmup}
                />
                Warm-up
              </label>
              <label className="flex items-center gap-2">
                Laterality
                <select
                  name="laterality"
                  defaultValue={item.laterality}
                  className="rounded-xl border border-line bg-paper px-2 py-1"
                >
                  <option value="none">Single</option>
                  <option value="bilateral">Both sides, alternating</option>
                </select>
              </label>
            </div>
            <button
              type="submit"
              className="w-full rounded-2xl bg-ink px-3 py-3 text-sm font-medium text-paper"
            >
              Save
            </button>
          </form>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <form action={moveProgrammeItemAction}>
              <input type="hidden" name="id" value={item.id} />
              <input type="hidden" name="direction" value="up" />
              <button
                type="submit"
                disabled={index === 0}
                className="w-full rounded-2xl border border-line px-3 py-3 text-sm disabled:opacity-40"
              >
                Up
              </button>
            </form>
            <form action={moveProgrammeItemAction}>
              <input type="hidden" name="id" value={item.id} />
              <input type="hidden" name="direction" value="down" />
              <button
                type="submit"
                disabled={index === items.length - 1}
                className="w-full rounded-2xl border border-line px-3 py-3 text-sm disabled:opacity-40"
              >
                Down
              </button>
            </form>
            <form action={removeProgrammeItemAction}>
              <input type="hidden" name="id" value={item.id} />
              <button
                type="submit"
                className="w-full rounded-2xl border border-line px-3 py-3 text-sm text-accent"
              >
                Remove
              </button>
            </form>
          </div>
        </article>
      ))}

      <article className="rounded-3xl border border-dashed border-line p-4">
        <h2 className="font-display text-2xl text-ink">Add exercise</h2>
        <form action={addProgrammeItemAction} className="mt-4 space-y-3">
          <input type="hidden" name="programmeId" value={programmeId} />
          <input
            name="name"
            required
            placeholder="Exercise name"
            className="w-full rounded-2xl border border-line bg-card px-3 py-3"
          />
          <textarea
            name="cues"
            placeholder="Cues"
            rows={2}
            className="w-full rounded-2xl border border-line bg-card px-3 py-3"
          />
          <textarea
            name="notes"
            placeholder="Notes"
            rows={2}
            className="w-full rounded-2xl border border-line bg-card px-3 py-3"
          />
          <div className="grid grid-cols-3 gap-2">
            <NumberField name="targetSets" label="Sets" />
            <NumberField name="targetReps" label="Reps" />
            <NumberField name="targetWeightKg" label="Kg" />
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" name="isWarmup" />
              Warm-up
            </label>
            <select
              name="laterality"
              defaultValue="none"
              className="rounded-xl border border-line bg-card px-2 py-1"
            >
              <option value="none">Single</option>
              <option value="bilateral">Both sides, alternating</option>
            </select>
          </div>
          <button
            type="submit"
            className="w-full rounded-2xl bg-accent px-3 py-3 text-sm font-medium text-accent-ink"
          >
            Add to programme
          </button>
        </form>
      </article>
    </div>
  );
}

function NumberField({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue?: number | null;
}) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-[0.14em] text-muted">
        {label}
      </span>
      <input
        name={name}
        type="number"
        step="any"
        defaultValue={defaultValue ?? ""}
        className="mt-1 w-full rounded-2xl border border-line bg-paper px-3 py-3 font-mono text-ink"
      />
    </label>
  );
}

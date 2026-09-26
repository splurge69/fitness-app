import Link from "next/link";
import { notFound } from "next/navigation";
import { Shell } from "@/components/shell";
import { SubmitButton } from "@/components/submit-button";
import { saveProgrammeAction } from "@/lib/actions/programme";
import { getProgramme, getProgrammeItems } from "@/lib/data";
import { ProgrammeEditor } from "./programme-editor";

export default async function ProgrammePage({
  params,
}: {
  params: Promise<{ programmeId: string }>;
}) {
  const { programmeId } = await params;
  const programme = await getProgramme(programmeId);
  if (!programme) notFound();
  const items = await getProgrammeItems(programme.id);

  return (
    <Shell title={programme.name}>
      <Link
        href="/programme"
        className="mb-4 inline-block text-sm text-muted underline decoration-line underline-offset-4"
      >
        ‹ All programmes
      </Link>

      <form
        action={saveProgrammeAction}
        className="mb-6 space-y-3 rounded-3xl border border-line bg-card p-4"
      >
        <input type="hidden" name="id" value={programme.id} />
        <label className="block">
          <span className="text-xs uppercase tracking-[0.14em] text-muted">
            Programme name
          </span>
          <input
            name="name"
            required
            defaultValue={programme.name}
            className="mt-1 w-full rounded-2xl border border-line bg-paper px-3 py-3 text-ink"
          />
        </label>
        <label className="block">
          <span className="text-xs uppercase tracking-[0.14em] text-muted">
            Notes
          </span>
          <textarea
            name="notes"
            rows={2}
            defaultValue={programme.notes ?? ""}
            className="mt-1 w-full rounded-2xl border border-line bg-paper px-3 py-3 text-ink"
          />
        </label>
        <SubmitButton
          pendingLabel="Saving…"
          className="w-full rounded-2xl bg-electric px-3 py-3 text-sm font-medium text-accent-ink"
        >
          Save programme
        </SubmitButton>
      </form>

      <ProgrammeEditor programmeId={programme.id} items={items} />
    </Shell>
  );
}

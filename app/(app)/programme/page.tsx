import Link from "next/link";
import { Shell } from "@/components/shell";
import { SubmitButton } from "@/components/submit-button";
import { createProgrammeAction } from "@/lib/actions/programme";
import { getProgrammes } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase";
import { describeSupabaseError } from "@/lib/supabase-error";

export default async function ProgrammesPage() {
  if (!isSupabaseConfigured()) {
    return (
      <Shell title="Programmes">
        <p className="text-muted">Connect Supabase to edit programmes.</p>
      </Shell>
    );
  }

  let programmes;
  try {
    programmes = await getProgrammes();
  } catch (error) {
    return (
      <Shell title="Programmes">
        <p className="text-muted">{describeSupabaseError(error)}</p>
      </Shell>
    );
  }

  return (
    <Shell title="Programmes">
      <ul className="space-y-3">
        {programmes.map((programme) => (
          <li key={programme.id}>
            <Link
              href={`/programme/${programme.id}`}
              className="flex items-center justify-between gap-3 rounded-3xl border border-line bg-card px-5 py-4"
            >
              <span className="min-w-0">
                <span className="block text-lg font-medium text-ink">
                  {programme.name}
                </span>
                {programme.notes ? (
                  <span className="mt-1 block truncate text-sm text-muted">
                    {programme.notes}
                  </span>
                ) : null}
              </span>
              <span className="text-2xl text-ink" aria-hidden>
                ›
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <form
        action={createProgrammeAction}
        className="mt-6 rounded-3xl border border-dashed border-line p-4"
      >
        <label className="block">
          <span className="font-display text-2xl text-ink">New programme</span>
          <input
            name="name"
            required
            placeholder="Name, e.g. Upper body"
            className="mt-3 w-full rounded-2xl border border-line bg-card px-3 py-3 text-ink"
          />
        </label>
        <SubmitButton
          pendingLabel="Creating…"
          className="mt-3 w-full rounded-2xl bg-accent px-3 py-3 text-sm font-medium text-accent-ink"
        >
          Create and add exercises
        </SubmitButton>
      </form>
    </Shell>
  );
}

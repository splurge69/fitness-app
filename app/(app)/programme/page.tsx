import { Shell } from "@/components/shell";
import { getActiveProgramme, getProgrammeItems } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase";
import { ProgrammeEditor } from "./programme-editor";

export default async function ProgrammePage() {
  if (!isSupabaseConfigured()) {
    return (
      <Shell title="Programme">
        <p className="text-muted">Connect Supabase to edit the programme.</p>
      </Shell>
    );
  }

  const programme = await getActiveProgramme();
  if (!programme) {
    return (
      <Shell title="Programme">
        <p className="text-muted">
          No active programme. Run <code className="font-mono">supabase/setup.sql</code>.
        </p>
      </Shell>
    );
  }

  const items = await getProgrammeItems(programme.id);

  return (
    <Shell title="Programme">
      <p className="mb-6 text-sm text-muted">{programme.notes}</p>
      <ProgrammeEditor programmeId={programme.id} items={items} />
    </Shell>
  );
}

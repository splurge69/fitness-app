"use client";

import { deleteSessionAction } from "@/lib/actions/sessions";

export function DeleteSessionButton({
  sessionId,
  label = "Delete session",
}: {
  sessionId: string;
  label?: string;
}) {
  return (
    <form
      action={deleteSessionAction.bind(null, sessionId)}
      onSubmit={(event) => {
        if (!window.confirm("Delete this session and its logged sets?")) {
          event.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        className="text-sm text-accent underline decoration-line underline-offset-4"
      >
        {label}
      </button>
    </form>
  );
}

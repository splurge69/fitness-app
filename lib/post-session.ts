export const POST_SESSION_ACTIVITIES = [
  {
    kind: "assault_bike",
    name: "Assault bike",
    description: "Extra cardio after your programme.",
  },
  {
    kind: "sauna",
    name: "Sauna",
    description: "Time in the sauna after training.",
  },
] as const;

export type PostSessionActivity = {
  kind: string;
  name: string;
  minutes: number;
};

export type PostSessionValues = {
  weightKg: number | null;
  activities: PostSessionActivity[];
};

export type PostSessionLog = PostSessionValues & { sessionId: string };

export function parsePostSession(form: FormData): PostSessionValues {
  function optionalNumber(key: string, label: string): number | null {
    const raw = form.get(key);
    if (raw === null || raw === "") return null;
    if (typeof raw !== "string" || !/^\d+(?:[.,]\d)?$/.test(raw.trim())) {
      throw new Error(
        `${label}: enter a positive number with up to one decimal place.`,
      );
    }
    const value = Number(raw.trim().replace(",", "."));
    if (!Number.isFinite(value) || value <= 0 || value > 1000) {
      throw new Error(
        `${label}: enter a number greater than 0 and no more than 1,000.`,
      );
    }
    return value;
  }

  return {
    weightKg: optionalNumber("weightKg", "Weight"),
    activities: POST_SESSION_ACTIVITIES.flatMap(({ kind, name }) => {
      const minutes = optionalNumber(kind, name);
      return minutes === null ? [] : [{ kind, name, minutes }];
    }),
  };
}

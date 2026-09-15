export type FrequencyInput = {
  lastCompletedAt: Date | null;
  sessionsThisWeek: number;
  now: Date;
  minHoursBetween: number;
  targetPerWeek: number;
  minPerWeek: number;
};

export type FrequencyStatus = {
  hoursSinceLast: number | null;
  nextEligibleAt: Date | null;
  canTrain: boolean;
  sessionsThisWeek: number;
  targetPerWeek: number;
  minPerWeek: number;
  weeklyLabel: "on-track" | "behind" | "done";
};

export function startOfWeek(now: Date): Date {
  const date = new Date(now);
  const day = date.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + mondayOffset);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function getFrequencyStatus(input: FrequencyInput): FrequencyStatus {
  const {
    lastCompletedAt,
    sessionsThisWeek,
    now,
    minHoursBetween,
    targetPerWeek,
    minPerWeek,
  } = input;

  const nextEligibleAt = lastCompletedAt
    ? new Date(lastCompletedAt.getTime() + minHoursBetween * 60 * 60 * 1000)
    : null;
  const hoursSinceLast = lastCompletedAt
    ? (now.getTime() - lastCompletedAt.getTime()) / (60 * 60 * 1000)
    : null;
  const canTrain = !nextEligibleAt || now.getTime() >= nextEligibleAt.getTime();

  let weeklyLabel: FrequencyStatus["weeklyLabel"] = "behind";
  if (sessionsThisWeek >= targetPerWeek) weeklyLabel = "done";
  else if (sessionsThisWeek >= minPerWeek) weeklyLabel = "on-track";

  return {
    hoursSinceLast,
    nextEligibleAt,
    canTrain,
    sessionsThisWeek,
    targetPerWeek,
    minPerWeek,
    weeklyLabel,
  };
}

export function formatHoursSince(hours: number | null): string {
  if (hours === null) return "No sessions yet";
  if (hours < 1) return "Less than an hour ago";
  if (hours < 24) {
    const rounded = Math.round(hours);
    return `${rounded} hour${rounded === 1 ? "" : "s"} ago`;
  }
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

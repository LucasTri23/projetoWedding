import type { Activity, Frequency, Goal } from "./types";
export function today(timezone = "America/Sao_Paulo", now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
export function addDays(date: string, days: number) {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
export function period(date: string, frequency: Frequency): [string, string] {
  if (frequency === "daily") return [date, date];
  if (frequency === "monthly") {
    const start = date.slice(0, 7) + "-01";
    const d = new Date(`${start}T12:00:00Z`);
    d.setUTCMonth(d.getUTCMonth() + 1);
    return [start, addDays(d.toISOString().slice(0, 10), -1)];
  }
  const day = new Date(`${date}T12:00:00Z`).getUTCDay();
  const start = addDays(date, -((day + 6) % 7));
  return [start, addDays(start, 6)];
}
export function progress(
  goal: Goal,
  logs: Activity[],
  uid: string,
  date: string,
) {
  const [start, end] = period(date, goal.frequency);
  const done = logs
    .filter(
      (l) =>
        l.goalId === goal.id &&
        l.date >= start &&
        l.date <= end &&
        (goal.type === "shared" || l.ownerId === uid),
    )
    .reduce((s, l) => s + l.amount, 0);
  return {
    done,
    remaining: Math.max(0, goal.target - done),
    percent: Math.min(100, Math.round((done / goal.target) * 100)),
  };
}
export function streak(
  logs: Activity[],
  goalId: string,
  uid: string,
  date: string,
) {
  const dates = new Set(
    logs
      .filter((l) => l.goalId === goalId && l.ownerId === uid)
      .map((l) => l.date),
  );
  let day = dates.has(date) ? date : addDays(date, -1);
  let count = 0;
  while (dates.has(day)) {
    count++;
    day = addDays(day, -1);
  }
  return count;
}
export function validateGoal(g: Pick<Goal, "title" | "target" | "duration">) {
  if (!g.title.trim() || g.title.length > 120)
    throw new Error("Informe um título de até 120 caracteres.");
  if (!Number.isFinite(g.target) || g.target <= 0 || g.target > 10000)
    throw new Error("A quantidade deve estar entre 0 e 10.000.");
  if (!Number.isFinite(g.duration) || g.duration < 0 || g.duration > 1440)
    throw new Error("Informe uma duração de 0 a 1.440 minutos.");
}
export function ministrySummary(
  logs: Activity[],
  uid: string,
  date: string,
  target: number,
) {
  const month = date.slice(0, 7);
  const hours = logs
    .filter(
      (l) =>
        l.kind === "ministry" && l.ownerId === uid && l.date.startsWith(month),
    )
    .reduce((s, l) => s + l.duration / 60, 0);
  const [start, end] = period(date, "monthly");
  const day = Number(date.slice(-2));
  const total = Number(end.slice(-2));
  return {
    hours,
    remaining: Math.max(0, target - hours),
    projection: (hours / day) * total,
    start,
    end,
  };
}

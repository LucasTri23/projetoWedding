import { addDays } from "./business";
import type { Plan } from "./types";

export type RecurrenceFrequency = "none" | "daily" | "weekly" | "monthly";
export function recurringDates(
  start: string,
  end: string,
  frequency: RecurrenceFrequency,
  interval = 1,
): string[] {
  const valid = (date: string) =>
    /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    Number.isFinite(Date.parse(`${date}T12:00:00Z`)) &&
    new Date(`${date}T12:00:00Z`).toISOString().slice(0, 10) === date;
  if (!valid(start)) throw new Error("Escolha uma data inicial válida.");
  if (frequency === "none") return [start];
  if (!["daily", "weekly", "monthly"].includes(frequency))
    throw new Error("Escolha uma repetição válida.");
  if (!valid(end) || end < start)
    throw new Error(
      "O fim da repetição deve ser na data inicial ou depois dela.",
    );
  if (end > addDays(start, 365))
    throw new Error("Crie a programação recorrente para até um ano por vez.");
  if (!Number.isInteger(interval) || interval < 1 || interval > 12)
    throw new Error("O intervalo deve estar entre 1 e 12.");
  const result: string[] = [];
  const [year, month, day] = start.split("-").map(Number);
  for (let index = 0; index < 400; index++) {
    let date: string;
    if (frequency === "monthly") {
      const first = new Date(
        Date.UTC(year, month - 1 + index * interval, 1, 12),
      );
      const last = new Date(
        Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0, 12),
      ).getUTCDate();
      first.setUTCDate(Math.min(day, last));
      date = first.toISOString().slice(0, 10);
    } else
      date = addDays(
        start,
        index * interval * (frequency === "weekly" ? 7 : 1),
      );
    if (date > end) break;
    result.push(date);
  }
  return result;
}
export function recurrenceInfo(plan: Pick<Plan, "id">) {
  const match =
    /^(recurring:(daily|weekly|monthly):(\d+):[a-f0-9-]{36}:)\d{4}-\d{2}-\d{2}$/.exec(
      plan.id,
    );
  if (!match) return null;
  return {
    series: match[1],
    frequency: match[2] as Exclude<RecurrenceFrequency, "none">,
    interval: Number(match[3]),
  };
}
export function futureOccurrences(plan: Plan, plans: Plan[]) {
  const info = recurrenceInfo(plan);
  return info
    ? plans.filter(
        (p) =>
          p.ownerId === plan.ownerId &&
          recurrenceInfo(p)?.series === info.series &&
          p.date >= plan.date,
      )
    : [plan];
}

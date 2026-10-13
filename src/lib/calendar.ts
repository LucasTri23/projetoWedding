import { addDays } from "./business";
import type { Plan } from "./types";
export function calendarDays(month: string): string[] {
  const first = `${month}-01`;
  const weekday = new Date(`${first}T12:00:00Z`).getUTCDay();
  const start = addDays(first, -((weekday + 6) % 7));
  return Array.from({ length: 42 }, (_, index) => addDays(start, index));
}
export function shiftMonth(month: string, offset: number) {
  const [year, m] = month.split("-").map(Number);
  return new Date(Date.UTC(year, m - 1 + offset, 1, 12))
    .toISOString()
    .slice(0, 7);
}
export function planParticipants(plan: Plan): string[] {
  return plan.participants || [plan.ownerId];
}
export function validatePlan(
  plan: Pick<
    Plan,
    | "title"
    | "date"
    | "time"
    | "endTime"
    | "participants"
    | "visibility"
    | "ownerId"
  >,
) {
  if (!plan.title.trim() || plan.title.length > 120)
    throw new Error("Informe o nome da atividade, até 120 caracteres.");
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(plan.date) ||
    new Date(`${plan.date}T12:00:00Z`).toISOString().slice(0, 10) !== plan.date
  )
    throw new Error("Escolha uma data válida.");
  const validTime = (t: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(t);
  if (plan.time && !validTime(plan.time))
    throw new Error("Informe um horário de início válido.");
  if (
    plan.endTime &&
    (!plan.time || !validTime(plan.endTime) || plan.endTime <= plan.time)
  )
    throw new Error("O término deve ser depois do início, no mesmo dia.");
  const participants = planParticipants(plan as Plan);
  if (
    !participants.length ||
    participants.length > 2 ||
    new Set(participants).size !== participants.length
  )
    throw new Error("Escolha pelo menos um participante.");
  if (
    plan.visibility === "private" &&
    (participants.length !== 1 || participants[0] !== plan.ownerId)
  )
    throw new Error(
      "Uma programação pessoal deve ter apenas você como participante.",
    );
}

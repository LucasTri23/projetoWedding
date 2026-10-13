import { describe, expect, it } from "vitest";
import {
  ministrySummary,
  period,
  progress,
  streak,
  today,
  validateGoal,
} from "../src/lib/business";
import type { Activity, Goal } from "../src/lib/types";
const goal = {
  id: "g",
  ownerId: "a",
  coupleId: "c",
  title: "Exercício",
  frequency: "weekly",
  target: 3,
  type: "parallel",
  duration: 0,
} as Goal;
const log = (ownerId: string, date: string, amount = 1) =>
  ({
    id: ownerId + date,
    goalId: "g",
    ownerId,
    date,
    amount,
    duration: 60,
    kind: "activity",
  }) as Activity;
describe("planejamento flexível e progresso", () => {
  it("aceita registros em quaisquer dias, sem agenda", () => {
    expect(
      progress(
        goal,
        [log("a", "2026-10-12"), log("a", "2026-10-15")],
        "a",
        "2026-10-16",
      ),
    ).toEqual({ done: 2, remaining: 1, percent: 67 });
  });
  it("mantém paralelas individuais", () => {
    expect(
      progress(
        goal,
        [log("a", "2026-10-12"), log("b", "2026-10-12")],
        "a",
        "2026-10-13",
      ).done,
    ).toBe(1);
  });
  it("conta registro compartilhado uma única vez para ambos", () => {
    const shared = { ...goal, type: "shared" as const, target: 1 };
    const logs = [log("a", "2026-10-13")];
    expect(progress(shared, logs, "a", "2026-10-13").done).toBe(1);
    expect(progress(shared, logs, "b", "2026-10-13").done).toBe(1);
  });
  it("limita percentual sem perder quantidade realizada", () => {
    expect(
      progress(goal, [log("a", "2026-10-13", 4)], "a", "2026-10-13"),
    ).toEqual({ done: 4, remaining: 0, percent: 100 });
  });
  it("separa períodos e trata domingo como fim da semana", () => {
    expect(period("2026-10-18", "weekly")).toEqual([
      "2026-10-12",
      "2026-10-18",
    ]);
    expect(period("2024-02-29", "monthly")).toEqual([
      "2024-02-01",
      "2024-02-29",
    ]);
    expect(
      progress(goal, [log("a", "2026-10-11")], "a", "2026-10-13").done,
    ).toBe(0);
  });
  it("calcula sequência incluindo ontem se hoje ainda não foi feito", () => {
    expect(
      streak(
        [log("a", "2026-10-11"), log("a", "2026-10-12")],
        "g",
        "a",
        "2026-10-13",
      ),
    ).toBe(2);
  });
  it("usa fuso de São Paulo ao virar o dia UTC", () => {
    expect(today("America/Sao_Paulo", new Date("2026-10-14T01:00:00Z"))).toBe(
      "2026-10-13",
    );
  });
  it("rejeita metas inválidas", () => {
    expect(() => validateGoal({ title: "", target: 3, duration: 0 })).toThrow();
    expect(() =>
      validateGoal({ title: "Ler", target: 0, duration: 0 }),
    ).toThrow();
    expect(() =>
      validateGoal({ title: "Ler", target: 1, duration: NaN }),
    ).toThrow();
  });
  it("não soma horas ministeriais do par", () => {
    const logs = [
      { ...log("a", "2026-10-13"), kind: "ministry" as const },
      { ...log("b", "2026-10-13"), kind: "ministry" as const },
    ];
    expect(ministrySummary(logs, "a", "2026-10-13", 10).hours).toBe(1);
  });
});

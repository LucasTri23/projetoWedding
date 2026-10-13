import { describe, expect, it } from "vitest";
import {
  recurringDates,
  recurrenceInfo,
  futureOccurrences,
} from "../src/lib/recurrence";
import type { Plan } from "../src/lib/types";
describe("atividades únicas e recorrentes", () => {
  it("atividade única não gera programação automática", () => {
    expect(recurringDates("2026-10-13", "", "none")).toEqual(["2026-10-13"]);
  });
  it("repete diariamente com intervalo e inclui data final", () => {
    expect(recurringDates("2026-10-13", "2026-10-17", "daily", 2)).toEqual([
      "2026-10-13",
      "2026-10-15",
      "2026-10-17",
    ]);
  });
  it("repete semanalmente a partir do dia escolhido", () => {
    expect(recurringDates("2026-10-13", "2026-11-10", "weekly", 2)).toEqual([
      "2026-10-13",
      "2026-10-27",
      "2026-11-10",
    ]);
  });
  it("mensal preserva a data âncora ao atravessar mês curto", () => {
    expect(recurringDates("2026-01-31", "2026-03-31", "monthly")).toEqual([
      "2026-01-31",
      "2026-02-28",
      "2026-03-31",
    ]);
    expect(recurringDates("2024-01-31", "2024-03-31", "monthly")).toContain(
      "2024-02-29",
    );
  });
  it("rejeita fim anterior, data inválida e intervalo inválido", () => {
    expect(() =>
      recurringDates("2026-10-13", "2026-10-12", "weekly"),
    ).toThrow();
    expect(() => recurringDates("2026-02-30", "2026-03-01", "daily")).toThrow();
    expect(() =>
      recurringDates("2026-10-13", "2026-11-01", "daily", 0),
    ).toThrow();
  });
  it("limita a série a um ano e ao tamanho do lote", () => {
    expect(() => recurringDates("2026-10-13", "2027-10-14", "daily")).toThrow();
    expect(recurringDates("2026-10-13", "2027-10-13", "daily")).toHaveLength(
      366,
    );
  });
  it("identifica série sem alterar dados de agendas antigas", () => {
    expect(recurrenceInfo({ id: "antigo" })).toBeNull();
    const id =
      "recurring:weekly:2:12345678-1234-1234-1234-123456789abc:2026-10-13";
    expect(recurrenceInfo({ id })?.interval).toBe(2);
  });
  it("exclui apenas a série, titular e ocorrências futuras escolhidas", () => {
    const prefix = "recurring:weekly:1:12345678-1234-1234-1234-123456789abc:";
    const p = (date: string, ownerId = "a") =>
      ({ id: prefix + date, date, ownerId }) as Plan;
    const target = p("2026-10-20");
    const plans = [
      p("2026-10-13"),
      target,
      p("2026-10-27"),
      p("2026-11-03", "b"),
      { ...p("2026-10-27"), id: "outra-serie" },
    ];
    expect(futureOccurrences(target, plans)).toEqual([target, p("2026-10-27")]);
  });
});

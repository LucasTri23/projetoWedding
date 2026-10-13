import { describe, expect, it } from "vitest";
import {
  calendarDays,
  planParticipants,
  shiftMonth,
  validatePlan,
} from "../src/lib/calendar";
import type { Plan } from "../src/lib/types";
const plan = {
  title: "Pregação",
  date: "2026-10-13",
  time: "09:00",
  endTime: "11:00",
  participants: ["a"],
  ownerId: "a",
  visibility: "private",
} as Plan;
describe("calendário e programação", () => {
  it("começa na segunda e cobre seis semanas", () => {
    const days = calendarDays("2026-10");
    expect(days).toHaveLength(42);
    expect(days[0]).toBe("2026-09-28");
    expect(days[41]).toBe("2026-11-08");
  });
  it("navega entre anos e meses bissextos", () => {
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
    expect(calendarDays("2024-02")).toContain("2024-02-29");
  });
  it("aceita programação pessoal e compartilhada", () => {
    expect(() => validatePlan(plan)).not.toThrow();
    expect(() =>
      validatePlan({ ...plan, visibility: "couple", participants: ["a", "b"] }),
    ).not.toThrow();
  });
  it("impede intervalos inválidos e participantes duplicados", () => {
    expect(() => validatePlan({ ...plan, endTime: "08:00" })).toThrow();
    expect(() => validatePlan({ ...plan, participants: ["a", "a"] })).toThrow();
    expect(() => validatePlan({ ...plan, participants: [] })).toThrow();
    expect(() => validatePlan({ ...plan, participants: ["b"] })).toThrow();
  });
  it("rejeita data inexistente e mantém agendas antigas", () => {
    expect(() => validatePlan({ ...plan, date: "2026-02-30" })).toThrow();
    expect(planParticipants({ ...plan, participants: undefined })).toEqual([
      "a",
    ]);
  });
});

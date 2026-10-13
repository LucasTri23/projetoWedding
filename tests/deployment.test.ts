import { describe, expect, it } from "vitest";
import { pagesBase } from "../src/lib/deployment";
describe("GitHub Pages", () => {
  it("suporta repositório de projeto", () =>
    expect(pagesBase("casal/metas")).toBe("/metas/"));
  it("suporta repositório de usuário e execução local", () => {
    expect(pagesBase("casal/casal.github.io")).toBe("/");
    expect(pagesBase()).toBe("/");
  });
  it("suporta domínio personalizado e caminho explícito", () => {
    expect(pagesBase("casal/metas", "/")).toBe("/");
    expect(pagesBase(undefined, "/juntos/")).toBe("/juntos/");
  });
  it("rejeita caminho ambíguo", () => {
    expect(() => pagesBase(undefined, "metas")).toThrow();
    expect(() => pagesBase(undefined, "//external/")).toThrow();
  });
});

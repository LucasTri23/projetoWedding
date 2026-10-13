import { describe, expect, it } from "vitest";
import {
  bibleBooks,
  bibleChapterUrl,
  dailyBibleGoals,
  nextChapter,
} from "../src/lib/bible";
import { studyTopics } from "../src/lib/studyTopics";
import type { Goal } from "../src/lib/types";
describe("leitura bíblica e roteiros", () => {
  it("catálogo tem 66 livros e 1189 capítulos", () => {
    expect(bibleBooks).toHaveLength(66);
    expect(bibleBooks.reduce((s, b) => s + b.chapters, 0)).toBe(1189);
  });
  it("links de compartilhamento identificam livro e capítulo", () => {
    const url = new URL(bibleChapterUrl(1, 1));
    expect(url.hostname).toBe("www.jw.org");
    expect(url.searchParams.get("bible")).toBe("01001000");
    expect(new URL(bibleChapterUrl(66, 22)).searchParams.get("bible")).toBe(
      "66022000",
    );
  });
  it("rejeita capítulo inexistente", () => {
    expect(() => bibleChapterUrl(1, 51)).toThrow();
    expect(() => bibleChapterUrl(67, 1)).toThrow();
    expect(() => bibleChapterUrl(1, 0)).toThrow();
  });
  it("aba depende de uma meta bíblica diária ativa", () => {
    const daily = {
      id: "daily",
      title: "Leitura diária da Bíblia",
      frequency: "daily",
      archived: false,
    } as Goal;
    const other = { ...daily, id: "other", title: "Exercícios" };
    expect(
      dailyBibleGoals([
        daily,
        other,
        { ...daily, frequency: "weekly" },
        { ...daily, archived: true },
      ]),
    ).toEqual([daily]);
    expect(
      dailyBibleGoals([{ ...daily, title: "Leitura biblica" }]),
    ).toHaveLength(1);
  });
  it("avança entre capítulos e livros e termina ao concluir a Bíblia", () => {
    expect(nextChapter(1, 1)).toEqual({ book: 1, chapter: 2 });
    expect(nextChapter(1, 50)).toEqual({ book: 2, chapter: 1 });
    expect(nextChapter(66, 22)).toBeNull();
  });
  it("roteiros têm fontes oficiais e perguntas originais", () => {
    expect(studyTopics).toHaveLength(5);
    for (const topic of studyTopics) {
      expect(new URL(topic.url).hostname).toBe("www.jw.org");
      expect(topic.questions).toHaveLength(3);
      expect(topic.summary.length).toBeLessThan(500);
    }
  });
});

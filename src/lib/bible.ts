import type { Goal } from "./types";
const names = [
  "Gênesis",
  "Êxodo",
  "Levítico",
  "Números",
  "Deuteronômio",
  "Josué",
  "Juízes",
  "Rute",
  "1 Samuel",
  "2 Samuel",
  "1 Reis",
  "2 Reis",
  "1 Crônicas",
  "2 Crônicas",
  "Esdras",
  "Neemias",
  "Ester",
  "Jó",
  "Salmos",
  "Provérbios",
  "Eclesiastes",
  "Cântico de Salomão",
  "Isaías",
  "Jeremias",
  "Lamentações",
  "Ezequiel",
  "Daniel",
  "Oseias",
  "Joel",
  "Amós",
  "Obadias",
  "Jonas",
  "Miqueias",
  "Naum",
  "Habacuque",
  "Sofonias",
  "Ageu",
  "Zacarias",
  "Malaquias",
  "Mateus",
  "Marcos",
  "Lucas",
  "João",
  "Atos",
  "Romanos",
  "1 Coríntios",
  "2 Coríntios",
  "Gálatas",
  "Efésios",
  "Filipenses",
  "Colossenses",
  "1 Tessalonicenses",
  "2 Tessalonicenses",
  "1 Timóteo",
  "2 Timóteo",
  "Tito",
  "Filêmon",
  "Hebreus",
  "Tiago",
  "1 Pedro",
  "2 Pedro",
  "1 João",
  "2 João",
  "3 João",
  "Judas",
  "Apocalipse",
];
const counts = [
  50, 40, 27, 36, 34, 24, 21, 4, 31, 24, 22, 25, 29, 36, 10, 13, 10, 42, 150,
  31, 12, 8, 66, 52, 5, 48, 12, 14, 3, 9, 1, 4, 7, 3, 3, 3, 2, 14, 4, 28, 16,
  24, 21, 28, 16, 16, 13, 6, 6, 4, 4, 5, 3, 6, 4, 3, 1, 13, 5, 5, 3, 5, 1, 1, 1,
  22,
];
export const bibleBooks = names.map((name, index) => ({
  id: index + 1,
  name,
  chapters: counts[index],
}));
export function bibleChapterUrl(book: number, chapter: number) {
  const entry = bibleBooks.find((b) => b.id === book);
  if (
    !entry ||
    !Number.isInteger(chapter) ||
    chapter < 1 ||
    chapter > entry.chapters
  )
    throw new Error("Selecione um livro e capítulo válidos.");
  return `https://www.jw.org/finder?pub=nwtsty&bible=${String(book).padStart(2, "0")}${String(chapter).padStart(3, "0")}000&wtlocale=T&srcid=share`;
}
export function dailyBibleGoals(goals: Goal[]) {
  return goals.filter(
    (g) =>
      !g.archived &&
      g.frequency === "daily" &&
      /\bbiblia\b|\bbiblica\b/.test(
        g.title
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase(),
      ),
  );
}
export function nextChapter(book: number, chapter: number) {
  const entry = bibleBooks.find((b) => b.id === book);
  if (
    !entry ||
    !Number.isInteger(chapter) ||
    chapter < 1 ||
    chapter > entry.chapters
  )
    throw new Error("Capítulo inválido.");
  return chapter < entry.chapters
    ? { book, chapter: chapter + 1 }
    : book < 66
      ? { book: book + 1, chapter: 1 }
      : null;
}

import { useState } from "react";
import { Navigate } from "react-router-dom";
import { ArrowUpRight, BookOpen, Check, Headphones } from "lucide-react";
import { useData } from "../lib/context";
import {
  bibleBooks,
  bibleChapterUrl,
  dailyBibleGoals,
  nextChapter,
} from "../lib/bible";
import { saveRecord } from "../lib/service";
import { today, progress } from "../lib/business";
import type { Activity } from "../lib/types";
import { Field, Heading, Progress } from "../components/ui";
import { GoalEditor } from "./Goals";
export function BibleReading() {
  const { user, profile, couple, goals, logs, run } = useData();
  const available = dailyBibleGoals(goals);
  const [goalId, setGoalId] = useState(available[0]?.id || "");
  const goal = available.find((g) => g.id === goalId) || available[0];
  const [book, setBook] = useState(1);
  const [chapter, setChapter] = useState(1);
  const [readingType, setReadingType] = useState("sequencial");
  const [method, setMethod] = useState("Leitura");
  const [reflection, setReflection] = useState("");
  const [busy, setBusy] = useState(false);
  const [newGoal, setNewGoal] = useState<"individual" | "shared" | null>(null);
  if (!goal) return <Navigate to="/habitos" replace />;
  const selected = bibleBooks.find((b) => b.id === book)!;
  const url = bibleChapterUrl(book, chapter);
  const date = today(profile?.timezone);
  const p = progress(goal, logs, user!.uid, date);
  const recent = logs
    .filter((l) => available.some((g) => g.id === l.goalId))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6);
  async function register(e: React.FormEvent) {
    e.preventDefault();
    if (p.remaining === 0) return;
    setBusy(true);
    const shared = goal.type === "shared";
    const ok = await run(
      () =>
        saveRecord<Activity>("activityLogs", {
          ownerId: user!.uid,
          coupleId: shared ? profile!.coupleId : null,
          goalId: goal.id,
          title: goal.title,
          category: goal.category,
          date,
          amount: 1,
          duration: 0,
          notes: reflection,
          details: `${selected.name} ${chapter} · ${method} · ${readingType === "sequencial" ? "Leitura sequencial" : "Escolha livre"}`,
          kind: "activity",
          visibility: shared ? "couple" : "private",
          participants: shared ? couple!.memberIds : [user!.uid],
        }),
      "Leitura registrada. Um passo de cada vez.",
    );
    setBusy(false);
    if (ok) {
      setReflection("");
      if (readingType === "sequencial") {
        const next = nextChapter(book, chapter);
        if (next) {
          setBook(next.book);
          setChapter(next.chapter);
        }
      }
    }
  }
  return (
    <>
      <Heading
        eyebrow="UM MOMENTO PARA A PALAVRA DE DEUS"
        title="Leitura da Bíblia"
        description="Sua meta diária abriu este espaço. Escolha o capítulo, leia ou ouça na fonte oficial e registre o que realizou."
      />
      <div className="profile-grid">
        <article className="panel">
          <form onSubmit={register}>
            <div className="inline-actions">
              {!available.some((g) => g.type !== "shared") && (
                <button
                  type="button"
                  className="button secondary small"
                  onClick={() => setNewGoal("individual")}
                >
                  Criar leitura individual
                </button>
              )}
              {couple && !available.some((g) => g.type === "shared") && (
                <button
                  type="button"
                  className="button secondary small"
                  onClick={() => setNewGoal("shared")}
                >
                  Adicionar leitura conjunta
                </button>
              )}
            </div>
            <Field label="Meta e modalidade">
              <select
                value={goal.id}
                onChange={(e) => setGoalId(e.target.value)}
              >
                {available.map((g) => (
                  <option value={g.id} key={g.id}>
                    {g.title} ·{" "}
                    {g.type === "shared" ? "Em conjunto" : "Individual"}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Tipo de leitura">
              <select
                value={readingType}
                onChange={(e) => setReadingType(e.target.value)}
              >
                <option value="sequencial">
                  Sequencial — avançar após o registro
                </option>
                <option value="livre">
                  Livre — escolher qualquer capítulo
                </option>
              </select>
            </Field>
            <div className="form-grid">
              <Field label="Livro">
                <select
                  value={book}
                  onChange={(e) => {
                    setBook(Number(e.target.value));
                    setChapter(1);
                  }}
                >
                  {bibleBooks.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Capítulo">
                <select
                  value={chapter}
                  onChange={(e) => setChapter(Number(e.target.value))}
                >
                  {Array.from({ length: selected.chapters }, (_, i) => (
                    <option key={i} value={i + 1}>
                      {i + 1}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Como fiz a leitura">
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
              >
                <option>Leitura</option>
                <option>Áudio</option>
                <option>Leitura e áudio</option>
              </select>
            </Field>
            <div className="inline-actions">
              <a className="button" href={url} target="_blank" rel="noreferrer">
                <BookOpen size={17} /> Abrir capítulo <ArrowUpRight size={15} />
              </a>
              <a
                className="button secondary"
                href={url}
                target="_blank"
                rel="noreferrer"
              >
                <Headphones size={17} /> Ouvir no jw.org
              </a>
            </div>
            <p className="muted">
              O áudio toca no site oficial, nos capítulos disponíveis. Abrir o
              link não conclui sua meta.
            </p>
            <Field label="O que quero guardar desta leitura? (opcional)">
              <textarea
                maxLength={5000}
                rows={3}
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
              />
            </Field>
            <button
              className="button full"
              disabled={
                busy || p.remaining === 0 || (goal.type === "shared" && !couple)
              }
            >
              <Check size={17} />
              {p.remaining === 0
                ? "Meta de hoje alcançada"
                : busy
                  ? "Registrando…"
                  : "Registrar minha leitura de hoje"}
            </button>
          </form>
        </article>
        <article className="panel">
          <h2>Seu ritmo de hoje</h2>
          <p>
            {p.done} de {goal.target} realização(ões)
          </p>
          <Progress value={p.percent} />
          <p className="muted">
            {goal.type === "shared"
              ? "Um registro em conjunto contribui para os dois."
              : "Suas leituras e reflexões são privadas, inclusive quando a meta é paralela."}
          </p>
          <h2 className="study-history">Últimas leituras</h2>
          {recent.length ? (
            recent.map((l) => (
              <div className="list-row" key={l.id}>
                <div>
                  <b>{l.details || l.title}</b>
                  <p>{l.date.split("-").reverse().join("/")}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="muted">
              Sua primeira leitura registrada aparecerá aqui.
            </p>
          )}
          <a
            className="text-link"
            href="https://www.jw.org/pt/ajuda-online/como-usar-jw-org/biblia-estudo-tnm/"
            target="_blank"
            rel="noreferrer"
          >
            Como ouvir os capítulos no site oficial →
          </a>
        </article>
      </div>
      {newGoal && (
        <GoalEditor
          goal={{
            title:
              newGoal === "shared"
                ? "Leitura diária da Bíblia em conjunto"
                : "Leitura diária da Bíblia",
            category: "Espiritualidade",
            frequency: "daily",
            target: 1,
            type:
              newGoal === "shared"
                ? "shared"
                : couple
                  ? "parallel"
                  : "individual",
          }}
          close={() => setNewGoal(null)}
        />
      )}
    </>
  );
}

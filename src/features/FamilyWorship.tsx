import { useState } from "react";
import { ArrowUpRight, BookOpen, Check, Heart } from "lucide-react";
import { useData } from "../lib/context";
import { studyTopics } from "../lib/studyTopics";
import { saveRecord } from "../lib/service";
import type { Note } from "../lib/types";
import { today } from "../lib/business";
import { Field, Heading, Modal } from "../components/ui";
import { dailyBibleGoals } from "../lib/bible";
import { GoalEditor } from "./Goals";
import { Link } from "react-router-dom";
type Topic = (typeof studyTopics)[number];
function StudyGuide({ topic, close }: { topic: Topic; close: () => void }) {
  const { user, profile, couple, run } = useData();
  const [mode, setMode] = useState<"individual" | "together">("individual");
  const [answers, setAnswers] = useState<string[]>(
    topic.questions.map(() => ""),
  );
  const [learning, setLearning] = useState("");
  const [application, setApplication] = useState("");
  const [busy, setBusy] = useState(false);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const together = mode === "together";
    const text = [
      `Data: ${today(profile?.timezone)}`,
      `Modalidade: ${together ? "Estudo em conjunto" : "Estudo individual"}`,
      `Referência: ${topic.sourceTitle}`,
      topic.url,
      ...topic.questions.flatMap((q, i) => [q, answers[i] || "(sem anotação)"]),
      `Aprendizados: ${learning}`,
      `Aplicação prática: ${application}`,
    ].join("\n\n");
    const ok = await run(
      () =>
        saveRecord<Note>("sharedNotes", {
          ownerId: user!.uid,
          coupleId: together ? profile!.coupleId : null,
          title: `Estudo: ${topic.title}`,
          text,
          kind: "note",
          done: false,
          visibility: together ? "couple" : "private",
        }),
      "Estudo salvo no caderno.",
    );
    setBusy(false);
    if (ok) close();
  }
  return (
    <Modal title={topic.title} close={close}>
      <p>{topic.summary}</p>
      <a
        className="text-link"
        href={topic.url}
        target="_blank"
        rel="noreferrer"
      >
        Ler o artigo completo no jw.org <ArrowUpRight size={16} />
      </a>
      <form onSubmit={save} className="study-guide-form">
        <Field label="Como vamos estudar?">
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as typeof mode)}
          >
            <option value="individual">Individual — anotações privadas</option>
            <option value="together" disabled={!couple}>
              Em conjunto — anotações compartilhadas
            </option>
          </select>
        </Field>
        {topic.questions.map((question, i) => (
          <Field label={question} key={question}>
            <textarea
              maxLength={1000}
              rows={2}
              value={answers[i]}
              onChange={(e) =>
                setAnswers((values) =>
                  values.map((v, index) => (index === i ? e.target.value : v)),
                )
              }
            />
          </Field>
        ))}
        <Field label="O que aprendemos? (opcional)">
          <textarea
            maxLength={1500}
            rows={3}
            value={learning}
            onChange={(e) => setLearning(e.target.value)}
          />
        </Field>
        <Field label="Aplicação prática (opcional)">
          <textarea
            maxLength={1500}
            rows={3}
            value={application}
            onChange={(e) => setApplication(e.target.value)}
          />
        </Field>
        <button className="button full" disabled={busy}>
          <Check size={17} />
          {busy ? "Salvando…" : "Salvar nosso estudo"}
        </button>
      </form>
    </Modal>
  );
}
export function FamilyWorship() {
  const { notes, goals, couple } = useData();
  const [readingGoal, setReadingGoal] = useState(false);
  const [topic, setTopic] = useState<Topic | null>(null);
  const recent = notes
    .filter((n) => n.title.startsWith("Estudo: "))
    .sort(
      (a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0),
    )
    .slice(0, 5);
  return (
    <>
      <Heading
        eyebrow="CRESCER JUNTOS, PRESERVAR O ESPAÇO DE CADA UM"
        title="Adoração em família"
        description="Temas para estudar juntos ou individualmente. Escolham a leitura e guardem seus aprendizados."
        action={
          dailyBibleGoals(goals).length ? (
            <Link className="button secondary" to="/leitura-biblia">
              <BookOpen size={17} /> Leitura da Bíblia
            </Link>
          ) : (
            <button
              className="button secondary"
              onClick={() => setReadingGoal(true)}
            >
              <BookOpen size={17} /> Definir minha leitura diária
            </button>
          )
        }
      />
      <div className="info">
        <Heart size={19} /> Estes roteiros do Cultiva são resumos breves e
        perguntas originais inspiradas nas referências. O artigo completo
        permanece no jw.org. Vocês podem usá-los na preparação para o casamento.
      </div>
      <div className="goal-grid">
        {studyTopics.map((t) => (
          <article className="reference-card panel" key={t.id}>
            <BookOpen size={24} />
            <span className="eyebrow">{t.category}</span>
            <h3>{t.title}</h3>
            <p>{t.summary}</p>
            <a
              className="text-link"
              href={t.url}
              target="_blank"
              rel="noreferrer"
            >
              {t.sourceTitle}
              <ArrowUpRight size={15} />
            </a>
            <button className="button secondary" onClick={() => setTopic(t)}>
              Abrir roteiro de estudo
            </button>
          </article>
        ))}
      </div>
      <article className="panel study-history">
        <div className="section-heading">
          <h2>Estudos guardados</h2>
          <a className="text-link" href="#/caderno">
            Abrir caderno →
          </a>
        </div>
        {recent.length ? (
          recent.map((n) => (
            <div className="list-row" key={n.id}>
              <div>
                <b>{n.title.replace("Estudo: ", "")}</b>
                <p>
                  {n.visibility === "couple"
                    ? "Em conjunto"
                    : "Individual · privado"}
                </p>
              </div>
            </div>
          ))
        ) : (
          <p className="muted">
            Escolha um tema e salve suas reflexões. O estudo individual também
            tem espaço aqui.
          </p>
        )}
      </article>
      {topic && <StudyGuide topic={topic} close={() => setTopic(null)} />}
      {readingGoal && (
        <GoalEditor
          goal={{
            title: "Leitura diária da Bíblia",
            category: "Espiritualidade",
            frequency: "daily",
            target: 1,
            type: couple ? "parallel" : "individual",
          }}
          close={() => setReadingGoal(false)}
        />
      )}
    </>
  );
}

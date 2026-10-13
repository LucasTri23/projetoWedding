import { useState } from "react";
import { Plus, Trash2, Check } from "lucide-react";
import { useData } from "../lib/context";
import { removeRecord, saveRecord } from "../lib/service";
import type { Note } from "../lib/types";
import { Empty, Field, Heading, Modal } from "../components/ui";
export function Notes() {
  const { user, profile, notes, run } = useData();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Note | null>(null);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [kind, setKind] = useState<Note["kind"]>("note");
  const [shared, setShared] = useState(false);
  const [filter, setFilter] = useState("all");
  const [busy, setBusy] = useState(false);
  const labels = {
    note: "Anotação",
    shopping: "Lista de compras",
    meal: "Plano alimentar",
    review: "Revisão mensal",
    category: "Categoria personalizada",
  };
  function edit(n: Note) {
    setEditing(n);
    setTitle(n.title);
    setText(n.text);
    setKind(n.kind);
    setShared(n.visibility === "couple");
    setOpen(true);
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const ok = await run(
      () =>
        saveRecord<Note>(
          "sharedNotes",
          {
            ownerId: user!.uid,
            coupleId: shared ? profile!.coupleId : null,
            title,
            text,
            kind,
            done: editing?.done || false,
            visibility: shared ? "couple" : "private",
          },
          editing?.id,
        ),
      "Anotação salva.",
    );
    setBusy(false);
    if (ok) setOpen(false);
  }
  return (
    <>
      <Heading
        eyebrow="IDEIAS QUE MERECEM UM LUGAR"
        title="Nosso caderno"
        description="Conversas, refeições, compras e reflexões para a vida que estamos construindo."
        action={
          <button
            className="button"
            onClick={() => {
              setEditing(null);
              setTitle("");
              setText("");
              setOpen(true);
            }}
          >
            <Plus size={18} /> Nova anotação
          </button>
        }
      />
      <div className="toolbar">
        <select
          aria-label="Tipo de anotação"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">Todas as anotações</option>
          {Object.entries(labels).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </div>
      <div className="goal-grid">
        {notes
          .filter((n) => filter === "all" || n.kind === filter)
          .map((n) => (
            <article className="panel note-card" key={n.id}>
              <span className="badge">
                {labels[n.kind]} ·{" "}
                {n.visibility === "couple" ? "Casal" : "Pessoal"}
              </span>
              <h3 className={n.done ? "done" : ""}>{n.title}</h3>
              <p className="note-text">{n.text}</p>
              {n.ownerId === user!.uid && (
                <div className="note-actions">
                  <button
                    className="button secondary small"
                    onClick={() => edit(n)}
                  >
                    Editar
                  </button>
                  {n.kind === "shopping" && (
                    <button
                      className="icon-button"
                      aria-label="Alternar item comprado"
                      onClick={() =>
                        run(() =>
                          saveRecord<Note>(
                            "sharedNotes",
                            { ...n, done: !n.done },
                            n.id,
                          ),
                        )
                      }
                    >
                      <Check size={18} />
                    </button>
                  )}
                  <button
                    className="icon-button danger"
                    aria-label={`Excluir ${n.title}`}
                    onClick={() =>
                      run(
                        () => removeRecord("sharedNotes", n.id),
                        "Anotação removida.",
                      )
                    }
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              )}
            </article>
          ))}
      </div>
      {!notes.length && (
        <Empty title="Boas ideias começam com uma página em branco">
          Guarde temas de conversa, listas de compras e aprendizados.
          Compartilhe apenas o que escolher.
        </Empty>
      )}
      {open && (
        <Modal
          title={editing ? "Editar anotação" : "Uma página para suas ideias"}
          close={() => setOpen(false)}
        >
          <form onSubmit={submit}>
            <Field label="Tipo">
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value as Note["kind"])}
              >
                {Object.entries(labels).map(([k, v]) => (
                  <option value={k} key={k}>
                    {v}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Título">
              <input
                required
                maxLength={120}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  kind === "review"
                    ? "Revisão de outubro"
                    : "Uma ideia, um tema, um plano…"
                }
              />
            </Field>
            <Field label="Conteúdo">
              <textarea
                rows={7}
                maxLength={10000}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={
                  kind === "review"
                    ? "O que conseguimos melhorar?\nQual hábito foi mais difícil?\nO que aprendemos?\nO que queremos ajustar no próximo mês?"
                    : kind === "meal"
                      ? "Organize refeições de forma flexível e equilibrada."
                      : "Escreva aqui…"
                }
              />
            </Field>
            <label className="check-label">
              <input
                type="checkbox"
                disabled={!profile?.coupleId || Boolean(editing)}
                checked={shared}
                onChange={(e) => setShared(e.target.checked)}
              />{" "}
              Compartilhar com meu par
            </label>
            <button className="button full" disabled={busy}>
              {busy ? "Salvando…" : "Salvar anotação"}
            </button>
          </form>
        </Modal>
      )}
    </>
  );
}

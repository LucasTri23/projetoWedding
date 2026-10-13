import { useEffect, useState } from "react";
import { BookOpen, ArrowUpRight, Search, Plus } from "lucide-react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { references } from "../lib/references";
import { database, saveReference } from "../lib/service";
import { useData } from "../lib/context";
import { Field, Heading, Modal } from "../components/ui";
import { studyTopics } from "../lib/studyTopics";
type Reference = (typeof references)[number];
export function Library() {
  const { user, run, notify } = useData();
  const [custom, setCustom] = useState<Reference[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todas");
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [habits, setHabits] = useState("");
  const [newCategory, setNewCategory] = useState("Estudo pessoal");
  useEffect(
    () =>
      onSnapshot(
        query(
          collection(database(), "referenceLibrary"),
          where("ownerId", "==", user!.uid),
        ),
        (s) => setCustom(s.docs.map((d) => d.data() as Reference)),
        () => notify("Não foi possível carregar suas referências."),
      ),
    [user, notify],
  );
  const choices = [
    "Todas",
    "Bons hábitos",
    "Estudo pessoal",
    "Leitura bíblica",
    "Adoração em família",
    "Ministério",
    "Casamento",
    "Saúde",
    "Administração do tempo",
    "Financeiro",
  ];
  return (
    <>
      <Heading
        eyebrow="REFERÊNCIAS PARA NOSSA JORNADA"
        title="Biblioteca espiritual"
        description="Ideias e leituras para apoiar suas intenções, direto das fontes oficiais."
        action={
          <button className="button secondary" onClick={() => setOpen(true)}>
            <Plus size={17} /> Salvar referência
          </button>
        }
      />
      <div className="toolbar">
        <div className="search">
          <Search size={18} />
          <input
            aria-label="Pesquisar referências"
            placeholder="Encontrar uma leitura…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          aria-label="Categoria da biblioteca"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {choices.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>
      <div className="goal-grid">
        {[
          ...references,
          ...studyTopics
            .filter((t) => !references.some((r) => r.url === t.url))
            .map((t) => ({
              title: t.sourceTitle,
              url: t.url,
              category:
                t.category === "Financeiro"
                  ? "Financeiro"
                  : t.category === "Espiritualidade"
                    ? "Adoração em família"
                    : "Casamento",
              description: t.summary,
              habits: t.title,
            })),
          ...custom,
        ]
          .filter(
            (r) =>
              (category === "Todas" || r.category === category) &&
              `${r.title} ${r.habits}`
                .toLowerCase()
                .includes(search.toLowerCase()),
          )
          .map((r, i) => (
            <article className="reference-card panel" key={`${r.url}${i}`}>
              <BookOpen size={24} />
              <span className="eyebrow">{r.category}</span>
              <h3>{r.title}</h3>
              <p>{r.description}</p>
              <small className="muted">Hábitos relacionados: {r.habits}</small>
              <a
                className="text-link"
                target="_blank"
                rel="noreferrer"
                href={r.url}
              >
                Ler na fonte oficial <ArrowUpRight size={17} />
              </a>
            </article>
          ))}
      </div>
      <p className="disclaimer">
        Projeto pessoal, sem afiliação oficial com o jw.org. As publicações
        permanecem nos sites oficiais. Referências iniciais verificadas em
        13/10/2026.
      </p>
      {open && (
        <Modal title="Salvar referência oficial" close={() => setOpen(false)}>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (
                await run(
                  () =>
                    saveReference(
                      user!.uid,
                      title,
                      url,
                      newCategory,
                      description,
                      habits,
                    ),
                  "Referência salva.",
                )
              )
                setOpen(false);
            }}
          >
            <Field label="Título">
              <input
                required
                maxLength={120}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </Field>
            <Field label="Link oficial">
              <input
                required
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </Field>
            <Field label="Categoria">
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
              >
                {choices.slice(1).map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="Breve descrição">
              <textarea
                maxLength={1000}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Field>
            <Field label="Hábitos relacionados">
              <input
                maxLength={500}
                value={habits}
                onChange={(e) => setHabits(e.target.value)}
              />
            </Field>
            <button className="button full">Salvar referência</button>
          </form>
        </Modal>
      )}
    </>
  );
}

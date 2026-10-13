import { useState } from "react";
import {
  Check,
  Plus,
  Star,
  Copy,
  Pencil,
  Archive,
  Search,
  BookOpen,
  Dumbbell,
  Salad,
  Heart,
  Sprout,
  HandHeart,
  Wallet,
} from "lucide-react";
import { useData } from "../lib/context";
import { categories, frequencyLabels, typeLabels } from "../lib/types";
import type { Activity, Frequency, Goal, GoalType } from "../lib/types";
import { progress, today } from "../lib/business";
import { saveRecord } from "../lib/service";
import { Empty, Field, Heading, Modal, Progress } from "../components/ui";
export const categoryIcons = [
  BookOpen,
  Dumbbell,
  Salad,
  HandHeart,
  Heart,
  Sprout,
  Heart,
  Wallet,
];
export const templates = [
  {
    title: "Leitura diária da Bíblia",
    category: categories[0],
    frequency: "daily",
    target: 1,
    type: "parallel",
  },
  {
    title: "Texto diário",
    category: categories[0],
    frequency: "daily",
    target: 1,
    type: "individual",
  },
  {
    title: "Oração pessoal",
    category: categories[0],
    frequency: "daily",
    target: 1,
    type: "individual",
  },
  {
    title: "Estudo pessoal profundo",
    category: categories[0],
    frequency: "weekly",
    target: 1,
    type: "individual",
  },
  {
    title: "Preparação para reuniões",
    category: categories[0],
    frequency: "weekly",
    target: 2,
    type: "individual",
  },
  {
    title: "Estudo bíblico conjunto",
    category: categories[0],
    frequency: "weekly",
    target: 1,
    type: "shared",
  },
  {
    title: "Pesquisa de assuntos bíblicos",
    category: categories[0],
    frequency: "weekly",
    target: 1,
    type: "individual",
  },
  {
    title: "Leitura de publicações",
    category: categories[0],
    frequency: "weekly",
    target: 1,
    type: "individual",
  },
  {
    title: "Atividade física",
    category: categories[1],
    frequency: "weekly",
    target: 3,
    type: "parallel",
  },
  {
    title: "Consumir frutas",
    category: categories[2],
    frequency: "daily",
    target: 1,
    type: "parallel",
  },
  {
    title: "Verduras e legumes",
    category: categories[2],
    frequency: "daily",
    target: 1,
    type: "individual",
  },
  {
    title: "Beber água regularmente",
    category: categories[2],
    frequency: "daily",
    target: 1,
    type: "individual",
  },
  {
    title: "Planejar refeições",
    category: categories[2],
    frequency: "weekly",
    target: 1,
    type: "shared",
  },
  {
    title: "Reduzir excesso de ultraprocessados",
    category: categories[2],
    frequency: "daily",
    target: 1,
    type: "individual",
  },
  {
    title: "Horários adequados de alimentação",
    category: categories[2],
    frequency: "daily",
    target: 1,
    type: "individual",
  },
  {
    title: "Tempo de qualidade",
    category: categories[4],
    frequency: "weekly",
    target: 1,
    type: "shared",
  },
  {
    title: "Conversar sobre objetivos futuros",
    category: categories[4],
    frequency: "monthly",
    target: 1,
    type: "shared",
  },
  {
    title: "Estudar sobre casamento",
    category: categories[4],
    frequency: "weekly",
    target: 1,
    type: "shared",
  },
  {
    title: "Planejamento financeiro",
    category: categories[4],
    frequency: "monthly",
    target: 1,
    type: "shared",
  },
  {
    title: "Organização do casamento",
    category: categories[4],
    frequency: "weekly",
    target: 1,
    type: "shared",
  },
  {
    title: "Desenvolver a comunicação",
    category: categories[4],
    frequency: "weekly",
    target: 1,
    type: "shared",
  },
  {
    title: "Projeto juntos",
    category: categories[4],
    frequency: "monthly",
    target: 1,
    type: "shared",
  },
] as const;
export function GoalEditor({
  goal,
  close,
}: {
  goal?: Partial<Goal>;
  close: () => void;
}) {
  const { user, profile, notes, goals, run } = useData();
  const [title, setTitle] = useState(goal?.title || "");
  const [category, setCategory] = useState(goal?.category || categories[0]);
  const [customCategory, setCustomCategory] = useState("");
  const [frequency, setFrequency] = useState<Frequency>(
    goal?.frequency || "weekly",
  );
  const [target, setTarget] = useState(goal?.target || 1);
  const [duration, setDuration] = useState(goal?.duration || 0);
  const [type, setType] = useState<GoalType>(
    !profile?.coupleId && !goal?.id ? "individual" : goal?.type || "individual",
  );
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const ok = await run(
      () =>
        saveRecord<Goal>(
          "goals",
          {
            ownerId: user!.uid,
            coupleId: type === "individual" ? null : profile!.coupleId,
            title: title.trim(),
            category:
              category === "__custom__" ? customCategory.trim() : category,
            frequency,
            target,
            duration,
            type,
            favorite: goal?.favorite || false,
            archived: false,
          },
          goal?.id,
        ),
      "Meta salva. Um passo de cada vez!",
    );
    setBusy(false);
    if (ok) close();
  }
  return (
    <Modal title={goal?.id ? "Editar meta" : "Uma nova intenção"} close={close}>
      <p className="muted">
        Escolha o que deseja alcançar. Você decide os dias depois.
      </p>
      <form onSubmit={submit}>
        <Field label="Nome da meta">
          <input
            autoFocus
            required
            maxLength={120}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex.: caminhar ao ar livre"
          />
        </Field>
        <div className="form-grid">
          <Field label="Categoria">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {[
                ...new Set([
                  ...categories,
                  ...goals.map((g) => g.category),
                  ...notes
                    .filter((n) => n.kind === "category")
                    .map((n) => n.title),
                ]),
              ].map((c) => (
                <option key={c}>{c}</option>
              ))}
              <option value="__custom__">Outra categoria…</option>
            </select>
          </Field>
          <Field label="Tipo">
            <select
              value={type}
              disabled={Boolean(goal?.id)}
              onChange={(e) => setType(e.target.value as GoalType)}
            >
              <option value="individual">Individual</option>
              <option value="parallel" disabled={!profile?.coupleId}>
                Paralela
              </option>
              <option value="shared" disabled={!profile?.coupleId}>
                Compartilhada
              </option>
            </select>
          </Field>
          <Field label="Quantidade-alvo">
            <input
              required
              type="number"
              min="0.1"
              max="10000"
              step="0.1"
              value={target}
              onChange={(e) => setTarget(Number(e.target.value))}
            />
          </Field>
          <Field label="Periodicidade">
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as Frequency)}
            >
              <option value="daily">Diária</option>
              <option value="weekly">Semanal</option>
              <option value="monthly">Mensal</option>
            </select>
          </Field>
        </div>
        {category === "__custom__" && (
          <Field label="Nome da categoria">
            <input
              required
              maxLength={120}
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              placeholder="Ex.: Estudos, descanso, projetos pessoais"
            />
          </Field>
        )}
        <Field label="Duração estimada (minutos, opcional)">
          <input
            type="number"
            min="0"
            max="1440"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
          />
        </Field>
        <div className="info">
          {type === "parallel"
            ? "O mesmo objetivo, com registros e progresso individuais."
            : type === "shared"
              ? "Uma atividade conjunta, com um único registro para o casal."
              : "Esta meta e seus registros são privados."}
        </div>
        <button className="button full" disabled={busy}>
          {busy ? "Salvando…" : "Salvar meta"}
        </button>
      </form>
    </Modal>
  );
}
export function ActivityEditor({
  goal,
  close,
  ministry = false,
}: {
  goal?: Goal;
  close: () => void;
  ministry?: boolean;
}) {
  const { user, profile, couple, goals, run } = useData();
  const [goalId, setGoalId] = useState(goal?.id || "");
  const selected = goals.find((g) => g.id === goalId);
  const [date, setDate] = useState(today(profile?.timezone));
  const [amount, setAmount] = useState(1);
  const [duration, setDuration] = useState(goal?.duration || 0);
  const [notes, setNotes] = useState("");
  const [details, setDetails] = useState("");
  const [kind, setKind] = useState<Activity["kind"]>(
    ministry ? "ministry" : "activity",
  );
  const [title, setTitle] = useState("");
  const [together, setTogether] = useState(false);
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const shared = selected?.type === "shared";
    const ok = await run(
      () =>
        saveRecord<Activity>("activityLogs", {
          ownerId: user!.uid,
          coupleId: shared ? profile!.coupleId : null,
          goalId: kind === "ministry" ? "" : goalId,
          title: kind === "ministry" ? title : selected?.title || title,
          category:
            kind === "ministry" ? "Ministério" : selected?.category || "Outros",
          date,
          amount,
          duration,
          notes,
          details,
          kind,
          visibility: shared ? "couple" : "private",
          participants: shared
            ? couple!.memberIds
            : together && couple
              ? couple.memberIds
              : [user!.uid],
        }),
      "Atividade registrada. Cada passo conta!",
    );
    setBusy(false);
    if (ok) close();
  }
  return (
    <Modal
      title={ministry ? "Registrar ministério" : "Registrar atividade"}
      close={close}
    >
      <form onSubmit={submit}>
        {!ministry && (
          <>
            <Field label="Meta">
              <select
                required
                value={goalId}
                onChange={(e) => setGoalId(e.target.value)}
              >
                <option value="">Escolha uma meta</option>
                {goals
                  .filter((g) => !g.archived)
                  .map((g) => (
                    <option value={g.id} key={g.id}>
                      {g.title}
                    </option>
                  ))}
              </select>
            </Field>
            <Field label="Tipo de registro">
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value as Activity["kind"])}
              >
                <option value="activity">Atividade</option>
                <option value="study">Estudo profundo</option>
              </select>
            </Field>
          </>
        )}
        {ministry && (
          <Field label="Modalidade / atividade (sem dados de terceiros)">
            <input
              required
              maxLength={120}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex.: pregação, revisita, estudo bíblico"
            />
          </Field>
        )}
        <div className="form-grid">
          <Field label="Data realizada">
            <input
              required
              type="date"
              max={today(profile?.timezone)}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </Field>
          <Field label="Duração (minutos)">
            <input
              required
              type="number"
              min={ministry ? 1 : 0}
              max="1440"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
            />
          </Field>
        </div>
        {!ministry && (
          <Field label="Quantidade realizada">
            <input
              required
              type="number"
              min="0.1"
              max="10000"
              step="0.1"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
            />
          </Field>
        )}
        {kind === "study" && (
          <Field label="Assunto, textos bíblicos, materiais, aprendizados e aplicações">
            <textarea
              maxLength={10000}
              rows={5}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Organize aqui os pontos do seu estudo…"
            />
          </Field>
        )}
        {selected?.category === "Atividade física" && (
          <Field label="Modalidade">
            <input
              value={details}
              maxLength={10000}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Caminhada, musculação, bicicleta…"
            />
          </Field>
        )}
        <Field label="Observações (opcional)">
          <textarea
            rows={3}
            maxLength={5000}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </Field>
        {selected?.type === "parallel" && couple && (
          <label className="check-label">
            <input
              type="checkbox"
              checked={together}
              onChange={(e) => setTogether(e.target.checked)}
            />{" "}
            Fizemos juntos (cada pessoa registra seu próprio progresso)
          </label>
        )}
        <button className="button full" disabled={busy}>
          {busy ? "Registrando…" : "Concluir registro"}
          <Check size={18} />
        </button>
      </form>
    </Modal>
  );
}
export function GoalCard({
  goal,
  onEdit,
  onRecord,
}: {
  goal: Goal;
  onEdit: (g: Goal) => void;
  onRecord: (g: Goal) => void;
}) {
  const { user, logs, profile, run } = useData();
  const p = progress(goal, logs, user!.uid, today(profile?.timezone));
  const Icon = categoryIcons[categories.indexOf(goal.category)] || Sprout;
  const own = goal.ownerId === user!.uid;
  const update = (patch: Partial<Goal>) =>
    run(() => saveRecord<Goal>("goals", { ...goal, ...patch }, goal.id));
  return (
    <article className="goal-card">
      <div className="goal-top">
        <span
          className={`category-icon cat-${categories.indexOf(goal.category)}`}
        >
          <Icon size={21} />
        </span>
        <span className="badge">{typeLabels[goal.type]}</span>
        {own && (
          <button
            className={`icon-button favorite ${goal.favorite ? "active" : ""}`}
            aria-label={goal.favorite ? "Remover favorita" : "Favoritar meta"}
            onClick={() => update({ favorite: !goal.favorite })}
          >
            <Star size={17} fill={goal.favorite ? "currentColor" : "none"} />
          </button>
        )}
      </div>
      <small className="muted">{goal.category}</small>
      <h3>{goal.title}</h3>
      <p className="muted">
        {goal.target} {goal.target === 1 ? "vez" : "vezes"} por{" "}
        {frequencyLabels[goal.frequency]}{" "}
        {goal.duration > 0 && `· ${goal.duration} min`}
      </p>
      <div className="progress-label">
        <span>
          <b>{p.done}</b> de {goal.target} realizadas
        </span>
        <span>{p.percent}%</span>
      </div>
      <Progress value={p.percent} />
      <div className="goal-bottom">
        <span className="muted">
          {p.remaining === 0 ? "Meta alcançada!" : `Faltam ${p.remaining}`}
        </span>
        <button className="button small" onClick={() => onRecord(goal)}>
          <Plus size={15} /> Registrar
        </button>
      </div>
      {own && (
        <div className="goal-tools">
          <button onClick={() => onEdit(goal)}>
            <Pencil size={13} /> Editar
          </button>
          <button
            onClick={() =>
              run(
                () =>
                  saveRecord<Goal>("goals", {
                    ownerId: user!.uid,
                    coupleId: goal.coupleId,
                    title: goal.title + " (cópia)",
                    category: goal.category,
                    frequency: goal.frequency,
                    target: goal.target,
                    duration: goal.duration,
                    type: goal.type,
                    favorite: false,
                    archived: false,
                  }),
                "Meta duplicada.",
              )
            }
          >
            <Copy size={13} /> Duplicar
          </button>
          <button onClick={() => update({ archived: !goal.archived })}>
            <Archive size={13} /> {goal.archived ? "Restaurar" : "Arquivar"}
          </button>
        </div>
      )}
    </article>
  );
}
export function Goals() {
  const { goals, notes } = useData();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todas");
  const [filter, setFilter] = useState("active");
  const [edit, setEdit] = useState<Partial<Goal> | null>(null);
  const [record, setRecord] = useState<Goal | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const filtered = goals.filter(
    (g) =>
      g.title.toLowerCase().includes(search.toLowerCase()) &&
      (category === "Todas" || g.category === category) &&
      (filter === "archived" ? g.archived : !g.archived) &&
      (filter !== "favorites" || g.favorite),
  );
  return (
    <>
      <Heading
        eyebrow="PEQUENOS PASSOS, TODOS OS DIAS"
        title="Hábitos & metas"
        description="Crie qualquer hábito com nome, categoria e frequência diária, semanal ou mensal. Os modelos são opcionais."
        action={
          <button className="button" onClick={() => setEdit({})}>
            <Plus size={18} /> Criar hábito ou meta
          </button>
        }
      />
      <div className="toolbar">
        <div className="search">
          <Search size={18} />
          <input
            aria-label="Pesquisar metas"
            placeholder="Encontrar uma meta…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          aria-label="Filtrar categoria"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {[
            ...new Set([
              "Todas",
              ...categories,
              ...goals.map((g) => g.category),
              ...notes.filter((n) => n.kind === "category").map((n) => n.title),
            ]),
          ].map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select
          aria-label="Filtrar metas"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="active">Ativas</option>
          <option value="favorites">Favoritas</option>
          <option value="archived">Arquivadas</option>
        </select>
        <button
          className="button secondary"
          onClick={() => setShowTemplates(true)}
        >
          Explorar modelos
        </button>
      </div>
      {filtered.length ? (
        <div className="goal-grid">
          {filtered.map((g) => (
            <GoalCard
              key={g.id}
              goal={g}
              onEdit={setEdit}
              onRecord={setRecord}
            />
          ))}
        </div>
      ) : (
        <Empty
          title="Toda mudança começa com uma intenção."
          action={
            <button className="button" onClick={() => setShowTemplates(true)}>
              Escolher um hábito
            </button>
          }
        >
          Crie sua primeira meta ou escolha um modelo para personalizar.
        </Empty>
      )}
      {edit && <GoalEditor goal={edit} close={() => setEdit(null)} />}
      {record && <ActivityEditor goal={record} close={() => setRecord(null)} />}
      {showTemplates && (
        <Modal
          title="Inspiração para começar"
          close={() => setShowTemplates(false)}
        >
          <p className="muted">
            Modelos editáveis. Nenhum será adicionado automaticamente.
          </p>
          <div className="template-list">
            {templates.map((t) => (
              <button
                key={t.title}
                onClick={() => {
                  setEdit({ ...t });
                  setShowTemplates(false);
                }}
              >
                <span>
                  <b>{t.title}</b>
                  <small>
                    {t.category} · {t.target} / {frequencyLabels[t.frequency]}
                  </small>
                </span>
                <Plus size={18} />
              </button>
            ))}
          </div>
        </Modal>
      )}
    </>
  );
}

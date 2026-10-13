import { useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  Trash2,
  Repeat2,
} from "lucide-react";
import { useData } from "../lib/context";
import {
  removeRecord,
  saveRecord,
  saveSchedule,
  removeFutureSchedule,
} from "../lib/service";
import { categories, type Plan } from "../lib/types";
import { addDays, today } from "../lib/business";
import {
  futureOccurrences,
  recurrenceInfo,
  type RecurrenceFrequency,
} from "../lib/recurrence";
import { calendarDays, planParticipants, shiftMonth } from "../lib/calendar";
import { Empty, Field, Heading, Modal } from "../components/ui";

function PlanEditor({
  initial,
  date,
  ministry,
  close,
}: {
  initial?: Plan;
  date: string;
  ministry: boolean;
  close: () => void;
}) {
  const { user, profile, couple, run } = useData();
  const [title, setTitle] = useState(
    initial?.title || (ministry ? "Ministério" : ""),
  );
  const [day, setDay] = useState(initial?.date || date);
  const [time, setTime] = useState(initial?.time || "");
  const [endTime, setEndTime] = useState(initial?.endTime || "");
  const [category, setCategory] = useState(
    initial?.category || (ministry ? "Ministério" : "Outros"),
  );
  const [notes, setNotes] = useState(initial?.notes || "");
  const [shared, setShared] = useState(
    initial ? initial.visibility === "couple" : Boolean(couple),
  );
  const [participants, setParticipants] = useState(
    initial ? planParticipants(initial) : [user!.uid],
  );
  const [busy, setBusy] = useState(false);
  const [frequency, setFrequency] = useState<RecurrenceFrequency>("none");
  const [interval, setInterval] = useState(1);
  const [repeatUntil, setRepeatUntil] = useState(() => addDays(initial?.date || date, 90));
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    const ok = await run(() => {
      const value = {
        ownerId: user!.uid,
        coupleId: shared ? profile!.coupleId : null,
        title: title.trim(),
        date: day,
        time,
        endTime,
        category,
        notes,
        participants: shared ? participants : [user!.uid],
        visibility: shared ? ("couple" as const) : ("private" as const),
      };
      return initial
        ? saveRecord<Plan>("plans", value, initial.id)
        : saveSchedule(value, frequency, repeatUntil, interval);
    }, "Programação salva no calendário.");
    setBusy(false);
    if (ok) close();
  }
  return (
    <Modal
      title={
        initial
          ? "Editar programação"
          : ministry
            ? "Programar ministério"
            : "Agendar atividade"
      }
      close={close}
    >
      <form onSubmit={submit}>
        <Field label="Nome da atividade">
          <input
            autoFocus
            required
            maxLength={120}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex.: pregação, caminhada, conversa sobre finanças"
          />
        </Field>
        <Field label="Categoria">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="Dia">
          <input
            type="date"
            required
            value={day}
            onChange={(e) => setDay(e.target.value)}
          />
        </Field>
        <div className="form-grid">
          <Field label="Horário de início (opcional)">
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </Field>
          <Field label="Horário de término (opcional)">
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </Field>
        </div>
        {!initial && (
          <>
            <Field label="Repetir atividade">
              <select
                value={frequency}
                onChange={(e) =>
                  setFrequency(e.target.value as RecurrenceFrequency)
                }
              >
                <option value="none">Não repetir — atividade única</option>
                <option value="daily">Diariamente</option>
                <option value="weekly">Semanalmente</option>
                <option value="monthly">Mensalmente</option>
              </select>
            </Field>
            {frequency !== "none" && (
              <>
                <div className="form-grid">
                  <Field
                    label={`A cada quantos ${frequency === "daily" ? "dias" : frequency === "weekly" ? "semanas" : "meses"}?`}
                  >
                    <input
                      required
                      type="number"
                      min="1"
                      max="12"
                      value={interval}
                      onChange={(e) => setInterval(Number(e.target.value))}
                    />
                  </Field>
                  <Field label="Repetir até">
                    <input
                      required
                      type="date"
                      min={day}
                      max={day ? addDays(day, 365) : undefined}
                      value={repeatUntil}
                      onChange={(e) => setRepeatUntil(e.target.value)}
                    />
                  </Field>
                </div>
                <p className="muted">
                  A repetição começa no dia escolhido e termina na data
                  indicada.
                  {frequency === "monthly"
                    ? " Em meses menores, usamos o último dia do mês."
                    : ""}
                </p>
              </>
            )}
          </>
        )}
        {initial && recurrenceInfo(initial) && (
          <div className="info">
            Esta atividade faz parte de uma série recorrente. A edição altera
            apenas esta ocorrência.
          </div>
        )}
        <label className="check-label">
          <input
            type="checkbox"
            disabled={!couple}
            checked={shared}
            onChange={(e) => {
              setShared(e.target.checked);
              if (!e.target.checked) setParticipants([user!.uid]);
            }}
          />{" "}
          Visível para o casal
        </label>
        {shared && couple && (
          <fieldset className="participant-field">
            <legend>Quem vai participar?</legend>
            {couple.memberIds.map((uid) => (
              <label className="check-label" key={uid}>
                <input
                  type="checkbox"
                  checked={participants.includes(uid)}
                  onChange={(e) =>
                    setParticipants((current) =>
                      e.target.checked
                        ? [...current, uid]
                        : current.filter((id) => id !== uid),
                    )
                  }
                />
                {couple.names[uid]}
                {uid === user!.uid ? " (você)" : ""}
              </label>
            ))}
          </fieldset>
        )}
        <Field label="Observações">
          <textarea
            maxLength={5000}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </Field>
        <p className="muted">
          Programar não registra horas ou conclui metas. Registre a atividade
          depois que ela acontecer.
        </p>
        <button className="button full" disabled={busy}>
          {busy ? "Salvando…" : "Salvar programação"}
        </button>
      </form>
    </Modal>
  );
}

export function Calendar({
  ministryOnly = false,
  embedded = false,
}: {
  ministryOnly?: boolean;
  embedded?: boolean;
}) {
  const { user, profile, couple, plans, run } = useData();
  const current = today(profile?.timezone);
  const [month, setMonth] = useState(current.slice(0, 7));
  const [selected, setSelected] = useState(current);
  const [participant, setParticipant] = useState("all");
  const [category, setCategory] = useState("Todas");
  const [edit, setEdit] = useState<Plan | true | null>(null);
  const [deleting, setDeleting] = useState<Plan | null>(null);
  const [deletingBusy, setDeletingBusy] = useState(false);
  const events = plans.filter(
    (p) =>
      (!ministryOnly || p.category === "Ministério") &&
      (category === "Todas" || p.category === category) &&
      (participant === "all" || planParticipants(p).includes(participant)),
  );
  const selectedEvents = events
    .filter((p) => p.date === selected)
    .sort((a, b) => a.time.localeCompare(b.time));
  const label = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${month}-01T12:00:00Z`));
  const open = () => setEdit(true);
  return (
    <section className="calendar-section">
      {embedded ? (
        <div className="section-heading">
          <div>
            <h2>Programação de ministério</h2>
            <p>Dias e horários de vocês, no calendário compartilhado.</p>
          </div>
          <button className="button small" onClick={open}>
            <Plus size={16} /> Programar
          </button>
        </div>
      ) : (
        <Heading
          eyebrow="ESCOLHAM O DIA, PRESERVEM O RITMO"
          title="Calendário & planejamento"
          description="Visualize a sua programação e a do seu par. Os agendamentos são opcionais."
          action={
            <button className="button" onClick={open}>
              <Plus size={18} /> Agendar atividade
            </button>
          }
        />
      )}
      <div className="toolbar">
        <div className="calendar-month">
          <button
            className="icon-button"
            aria-label="Mês anterior"
            onClick={() => setMonth(shiftMonth(month, -1))}
          >
            <ChevronLeft size={20} />
          </button>
          <b>{label}</b>
          <button
            className="icon-button"
            aria-label="Próximo mês"
            onClick={() => setMonth(shiftMonth(month, 1))}
          >
            <ChevronRight size={20} />
          </button>
        </div>
        <button
          className="button secondary small"
          onClick={() => {
            setMonth(current.slice(0, 7));
            setSelected(current);
          }}
        >
          Hoje
        </button>
        <select
          aria-label="Filtrar participante do calendário"
          value={participant}
          onChange={(e) => setParticipant(e.target.value)}
        >
          <option value="all">Todo o casal</option>
          <option value={user!.uid}>Minha programação</option>
          {couple?.memberIds
            .filter((uid) => uid !== user!.uid)
            .map((uid) => (
              <option value={uid} key={uid}>
                {couple.names[uid]}
              </option>
            ))}
        </select>
        {!ministryOnly && (
          <select
            aria-label="Filtrar categoria do calendário"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {["Todas", ...categories].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        )}
      </div>
      <div className="calendar-layout">
        <article className="panel calendar-panel">
          <div className="calendar-grid calendar-weekdays">
            {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
          <div className="calendar-grid">
            {calendarDays(month).map((day) => {
              const items = events.filter((p) => p.date === day);
              return (
                <button
                  key={day}
                  aria-label={`${day.split("-").reverse().join("/")}, ${items.length} atividades`}
                  aria-pressed={selected === day}
                  className={`calendar-day ${day.slice(0, 7) !== month ? "outside" : ""} ${selected === day ? "selected" : ""} ${day === current ? "today" : ""}`}
                  onClick={() => setSelected(day)}
                >
                  <span>{Number(day.slice(-2))}</span>
                  {items.slice(0, 2).map((p) => (
                    <small
                      className={
                        p.visibility === "couple"
                          ? "shared-event"
                          : "personal-event"
                      }
                      key={p.id}
                    >
                      {p.time && `${p.time} `}
                      {p.title}
                    </small>
                  ))}
                  {items.length > 2 && (
                    <small>+{items.length - 2} atividades</small>
                  )}
                </button>
              );
            })}
          </div>
          <div className="calendar-legend">
            <span>● Pessoal</span>
            <span>● Compartilhado com o casal</span>
          </div>
        </article>
        <article className="panel calendar-agenda">
          <div className="section-heading">
            <h2>
              {new Intl.DateTimeFormat("pt-BR", {
                day: "numeric",
                month: "long",
                timeZone: "UTC",
              }).format(new Date(`${selected}T12:00:00Z`))}
            </h2>
            <button
              className="icon-button"
              aria-label="Agendar para o dia selecionado"
              onClick={open}
            >
              <Plus size={20} />
            </button>
          </div>
          {selectedEvents.length ? (
            selectedEvents.map((p) => (
              <div className="calendar-entry" key={p.id}>
                <span className="badge">{p.category || "Outros"}</span>
                <h3>{p.title}</h3>
                {recurrenceInfo(p) && (
                  <span className="badge recurring-badge">
                    <Repeat2 size={12} /> Recorrente
                  </span>
                )}
                <b>
                  {p.time
                    ? `${p.time}${p.endTime ? ` – ${p.endTime}` : ""}`
                    : "Horário livre"}
                </b>
                <p>
                  {planParticipants(p)
                    .map(
                      (uid) =>
                        couple?.names[uid] ||
                        (uid === user!.uid ? profile!.name : "Participante"),
                    )
                    .join(" & ")}
                </p>
                <small className="muted">
                  {p.visibility === "couple"
                    ? "Visível para o casal"
                    : "Somente você"}
                </small>
                {p.notes && <p className="note-text">{p.notes}</p>}
                {p.ownerId === user!.uid && (
                  <div className="inline-actions">
                    <button
                      className="button secondary small"
                      onClick={() => setEdit(p)}
                    >
                      <Pencil size={14} /> Editar
                    </button>
                    <button
                      className="icon-button danger"
                      aria-label={`Excluir ${p.title}`}
                      onClick={() =>
                        recurrenceInfo(p)
                          ? setDeleting(p)
                          : run(
                              () => removeRecord("plans", p.id),
                              "Programação removida.",
                            )
                      }
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                )}
              </div>
            ))
          ) : (
            <Empty
              title="Um dia com espaço livre"
              action={
                <button className="button secondary small" onClick={open}>
                  Programar neste dia
                </button>
              }
            >
              Adicione uma atividade quando fizer sentido.
            </Empty>
          )}
        </article>
      </div>
      {!couple && (
        <div className="info">
          <CalendarDays size={18} /> Para ver a programação do seu par, vincule
          as contas em Perfil. Sua agenda pessoal já pode ser usada.
        </div>
      )}
      {edit && (
        <PlanEditor
          key={typeof edit === "object" ? edit.id : selected}
          initial={typeof edit === "object" ? edit : undefined}
          date={selected}
          ministry={ministryOnly}
          close={() => setEdit(null)}
        />
      )}
      {deleting && (
        <Modal
          title="Excluir atividade recorrente"
          close={() => setDeleting(null)}
        >
          <p>
            Escolha se deseja remover somente este dia ou também as próximas
            ocorrências de “{deleting.title}”.
          </p>
          <div className="recurrence-actions">
            <button
              className="button secondary"
              disabled={deletingBusy}
              onClick={async () => {
                setDeletingBusy(true);
                if (
                  await run(
                    () => removeRecord("plans", deleting.id),
                    "Ocorrência removida.",
                  )
                )
                  setDeleting(null);
                setDeletingBusy(false);
              }}
            >
              Somente esta ocorrência
            </button>
            <button
              className="button"
              disabled={deletingBusy}
              onClick={async () => {
                setDeletingBusy(true);
                if (
                  await run(
                    () => removeFutureSchedule(deleting, plans),
                    "Esta ocorrência e as próximas foram removidas.",
                  )
                )
                  setDeleting(null);
                setDeletingBusy(false);
              }}
            >
              Esta e as próximas ({futureOccurrences(deleting, plans).length})
            </button>
          </div>
        </Modal>
      )}
    </section>
  );
}

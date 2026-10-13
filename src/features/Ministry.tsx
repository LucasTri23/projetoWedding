import { useState } from "react";
import { Plus, Settings2 } from "lucide-react";
import { useData } from "../lib/context";
import { ministrySummary, today } from "../lib/business";
import { saveProfile } from "../lib/service";
import { Field, Heading, Modal, Progress } from "../components/ui";
import { ActivityEditor } from "./Goals";
import { Calendar } from "./Calendar";
export function Ministry() {
  const { user, profile, logs, run } = useData();
  const [record, setRecord] = useState(false);
  const [settings, setSettings] = useState(false);
  const [mode, setMode] = useState(profile?.ministryMode || "Publicador");
  const [target, setTarget] = useState(profile?.ministryTarget || 0);
  const [annual, setAnnual] = useState(profile?.annualTarget || 0);
  const [month, setMonth] = useState(today(profile?.timezone).slice(0, 7));
  const date =
    month === today(profile?.timezone).slice(0, 7)
      ? today(profile?.timezone)
      : `${month}-01`;
  const summary = ministrySummary(
    logs,
    user!.uid,
    date,
    profile?.ministryTarget || 0,
  );
  const own = logs.filter(
    (l) =>
      l.ownerId === user!.uid &&
      l.kind === "ministry" &&
      l.date.startsWith(month),
  );
  const year = logs
    .filter(
      (l) =>
        l.ownerId === user!.uid &&
        l.kind === "ministry" &&
        l.date.startsWith(month.slice(0, 4)),
    )
    .reduce((s, l) => s + l.duration / 60, 0);
  return (
    <>
      <Heading
        eyebrow="SERVIR COM PROPÓSITO"
        title="Meu ministério"
        description="Planeje com flexibilidade. Acompanhe seu progresso individual."
        action={
          <button className="button" onClick={() => setRecord(true)}>
            <Plus size={18} /> Registrar tempo
          </button>
        }
      />
      <div className="toolbar">
        <input
          type="month"
          aria-label="Mês do ministério"
          value={month}
          onChange={(e) => {
            if (e.target.value) setMonth(e.target.value);
          }}
        />
        <span className="badge">{profile?.ministryMode}</span>
        <button className="button secondary" onClick={() => setSettings(true)}>
          <Settings2 size={16} /> Ajustar minhas metas
        </button>
      </div>
      <div className="stats-grid">
        <article className="stat">
          <p>Horas no mês</p>
          <strong>
            {summary.hours.toFixed(1)}
            <small> h</small>
          </strong>
          <span className="muted">Seus registros, sem somar os do seu par</span>
        </article>
        <article className="stat">
          <p>Restante para sua meta</p>
          <strong>
            {summary.remaining.toFixed(1)}
            <small> h</small>
          </strong>
          <span className="muted">
            Meta: {profile?.ministryTarget || 0} horas
          </span>
        </article>
        <article className="stat">
          <p>Projeção no ritmo atual</p>
          <strong>
            {month === today(profile?.timezone).slice(0, 7)
              ? summary.projection.toFixed(1)
              : "—"}
            <small> h</small>
          </strong>
          <span className="muted">Estimativa, sem cobranças</span>
        </article>
      </div>
      <article className="panel">
        <h2>Seu caminho neste mês</h2>
        <Progress
          value={
            profile?.ministryTarget
              ? Math.min(100, (summary.hours / profile.ministryTarget) * 100)
              : 0
          }
        />
        <p className="muted">
          {profile?.annualTarget
            ? `Ano civil: ${year.toFixed(1)} de ${profile.annualTarget} horas.`
            : "Configure uma meta anual opcional, se desejar."}
        </p>
      </article>
      <Calendar ministryOnly embedded />
      <article className="panel">
        <h2>Histórico do mês</h2>
        {own.length ? (
          own
            .sort((a, b) => b.date.localeCompare(a.date))
            .map((l) => (
              <div className="list-row" key={l.id}>
                <div>
                  <b>{l.title}</b>
                  <p>
                    {l.date.split("-").reverse().join("/")} · {l.duration}{" "}
                    minutos
                  </p>
                  <p>{l.notes}</p>
                </div>
              </div>
            ))
        ) : (
          <p className="muted">
            Ainda não há registros neste mês. Cada participação tem valor.
          </p>
        )}
      </article>
      <div className="info">
        Organize revisitas e estudos usando apenas lembretes genéricos. Não
        registre nomes, contatos, endereços ou dados sensíveis de terceiros.
      </div>
      {record && <ActivityEditor ministry close={() => setRecord(false)} />}
      {settings && (
        <Modal title="Metas ministeriais" close={() => setSettings(false)}>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (
                await run(
                  () =>
                    saveProfile(user!.uid, {
                      ministryMode: mode,
                      ministryTarget: target,
                      annualTarget: annual,
                    }),
                  "Metas atualizadas.",
                )
              )
                setSettings(false);
            }}
          >
            <Field label="Modalidade">
              <select value={mode} onChange={(e) => setMode(e.target.value)}>
                {[
                  "Publicador",
                  "Pioneiro regular",
                  "Pioneiro auxiliar",
                  "Meta personalizada",
                ].map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </Field>
            <Field label="Meta mensal em horas">
              <input
                required
                type="number"
                min="0"
                max="744"
                step="0.5"
                value={target}
                onChange={(e) => setTarget(Number(e.target.value))}
              />
            </Field>
            <Field label="Meta anual em horas (ano civil, opcional)">
              <input
                required
                type="number"
                min="0"
                max="8760"
                value={annual}
                onChange={(e) => setAnnual(Number(e.target.value))}
              />
            </Field>
            <p className="muted">
              As metas são definidas por você conforme as orientações atuais
              aplicáveis. Nenhuma modalidade impõe uma quantidade fixa.
            </p>
            <button className="button full">Salvar metas</button>
          </form>
        </Modal>
      )}
    </>
  );
}

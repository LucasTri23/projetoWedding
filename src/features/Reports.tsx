import { useState } from "react";
import { Download, Printer, Trash2 } from "lucide-react";
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { useData } from "../lib/context";
import { categories } from "../lib/types";
import { addDays, period, progress, today } from "../lib/business";
import { removeRecord } from "../lib/service";
import { Field, Heading } from "../components/ui";
export function Reports() {
  const { user, profile, couple, goals, logs, plans, notes, run } = useData();
  const date = today(profile?.timezone);
  const [start, setStart] = useState(period(date, "monthly")[0]);
  const [end, setEnd] = useState(date);
  const [category, setCategory] = useState("Todas");
  const [person, setPerson] = useState("all");
  const [scale, setScale] = useState<"weekly" | "monthly">("weekly");
  const filtered = logs.filter(
    (l) =>
      l.date >= start &&
      l.date <= end &&
      (category === "Todas" || l.category === category) &&
      (person === "all" || l.ownerId === person),
  );
  const ownGoals = goals.filter(
    (g) =>
      !g.archived &&
      (category === "Todas" || g.category === category) &&
      (person === "all" || person === user!.uid || g.type === "shared"),
  );
  const rate = ownGoals.length
    ? Math.round(
        ownGoals.reduce(
          (s, g) =>
            s +
            progress(g, logs, person === "all" ? user!.uid : person, end)
              .percent,
          0,
        ) / ownGoals.length,
      )
    : 0;
  const points = Array.from({ length: scale === "weekly" ? 8 : 6 }, (_, i) => {
    const d =
      scale === "weekly"
        ? addDays(end, -(7 * (7 - i)))
        : new Date(
            Date.UTC(
              Number(end.slice(0, 4)),
              Number(end.slice(5, 7)) - 1 - (5 - i),
              15,
            ),
          )
            .toISOString()
            .slice(0, 10);
    const [a, b] = period(d, scale);
    return {
      period:
        scale === "weekly" ? `${a.slice(8)}/${a.slice(5, 7)}` : a.slice(0, 7),
      registros: logs.filter(
        (l) =>
          l.date >= a &&
          l.date <= b &&
          (category === "Todas" || l.category === category) &&
          (person === "all" || l.ownerId === person),
      ).length,
    };
  });
  function exportJson() {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            exportedAt: new Date().toISOString(),
            profile,
            goals,
            logs,
            plans,
            notes,
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cultiva-${date}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <>
      <Heading
        eyebrow="PERCEBER, APRENDER, AJUSTAR"
        title="Nossa evolução"
        description="Compare seu caminho com os seus próprios passos anteriores."
        action={
          <div className="inline-actions">
            <button className="button secondary" onClick={exportJson}>
              <Download size={16} /> JSON
            </button>
            <button className="button secondary" onClick={() => window.print()}>
              <Printer size={16} /> Salvar PDF
            </button>
          </div>
        }
      />
      <div className="report-filters panel">
        <Field label="De">
          <input
            type="date"
            value={start}
            max={end}
            onChange={(e) => {
              if (e.target.value) setStart(e.target.value);
            }}
          />
        </Field>
        <Field label="Até">
          <input
            type="date"
            value={end}
            min={start}
            onChange={(e) => {
              if (e.target.value) setEnd(e.target.value);
            }}
          />
        </Field>
        <Field label="Categoria">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {["Todas", ...categories].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="Participante">
          <select value={person} onChange={(e) => setPerson(e.target.value)}>
            <option value="all">Todos os registros disponíveis</option>
            <option value={user!.uid}>Meus registros</option>
            {couple?.memberIds
              .filter((id) => id !== user!.uid)
              .map((id) => (
                <option key={id} value={id}>
                  {couple.names[id]} (compartilhados)
                </option>
              ))}
          </select>
        </Field>
      </div>
      <div className="stats-grid">
        <article className="stat">
          <p>Atividades no período</p>
          <strong>{filtered.length}</strong>
        </article>
        <article className="stat">
          <p>Progresso das metas</p>
          <strong>
            {rate}
            <small>%</small>
          </strong>
          <span className="muted">Período de cada meta na data final</span>
        </article>
        <article className="stat">
          <p>Tempo dedicado</p>
          <strong>
            {(filtered.reduce((s, l) => s + l.duration, 0) / 60).toFixed(1)}
            <small> h</small>
          </strong>
        </article>
      </div>
      <article className="panel">
        <div className="section-heading">
          <h2>Seu caminho ao longo do tempo</h2>
          <select
            aria-label="Escala do gráfico"
            value={scale}
            onChange={(e) => setScale(e.target.value as "weekly" | "monthly")}
          >
            <option value="weekly">Semanas</option>
            <option value="monthly">Meses</option>
          </select>
        </div>
        <p className="muted">
          {scale === "weekly" ? "Últimas 8 semanas" : "Últimos 6 meses"} até a
          data final selecionada
        </p>
        <div className="chart tall">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={points}>
              <XAxis
                dataKey="period"
                axisLine={false}
                tickLine={false}
                fontSize={12}
              />
              <YAxis
                allowDecimals={false}
                axisLine={false}
                tickLine={false}
                width={30}
                fontSize={12}
              />
              <Tooltip />
              <Bar dataKey="registros" fill="#7f9d83" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </article>
      <article className="panel">
        <h2>Histórico de atividades</h2>
        <p className="muted">
          Registros pessoais do seu par permanecem privados.
        </p>
        {filtered.length ? (
          filtered
            .sort((a, b) => b.date.localeCompare(a.date))
            .map((l) => (
              <div className="list-row" key={l.id}>
                <div className="grow">
                  <b>{l.title}</b>
                  <p>
                    {l.date.split("-").reverse().join("/")} · {l.category} ·{" "}
                    {l.amount} realização(ões) · {l.duration} min
                  </p>
                  {l.details && <p className="note-text">{l.details}</p>}
                  {l.notes && <p className="note-text">{l.notes}</p>}
                </div>
                {l.ownerId === user!.uid && (
                  <button
                    className="icon-button danger"
                    aria-label={`Excluir registro de ${l.title}`}
                    onClick={() =>
                      run(
                        () => removeRecord("activityLogs", l.id),
                        "Registro removido.",
                      )
                    }
                  >
                    <Trash2 size={17} />
                  </button>
                )}
              </div>
            ))
        ) : (
          <p className="muted">Ainda não há atividades neste período.</p>
        )}
      </article>
      <div className="info">
        <b>Uma pausa para refletir</b>
        <p>
          O que conseguimos melhorar? Qual hábito foi mais difícil? O que
          aprendemos? O que queremos ajustar no próximo mês?
        </p>
        <a href="#/caderno" className="text-link">
          Guardar nossa revisão no caderno →
        </a>
      </div>
    </>
  );
}

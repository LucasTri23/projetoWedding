import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  ArrowRight,
  CheckCheck,
  CircleDashed,
  Leaf,
  Plus,
  Heart,
  BookOpen,
} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip } from "recharts";
import { useData } from "../lib/context";
import { addDays, period, progress, streak, today } from "../lib/business";
import { Empty, Heading, Progress } from "../components/ui";
import { ActivityEditor, GoalCard } from "./Goals";
import type { Goal } from "../lib/types";
import { IndividualSummaries } from "./Summaries";
export function Dashboard() {
  const { user, profile, couple, goals, logs, plans } = useData();
  const [record, setRecord] = useState<Goal | null>(null);
  const date = today(profile?.timezone);
  const active = goals.filter((g) => !g.archived);
  const weekly = active.filter((g) => g.frequency === "weekly");
  const complete = weekly.filter(
    (g) => progress(g, logs, user!.uid, date).percent === 100,
  ).length;
  const rate = weekly.length
    ? Math.round(
        weekly.reduce(
          (s, g) => s + progress(g, logs, user!.uid, date).percent,
          0,
        ) / weekly.length,
      )
    : 0;
  const prev = weekly.length
    ? Math.round(
        weekly.reduce(
          (s, g) => s + progress(g, logs, user!.uid, addDays(date, -7)).percent,
          0,
        ) / weekly.length,
      )
    : 0;
  const [start, end] = period(date, "weekly");
  const chart = Array.from({ length: 7 }, (_, i) => {
    const day = addDays(start, i);
    return {
      day: new Intl.DateTimeFormat("pt-BR", {
        weekday: "short",
        timeZone: "UTC",
      })
        .format(new Date(`${day}T12:00:00Z`))
        .replace(".", ""),
      registros: logs.filter((l) => l.date === day).length,
    };
  });
  const featured = [...active]
    .sort((a, b) => Number(b.favorite) - Number(a.favorite))
    .slice(0, 3);
  const next = plans
    .filter((p) => p.date >= date)
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
    .slice(0, 3);
  const bible = active.find(
    (g) => g.title.toLowerCase().includes("bíblia") && g.frequency === "daily",
  );
  return (
    <>
      <Heading
        eyebrow={new Intl.DateTimeFormat("pt-BR", {
          dateStyle: "full",
          timeZone: profile?.timezone,
        }).format(new Date())}
        title={`Olá, ${profile?.name.split(" ")[0] || "você"}.`}
        description="Vamos cultivar o que faz bem, um passo de cada vez."
        action={
          <Link className="button secondary" to="/habitos">
            Ver minhas metas <ArrowUpRight size={17} />
          </Link>
        }
      />
      <section className="welcome-banner">
        <div>
          <span className="eyebrow">O NOSSO CAMINHO</span>
          <h2>
            Juntos, a vida encontra
            <br />
            mais equilíbrio.
          </h2>
          <p>Não precisa ser perfeito. Precisa fazer sentido para vocês.</p>
          <Link to="/planejamento">
            Dar espaço às nossas intenções <ArrowRight size={16} />
          </Link>
        </div>
        <div className="botanical" aria-hidden="true">
          <Leaf />
          <Leaf />
          <span />
          <Heart />
        </div>
      </section>
      <div className="section-heading">
        <h2>Esta semana</h2>
        <span>
          {new Date(`${start}T12:00:00`).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "short",
          })}{" "}
          —{" "}
          {new Date(`${end}T12:00:00`).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "short",
          })}
        </span>
      </div>
      <section className="stats-grid">
        <article className="stat">
          <span className="stat-icon">
            <CheckCheck size={20} />
          </span>
          <p>Metas semanais alcançadas</p>
          <strong>
            {complete}
            <small> / {weekly.length}</small>
          </strong>
          <span className="muted">Pequenas conquistas que somam</span>
        </article>
        <article className="stat">
          <span className="stat-icon blue">
            <CircleDashed size={20} />
          </span>
          <p>Metas em andamento</p>
          <strong>{weekly.length - complete}</strong>
          <span className="muted">No seu tempo, no seu ritmo</span>
        </article>
        <article className="stat">
          <span className="stat-icon gold">
            <Leaf size={20} />
          </span>
          <p>Progresso semanal</p>
          <strong>
            {rate}
            <small>%</small>
          </strong>
          <span className="muted">
            {rate - prev >= 0 ? "+" : ""}
            {rate - prev} p.p. em relação à semana anterior
          </span>
        </article>
      </section>
      <div className="section-heading">
        <div>
          <h2>Intenções em movimento</h2>
          <p>Os dias são flexíveis. O propósito permanece.</p>
        </div>
        <Link to="/habitos">
          Todas as metas <ArrowRight size={16} />
        </Link>
      </div>
      {featured.length ? (
        <div className="goal-grid">
          {featured.map((g) => (
            <GoalCard
              key={g.id}
              goal={g}
              onEdit={() => {
                location.hash = "/habitos";
              }}
              onRecord={setRecord}
            />
          ))}
        </div>
      ) : (
        <Empty
          title="Seu próximo passo começa aqui"
          action={
            <Link className="button" to="/habitos">
              <Plus size={16} /> Criar minha primeira meta
            </Link>
          }
        >
          Escolha metas pessoais ou convide seu par para cultivar hábitos em
          conjunto.
        </Empty>
      )}
      <IndividualSummaries />
      <section className="dashboard-bottom">
        <article className="panel">
          <div className="section-heading">
            <div>
              <h2>Constância, sem pressa</h2>
              <p>Atividades registradas nesta semana</p>
            </div>
            <span className="badge">7 dias</span>
          </div>
          <div className="chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chart}>
                <defs>
                  <linearGradient id="sage" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#88a58a" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#88a58a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#7c847d" }}
                />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="registros"
                  stroke="#6c8e71"
                  fill="url(#sage)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>
        <article className="panel">
          <div className="section-heading">
            <h2>Espaço para nós</h2>
            <Heart size={19} />
          </div>
          <p className="muted">
            {couple
              ? Object.values(couple.names).join(" & ")
              : "Um caminho que também pode ser compartilhado."}
          </p>
          <div className="mini-row">
            <BookOpen size={20} />
            <div>
              <b>Leitura da Bíblia</b>
              <p>
                {bible
                  ? `${streak(logs, bible.id, user!.uid, date)} dias de constância`
                  : "Crie sua intenção de leitura diária"}
              </p>
            </div>
          </div>
          <div className="mini-row">
            <Heart size={20} />
            <div>
              <b>Metas compartilhadas</b>
              <p>
                {
                  active.filter(
                    (g) =>
                      g.type === "shared" &&
                      progress(g, logs, user!.uid, date).percent === 100,
                  ).length
                }{" "}
                alcançadas no período
              </p>
            </div>
          </div>
          <Progress
            value={
              active.filter((g) => g.type === "shared").length
                ? active
                    .filter((g) => g.type === "shared")
                    .reduce(
                      (s, g) => s + progress(g, logs, user!.uid, date).percent,
                      0,
                    ) / active.filter((g) => g.type === "shared").length
                : 0
            }
          />
          <Link className="text-link" to="/perfil">
            {couple ? "Cuidar do nosso espaço" : "Convidar meu par"}{" "}
            <ArrowRight size={15} />
          </Link>
        </article>
      </section>
      <article className="panel">
        <div className="section-heading">
          <h2>No horizonte</h2>
          <Link to="/planejamento">
            Planejamento <ArrowRight size={15} />
          </Link>
        </div>
        {next.length ? (
          next.map((p) => (
            <div className="list-row" key={p.id}>
              <span className="date-chip">{p.date.slice(-2)}</span>
              <div>
                <b>{p.title}</b>
                <p>
                  {p.date.split("-").reverse().join("/")}{" "}
                  {p.time && `· ${p.time}`}
                </p>
              </div>
            </div>
          ))
        ) : (
          <p className="muted">
            Sua agenda está livre. Agende quando fizer sentido; suas metas
            continuam disponíveis.
          </p>
        )}
      </article>
      {record && <ActivityEditor goal={record} close={() => setRecord(null)} />}
    </>
  );
}

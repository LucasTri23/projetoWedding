import { Link } from "react-router-dom";
import { CalendarDays, Heart, HeartHandshake, Activity, ArrowRight } from "lucide-react";
import { useData } from "../lib/context";
import { addDays, today } from "../lib/business";
import { expandPlans } from "../lib/calendar";
import { Heading } from "../components/ui";

export function Home() {
  const { profile, plans, couple } = useData();
  const date = today(profile?.timezone);
  const days = Array.from({ length: 7 }, (_, i) => addDays(date, i));
  const upcoming = expandPlans(plans, days).filter((p) => p.date >= date && p.date <= days[6]).sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  const shortcuts = [
    { to: "/planejamento", title: "Programação de campo", text: "Modalidades e horas, no ritmo da sua semana.", icon: HeartHandshake },
    { to: "/calendario", title: "Calendário do casal", text: "Uma agenda para organizar o que vem pela frente.", icon: CalendarDays },
    { to: "/adoracao", title: "Adoração em família", text: "Escolham um tema e reservem um momento juntos.", icon: Heart },
    { to: "/saude", title: "Saúde e bem-estar", text: "Exercício, descanso e tempo para se cuidar.", icon: Activity },
  ];
  return <><Heading eyebrow="NOSSO PLANNER" title={`Olá, ${profile!.name.split(" ")[0]}.`} description="Uma semana com espaço para a fé, para a saúde e para vocês." action={<Link className="button" to="/calendario">Abrir calendário <ArrowRight size={17} /></Link>} />
    <section className="welcome-banner"><div><span className="eyebrow">PLANEJAR JUNTOS</span><h2>O que merece espaço<br />na nossa semana?</h2><p>Organizem a rotina, combinem os compromissos e ajustem os planos quando precisarem.</p><Link to="/planejamento">Montar nossa programação <ArrowRight size={16} /></Link></div></section>
    <div className="planner-shortcuts">{shortcuts.map(({ icon: Icon, ...item }) => <Link className="panel planner-shortcut" to={item.to} key={item.to}><Icon size={25} /><h3>{item.title}</h3><p>{item.text}</p><span className="text-link">Planejar <ArrowRight size={15} /></span></Link>)}</div>
    <article className="panel study-history"><div className="section-heading"><h2>Próximos 7 dias</h2><span className="badge">{upcoming.length} atividades</span></div>{upcoming.length ? upcoming.map((p) => <div className="list-row" key={`${p.id}-${p.date}`}><span className="date-chip">{p.date.slice(-2)}</span><div><b>{p.title}</b><p>{new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${p.date}T12:00:00Z`))} · {p.time || "Horário livre"}{p.duration ? ` · ${p.duration / 60} h` : ""}</p><small className="muted">{(p.participants || [p.ownerId]).map((id) => couple?.names[id] || profile!.name).join(" e ")}</small></div></div>) : <p className="muted">Sua semana está começando. Adicione uma rotina de campo, um exercício ou um compromisso no calendário.</p>}</article>
    {!couple && <div className="info">Querem planejar juntos? <Link className="text-link" to="/perfil">Vincule as contas no perfil →</Link></div>}
  </>;
}

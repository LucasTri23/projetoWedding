import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useData } from "../lib/context";
import { saveRecord, removeRecord } from "../lib/service";
import { weekdays } from "../lib/calendar";
import type { Plan } from "../lib/types";
import { Field, Heading, Modal } from "../components/ui";

export function RoutineEditor({ category, initial, day = 0, close }: { category: string; initial?: Plan; day?: number; close: () => void }) {
  const { user, profile, couple, run } = useData();
  const choices = category === "Ministério" ? ["Casa em casa", "Testemunho público", "Testemunho informal", "Revisitas", "Estudo bíblico", "Cartas e telefone"] : category === "Saúde" ? ["Caminhada", "Musculação", "Alongamento", "Bicicleta", "Descanso", "Cuidado com a saúde"] : ["Leitura e pesquisa bíblica", "Preparar a reunião", "Ensaiar apresentações", "Vídeo e conversa", "Estudo de um tema"];
  const [title, setTitle] = useState(initial?.title || choices[0]);
  const [weekday, setWeekday] = useState(initial?.weekday ?? day);
  const [duration, setDuration] = useState(initial?.duration ?? 60);
  const [time, setTime] = useState(initial?.time || "");
  const [notes, setNotes] = useState(initial?.notes || "");
  const [shared, setShared] = useState(initial ? initial.visibility === "couple" : Boolean(couple));
  const [participants, setParticipants] = useState(initial?.participants || [user!.uid]);
  const [busy, setBusy] = useState(false);
  return <Modal title={initial ? "Editar rotina semanal" : "Adicionar à rotina semanal"} close={close}>
    <form onSubmit={async (e) => {
      e.preventDefault(); setBusy(true);
      const ok = await run(() => saveRecord<Plan>("plans", {
        ownerId: user!.uid, coupleId: shared ? profile!.coupleId : null,
        title: title.trim(), category, weekday, duration, date: "", time, endTime: "", notes,
        visibility: shared ? "couple" : "private", participants: shared ? participants : [user!.uid],
      }, initial?.id), "Rotina salva e integrada ao calendário.");
      setBusy(false); if (ok) close();
    }}>
      <Field label="Dia da semana"><select value={weekday} onChange={(e) => setWeekday(Number(e.target.value))}>{weekdays.map((d, i) => <option key={d} value={i}>{d}</option>)}</select></Field>
      <Field label={category === "Ministério" ? "Modalidade" : "Atividade ou tema"}><input required maxLength={120} list="routine-choices" value={title} onChange={(e) => setTitle(e.target.value)} /><datalist id="routine-choices">{choices.map((c) => <option key={c} value={c} />)}</datalist></Field>
      <div className="form-grid"><Field label="Horas planejadas"><input required type="number" min="0.25" max="24" step="0.25" value={duration / 60} onChange={(e) => setDuration(Number(e.target.value) * 60)} /></Field><Field label="Início (opcional)"><input type="time" value={time} onChange={(e) => setTime(e.target.value)} /></Field></div>
      <label className="check-label"><input type="checkbox" disabled={!couple} checked={shared} onChange={(e) => setShared(e.target.checked)} /> Visível para o casal</label>
      {shared && couple && <fieldset className="participant-field"><legend>Quem participa?</legend>{couple.memberIds.map((uid) => <label className="check-label" key={uid}><input type="checkbox" checked={participants.includes(uid)} onChange={(e) => setParticipants((p) => e.target.checked ? [...p, uid] : p.filter((id) => id !== uid))} />{couple.names[uid]}</label>)}</fieldset>}
      <Field label="Local, preparo e observações"><textarea maxLength={5000} rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
      <p className="muted">Repete toda semana no calendário. As horas são uma intenção; atividades realizadas continuam sendo registradas separadamente.</p>
      <button className="button full" disabled={busy}>{busy ? "Salvando…" : "Salvar rotina"}</button>
    </form>
  </Modal>;
}

export function WeeklyPlanner({ health = false }: { health?: boolean }) {
  const { plans, user, couple, profile, run } = useData();
  const category = health ? "Saúde" : "Ministério";
  const [edit, setEdit] = useState<Plan | number | null>(null);
  const [participant, setParticipant] = useState("all");
  const routines = plans.filter((p) => p.weekday !== undefined && p.category === category && (participant === "all" || p.participants?.includes(participant)));
  return <>
    <Heading eyebrow={health ? "CUIDAR DE VOCÊS" : "UMA SEMANA COM PROPÓSITO"} title={health ? "Saúde e bem-estar" : "Programação de campo"} description={health ? "Reserve espaço para exercício, descanso e cuidados pessoais." : "Organize modalidades e horas de segunda a domingo, sem escolher datas."} action={<button className="button" onClick={() => setEdit(0)}><Plus size={18} />Adicionar atividade</button>} />
    <div className="toolbar"><span className="badge">{routines.reduce((s, p) => s + (p.duration || 0), 0) / 60} h de atividades / semana</span><select aria-label="Filtrar rotina por participante" value={participant} onChange={(e) => setParticipant(e.target.value)}><option value="all">Toda a programação</option><option value={user!.uid}>{profile!.name}</option>{couple?.memberIds.filter((id) => id !== user!.uid).map((id) => <option key={id} value={id}>{couple.names[id]}</option>)}</select><Link className="text-link" to="/calendario">Ver no calendário →</Link></div>
    <div className="weekly-board">{weekdays.map((day, index) => <article className="panel weekly-day" key={day}><div className="section-heading"><h2>{day}</h2><button className="icon-button" aria-label={`Adicionar em ${day}`} onClick={() => setEdit(index)}><Plus size={18} /></button></div>{routines.filter((p) => p.weekday === index).map((p) => <div className="routine-card" key={p.id}><span className="badge">{(p.duration || 0) / 60} h {p.time && `· ${p.time}`}</span><h3>{p.title}</h3><p>{p.participants?.map((id) => couple?.names[id] || profile!.name).join(" e ")}</p><small className="muted">{p.visibility === "couple" ? "Visível para o casal" : "Pessoal"}</small>{p.notes && <p className="note-text">{p.notes}</p>}{p.ownerId === user!.uid && <div className="inline-actions"><button className="icon-button" aria-label={`Editar ${p.title}`} onClick={() => setEdit(p)}><Pencil size={16} /></button><button className="icon-button danger" aria-label={`Excluir ${p.title}`} onClick={() => run(() => removeRecord("plans", p.id), "Rotina removida.")}><Trash2 size={16} /></button></div>}</div>)}{!routines.some((p) => p.weekday === index) && <p className="muted">Espaço livre. Planeje no seu ritmo.</p>}</article>)}</div>
    {health && <article className="panel study-history"><h2>Mais espaço para o bem-estar</h2><p>Inclua pausas, sono, refeições e consultas na agenda. Use as metas para acompanhar hábitos e o caderno para organizar refeições e compras.</p><Link className="text-link" to="/habitos">Acompanhar hábitos →</Link></article>}
    {edit !== null && <RoutineEditor category={category} initial={typeof edit === "object" ? edit : undefined} day={typeof edit === "number" ? edit : undefined} close={() => setEdit(null)} />}
  </>;
}

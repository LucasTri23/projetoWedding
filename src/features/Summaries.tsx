import { useEffect, useState } from "react";
import { collection, doc, onSnapshot, query, where } from "firebase/firestore";
import { useData } from "../lib/context";
import { database, publishSummary, removeRecord } from "../lib/service";
import { errorMessage } from "../lib/errors";
import type { SharedSummary } from "../lib/types";
import { Progress } from "../components/ui";

export function SummarySettings() {
  const { user, profile, goals, logs, run, notify } = useData();
  const [summary, setSummary] = useState<SharedSummary | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(
    () =>
      onSnapshot(
        doc(database(), "sharedSummaries", user!.uid),
        (s) => setSummary(s.exists() ? (s.data() as SharedSummary) : null),
        (e) => notify(errorMessage(e)),
      ),
    [user, notify],
  );
  return (
    <div className="summary-settings">
      <h3>Meu resumo para o casal</h3>
      <p className="muted">
        Você pode compartilhar apenas números de progresso, sequência bíblica,
        estudos, exercícios e horas ministeriais. Seus registros e observações
        continuam privados. O resumo é atualizado quando você clicar abaixo.
      </p>
      <div className="inline-actions">
        <button
          className="button secondary small"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            await run(
              () => publishSummary(user!.uid, profile!, goals, logs),
              "Resumo compartilhado com seu par.",
            );
            setBusy(false);
          }}
        >
          {summary ? "Atualizar meu resumo" : "Compartilhar meu resumo"}
        </button>
        {summary && (
          <button
            className="button secondary small"
            disabled={busy}
            onClick={() =>
              run(
                () => removeRecord("sharedSummaries", user!.uid),
                "Resumo removido do espaço compartilhado.",
              )
            }
          >
            Parar de compartilhar
          </button>
        )}
      </div>
      {summary && (
        <p className="muted">
          Última atualização: {summary.date.split("-").reverse().join("/")}
        </p>
      )}
    </div>
  );
}

export function IndividualSummaries() {
  const { user, couple, notify } = useData();
  const [summaries, setSummaries] = useState<SharedSummary[]>([]);
  useEffect(() => {
    if (!couple) {
      setSummaries([]);
      return;
    }
    return onSnapshot(
      query(
        collection(database(), "sharedSummaries"),
        where("coupleId", "==", couple.id),
      ),
      (s) => setSummaries(s.docs.map((d) => d.data() as SharedSummary)),
      (e) => notify(errorMessage(e)),
    );
  }, [couple, notify]);
  if (!couple) return null;
  return (
    <article className="panel">
      <h2>Cada um, no seu caminho</h2>
      <p className="muted">
        Resumos compartilhados voluntariamente. Sem competição, com
        companheirismo.
      </p>
      <div className="summary-grid">
        {couple.memberIds.map((uid) => {
          const s = summaries.find((item) => item.ownerId === uid);
          return (
            <div className="summary-person" key={uid}>
              <h3>
                {couple.names[uid]} {uid === user!.uid ? "· você" : ""}
              </h3>
              {s ? (
                <>
                  <Progress value={s.weeklyProgress} />
                  <p>
                    {s.weeklyProgress}% de progresso semanal · {s.bibleStreak}{" "}
                    dias de leitura
                  </p>
                  <p>
                    {s.studies} estudos · {s.exercises} exercícios na semana
                  </p>
                  <p>{s.ministryHours.toFixed(1)} horas ministeriais no mês</p>
                  <small className="muted">
                    Retrato de {s.date.split("-").reverse().join("/")}
                  </small>
                </>
              ) : (
                <p className="muted">
                  Resumo ainda não compartilhado. Cada pessoa escolhe no Perfil.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </article>
  );
}

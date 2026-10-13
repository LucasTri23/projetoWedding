import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { collection, doc, onSnapshot, query, where } from "firebase/firestore";
import type { ReactNode } from "react";
import { auth, db } from "./firebase";
import type { Activity, Couple, Goal, Note, Plan, Profile } from "./types";
import { errorMessage } from "./errors";
interface Data {
  user: User | null;
  profile: Profile | null;
  couple: Couple | null;
  goals: Goal[];
  logs: Activity[];
  plans: Plan[];
  notes: Note[];
  loading: boolean;
  error: string;
  retry: () => Promise<void>;
  notify: (text: string) => void;
  run: (action: () => Promise<unknown>, success?: string) => Promise<boolean>;
}
const Context = createContext<Data | null>(null);
export function Provider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [couple, setCouple] = useState<Couple | null>(null);
  const [coupleReady, setCoupleReady] = useState(false);
  const [loading, setLoading] = useState(Boolean(auth));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [revision, setRevision] = useState(0);
  const [toast, setToast] = useState("");
  const [goals, setGoals] = useState<Goal[]>([]);
  const [logs, setLogs] = useState<Activity[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const profileReady = Boolean(profile);
  const coupleId = profile?.coupleId;
  const report = useCallback(
    (source: string, error?: unknown) =>
      setErrors((previous) => {
        if (error)
          return { ...previous, [source]: `${source}: ${errorMessage(error)}` };
        if (!(source in previous)) return previous;
        const next = { ...previous };
        delete next[source];
        return next;
      }),
    [],
  );
  useEffect(
    () =>
      auth
        ? onAuthStateChanged(auth, (u) => {
            setUser(u);
            setProfile(null);
            setCouple(null);
            setCoupleReady(false);
            setErrors({});
            setLoading(Boolean(u));
          })
        : undefined,
    [],
  );
  useEffect(() => {
    if (!user || !db) return;
    return onSnapshot(
      doc(db, "users", user.uid),
      { includeMetadataChanges: true },
      (s) => {
        setProfile(s.exists() ? (s.data() as Profile) : null);
        setLoading(false);
        report("Perfil");
      },
      (e) => {
        report("Perfil", e);
        setLoading(false);
      },
    );
  }, [user, revision, report]);
  useEffect(() => {
    setCouple(null);
    setCoupleReady(false);
    if (!user || !coupleId || !db) return;
    return onSnapshot(
      doc(db, "couples", coupleId),
      { includeMetadataChanges: true },
      (s) => {
        const value = s.exists() ? ({ ...s.data(), id: s.id } as Couple) : null;
        setCouple(value);
        setCoupleReady(
          Boolean(
            value?.memberIds.includes(user.uid) && !s.metadata.hasPendingWrites,
          ),
        );
        report("Espaço do casal");
      },
      (e) => {
        setCouple(null);
        setCoupleReady(false);
        report("Espaço do casal", e);
      },
    );
  }, [user, coupleId, revision, report]);
  useEffect(() => {
    setGoals([]);
    setLogs([]);
    setPlans([]);
    setNotes([]);
    if (!user || !profileReady || !db) return;
    const stops: (() => void)[] = [];
    const subscribe = <T,>(
      path: string,
      label: string,
      set: (value: T[]) => void,
    ) => {
      let own: T[] = [];
      let shared: T[] = [];
      const merge = () =>
        set([
          ...new Map(
            [...own, ...shared].map((x) => [(x as { id: string }).id, x]),
          ).values(),
        ]);
      stops.push(
        onSnapshot(
          query(collection(db!, path), where("ownerId", "==", user.uid)),
          (s) => {
            own = s.docs.map((d) => ({ ...d.data(), id: d.id }) as T);
            merge();
            report(`${label} pessoais`);
          },
          (e) => report(`${label} pessoais`, e),
        ),
      );
      if (coupleReady && coupleId)
        stops.push(
          onSnapshot(
            query(
              collection(db!, path),
              where("coupleId", "==", coupleId),
              where(
                path === "goals" ? "type" : "visibility",
                path === "goals" ? "in" : "==",
                path === "goals" ? ["shared", "parallel"] : "couple",
              ),
            ),
            (s) => {
              shared = s.docs.map((d) => ({ ...d.data(), id: d.id }) as T);
              merge();
              report(`${label} do casal`);
            },
            (e) => report(`${label} do casal`, e),
          ),
        );
      else report(`${label} do casal`);
    };
    subscribe<Goal>("goals", "Metas", setGoals);
    subscribe<Activity>("activityLogs", "Registros", setLogs);
    subscribe<Plan>("plans", "Calendário", setPlans);
    subscribe<Note>("sharedNotes", "Caderno", setNotes);
    return () => stops.forEach((stop) => stop());
  }, [user, profileReady, coupleId, coupleReady, revision, report]);
  useEffect(() => {
    document.documentElement.dataset.theme =
      profile?.theme || localStorage.getItem("theme") || "light";
  }, [profile?.theme]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 4500);
    return () => clearTimeout(timer);
  }, [toast]);
  const run = useCallback(
    async (action: () => Promise<unknown>, success?: string) => {
      try {
        await action();
        if (success) setToast(success);
        return true;
      } catch (e) {
        setToast(errorMessage(e));
        return false;
      }
    },
    [],
  );
  const retry = useCallback(async () => {
    if (auth?.currentUser) await auth.currentUser.getIdToken(true);
    setErrors({});
    setRevision((n) => n + 1);
  }, []);
  return (
    <Context.Provider
      value={{
        user,
        profile,
        couple,
        goals,
        logs,
        plans,
        notes,
        loading,
        error: Object.values(errors).join(" · "),
        retry,
        notify: setToast,
        run,
      }}
    >
      {children}
      {toast && (
        <div className="toast" role="status">
          {toast}
          <button aria-label="Fechar mensagem" onClick={() => setToast("")}>
            ×
          </button>
        </div>
      )}
    </Context.Provider>
  );
}
export function useData() {
  const value = useContext(Context);
  if (!value) throw new Error("Provider ausente");
  return value;
}

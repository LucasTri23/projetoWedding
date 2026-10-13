import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";
import { validatePlan } from "./calendar";
import type { Activity, Goal, Note, Plan, Profile } from "./types";
import {
  ministrySummary,
  period,
  progress,
  streak,
  today,
  validateGoal,
} from "./business";
export function database() {
  if (!db) throw new Error("Configure o Firebase no arquivo .env.");
  return db;
}
export async function publishSummary(
  uid: string,
  profile: Profile,
  goals: Goal[],
  logs: Activity[],
) {
  if (!profile.coupleId) throw new Error("Crie ou aceite um espaço primeiro.");
  if (!navigator.onLine)
    throw new Error("Compartilhar um resumo exige conexão.");
  const date = today(profile.timezone);
  const [start, end] = period(date, "weekly");
  const active = goals.filter((g) => !g.archived && g.frequency === "weekly");
  const bible = goals.find(
    (g) =>
      !g.archived &&
      g.frequency === "daily" &&
      g.title.toLowerCase().includes("bíblia"),
  );
  const own = logs.filter(
    (l) => l.ownerId === uid && l.date >= start && l.date <= end,
  );
  const ref = doc(database(), "sharedSummaries", uid);
  const existing = await getDoc(ref);
  await setDoc(ref, {
    id: uid,
    ownerId: uid,
    coupleId: profile.coupleId,
    date,
    weeklyProgress: active.length
      ? Math.round(
          active.reduce((s, g) => s + progress(g, logs, uid, date).percent, 0) /
            active.length,
        )
      : 0,
    bibleStreak: bible ? streak(logs, bible.id, uid, date) : 0,
    studies: own.filter((l) => l.kind === "study").length,
    exercises: own.filter((l) => l.category === "Atividade física").length,
    ministryHours: ministrySummary(logs, uid, date, profile.ministryTarget)
      .hours,
    createdAt: existing.data()?.createdAt || serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}
export const defaultProfile = (name: string): Profile => ({
  name,
  photo: "",
  coupleId: null,
  ministryMode: "Publicador",
  ministryTarget: 0,
  annualTarget: 0,
  theme: "light",
  timezone: "America/Sao_Paulo",
});
export async function ensureProfile(uid: string, name: string) {
  const ref = doc(database(), "users", uid);
  if (!(await getDoc(ref)).exists())
    await setDoc(ref, {
      ...defaultProfile(name),
      id: uid,
      ownerId: uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
}
export async function saveProfile(uid: string, patch: Partial<Profile>) {
  await updateDoc(doc(database(), "users", uid), {
    ...patch,
    updatedAt: serverTimestamp(),
  });
}
type Input<T> = Omit<T, "id" | "createdAt" | "updatedAt">;
export async function saveRecord<T extends Goal | Activity | Plan | Note>(
  path: string,
  value: Input<T>,
  id?: string,
) {
  if (path === "goals") validateGoal(value as Input<Goal>);
  if (path === "plans") validatePlan(value as Input<Plan>);
  const payload = { ...value, updatedAt: serverTimestamp() };
  if (id) await updateDoc(doc(database(), path, id), payload);
  else {
    const ref = doc(collection(database(), path));
    await setDoc(ref, { ...payload, id: ref.id, createdAt: serverTimestamp() });
  }
}
export async function removeRecord(path: string, id: string) {
  await deleteDoc(doc(database(), path, id));
}
export async function createCouple(uid: string, name: string) {
  const ref = doc(collection(database(), "couples"));
  const batch = writeBatch(database());
  batch.set(ref, {
    id: ref.id,
    ownerId: uid,
    memberIds: [uid],
    names: { [uid]: name },
    invitationId: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  batch.update(doc(database(), "users", uid), {
    coupleId: ref.id,
    updatedAt: serverTimestamp(),
  });
  await batch.commit();
  return ref.id;
}
export async function createInvitation(
  uid: string,
  coupleId: string,
  email: string,
) {
  if (!navigator.onLine)
    throw new Error("Conecte-se à internet para gerar um convite.");
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const id = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  const batch = writeBatch(database());
  batch.set(doc(database(), "invitations", id), {
    id,
    ownerId: uid,
    coupleId,
    recipientEmail: email.trim().toLowerCase(),
    status: "pending",
    acceptedBy: null,
    expiresAt: Timestamp.fromMillis(Date.now() + 48 * 3600000),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  batch.update(doc(database(), "couples", coupleId), {
    invitationId: id,
    updatedAt: serverTimestamp(),
  });
  await batch.commit();
  return `${location.origin}${location.pathname}#/perfil?invite=${id}`;
}
export async function acceptInvitation(uid: string, name: string, id: string) {
  if (!navigator.onLine)
    throw new Error("A aceitação do convite exige conexão.");
  await runTransaction(database(), async (tx) => {
    const inviteRef = doc(database(), "invitations", id);
    const invite = await tx.get(inviteRef);
    if (!invite.exists()) throw new Error("Convite não encontrado.");
    const data = invite.data();
    const coupleRef = doc(database(), "couples", data.coupleId);
    const couple = await tx.get(coupleRef);
    const profileRef = doc(database(), "users", uid);
    const profile = await tx.get(profileRef);
    if (profile.data()?.coupleId)
      throw new Error("Você já pertence a um espaço.");
    if (
      data.status !== "pending" ||
      data.expiresAt.toMillis() < Date.now() ||
      !couple.exists() ||
      couple.data().memberIds.length !== 1 ||
      couple.data().invitationId !== id
    )
      throw new Error("Convite expirado, substituído ou já utilizado.");
    tx.update(inviteRef, {
      status: "accepted",
      acceptedBy: uid,
      updatedAt: serverTimestamp(),
    });
    tx.update(coupleRef, {
      memberIds: [...couple.data().memberIds, uid],
      names: { ...couple.data().names, [uid]: name },
      updatedAt: serverTimestamp(),
    });
    tx.update(profileRef, {
      coupleId: data.coupleId,
      updatedAt: serverTimestamp(),
    });
  });
}
export async function saveReference(
  uid: string,
  title: string,
  url: string,
  category: string,
  description: string,
  habits: string,
) {
  const parsed = new URL(url);
  if (
    parsed.protocol !== "https:" ||
    !["jw.org", "www.jw.org", "wol.jw.org"].includes(parsed.hostname)
  )
    throw new Error("Use um link HTTPS oficial do jw.org ou wol.jw.org.");
  await addDoc(collection(database(), "referenceLibrary"), {
    ownerId: uid,
    coupleId: null,
    title,
    url,
    category,
    description,
    habits,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

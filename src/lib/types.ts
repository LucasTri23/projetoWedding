import type { Timestamp } from "firebase/firestore";
export type Frequency = "daily" | "weekly" | "monthly";
export type GoalType = "individual" | "shared" | "parallel";
export interface RecordBase {
  id: string;
  ownerId: string;
  coupleId: string | null;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}
export interface Goal extends RecordBase {
  title: string;
  category: string;
  frequency: Frequency;
  target: number;
  duration: number;
  type: GoalType;
  favorite: boolean;
  archived: boolean;
}
export interface Activity extends RecordBase {
  goalId: string;
  title: string;
  category: string;
  date: string;
  amount: number;
  duration: number;
  notes: string;
  kind: "activity" | "study" | "ministry";
  details: string;
  visibility: "private" | "couple";
  participants: string[];
}
export interface Plan extends RecordBase {
  title: string;
  date: string;
  time: string;
  notes: string;
  visibility: "private" | "couple";
  category?: string;
  endTime?: string;
  participants?: string[];
}
export interface Note extends RecordBase {
  title: string;
  text: string;
  kind: "note" | "shopping" | "meal" | "review" | "category";
  done: boolean;
  visibility: "private" | "couple";
}
export interface Profile {
  name: string;
  photo: string;
  coupleId: string | null;
  ministryMode: string;
  ministryTarget: number;
  annualTarget: number;
  theme: "light" | "dark";
  timezone: string;
}
export interface Couple {
  id: string;
  ownerId: string;
  memberIds: string[];
  names: Record<string, string>;
  invitationId: string | null;
}
export interface SharedSummary extends RecordBase {
  date: string;
  weeklyProgress: number;
  bibleStreak: number;
  studies: number;
  exercises: number;
  ministryHours: number;
}
export const categories = [
  "Espiritualidade",
  "Atividade física",
  "Alimentação",
  "Ministério",
  "Relacionamento",
  "Outros",
  "Saúde",
  "Financeiro",
];
export const frequencyLabels: Record<Frequency, string> = {
  daily: "dia",
  weekly: "semana",
  monthly: "mês",
};
export const typeLabels: Record<GoalType, string> = {
  individual: "Individual",
  shared: "Compartilhada",
  parallel: "Paralela",
};

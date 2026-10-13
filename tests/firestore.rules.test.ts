import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
  writeBatch,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { readFileSync } from "node:fs";
let env: RulesTestEnvironment;
const token = "a".repeat(64);
const profile = (id: string, coupleId: string | null = null) => ({
  id,
  ownerId: id,
  name: id,
  photo: "",
  coupleId,
  ministryMode: "Publicador",
  ministryTarget: 0,
  annualTarget: 0,
  theme: "light",
  timezone: "America/Sao_Paulo",
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
});
const goal = (id: string, ownerId = "alice", type = "individual") => ({
  id,
  ownerId,
  coupleId: type === "individual" ? null : "couple",
  title: "Ler",
  category: "Espiritualidade",
  frequency: "weekly",
  target: 3,
  duration: 10,
  type,
  favorite: false,
  archived: false,
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
});
const ctx = (id: string, email = `${id}@example.com`, verified = true) =>
  env.authenticatedContext(id, { email, email_verified: verified }).firestore();
beforeAll(async () => {
  const [host, port] = process.env.FIRESTORE_EMULATOR_HOST!.split(":");
  env = await initializeTestEnvironment({
    projectId: "demo-juntos",
    firestore: {
      host,
      port: Number(port),
      rules: readFileSync("firestore.rules", "utf8"),
    },
  });
});
afterAll(async () => {
  await env.cleanup();
});
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (c) => {
    const db = c.firestore();
    await setDoc(doc(db, "users", "alice"), profile("alice", "couple"));
    await setDoc(doc(db, "users", "bob"), profile("bob"));
    await setDoc(doc(db, "users", "eve"), profile("eve"));
    await setDoc(doc(db, "couples", "couple"), {
      id: "couple",
      ownerId: "alice",
      memberIds: ["alice"],
      names: { alice: "alice" },
      invitationId: token,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    await setDoc(doc(db, "invitations", token), {
      id: token,
      ownerId: "alice",
      coupleId: "couple",
      recipientEmail: "bob@example.com",
      status: "pending",
      acceptedBy: null,
      expiresAt: Timestamp.fromMillis(Date.now() + 3600000),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    await setDoc(doc(db, "goals", "private"), goal("private"));
    await setDoc(doc(db, "goals", "shared"), goal("shared", "alice", "shared"));
  });
});
async function join(id = "bob", verified = true) {
  const db = ctx(id, `${id}@example.com`, verified);
  const batch = writeBatch(db);
  batch.update(doc(db, "invitations", token), {
    status: "accepted",
    acceptedBy: id,
    updatedAt: serverTimestamp(),
  });
  batch.update(doc(db, "couples", "couple"), {
    memberIds: ["alice", id],
    names: { alice: "alice", [id]: id },
    updatedAt: serverTimestamp(),
  });
  batch.update(doc(db, "users", id), {
    coupleId: "couple",
    updatedAt: serverTimestamp(),
  });
  return batch.commit();
}
describe("fronteiras de segurança", () => {
  it("nega acesso anônimo e externo", async () => {
    await assertFails(
      getDoc(doc(env.unauthenticatedContext().firestore(), "goals", "private")),
    );
    await assertFails(getDoc(doc(ctx("eve"), "goals", "private")));
    await assertFails(getDoc(doc(ctx("eve"), "couples", "couple")));
  });
  it("permite cadastro apenas do próprio perfil, sem permissões arbitrárias", async () => {
    const db = ctx("new");
    await assertSucceeds(
      setDoc(doc(db, "users", "new"), {
        ...profile("new"),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
    );
    await assertFails(
      setDoc(doc(db, "users", "other"), {
        ...profile("other"),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
    );
    await assertFails(
      updateDoc(doc(db, "users", "new"), {
        admin: true,
        updatedAt: serverTimestamp(),
      }),
    );
  });
  it("permite criar espaço apenas com vínculo atômico", async () => {
    const db = ctx("bob");
    const d = {
      id: "new",
      ownerId: "bob",
      memberIds: ["bob"],
      names: { bob: "bob" },
      invitationId: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await assertFails(setDoc(doc(db, "couples", "new"), d));
    const b = writeBatch(db);
    b.set(doc(db, "couples", "new"), d);
    b.update(doc(db, "users", "bob"), {
      coupleId: "new",
      updatedAt: serverTimestamp(),
    });
    await assertSucceeds(b.commit());
  });
  it("aceita convite atomically e mantém dados privados", async () => {
    await assertSucceeds(getDoc(doc(ctx("bob"), "couples", "couple")));
    await assertSucceeds(join());
    await assertSucceeds(getDoc(doc(ctx("bob"), "goals", "shared")));
    await assertFails(getDoc(doc(ctx("bob"), "goals", "private")));
    await assertFails(getDoc(doc(ctx("bob"), "users", "alice")));
    await assertFails(join());
  });
  it("nega aceite sem verificação ou por outro e-mail", async () => {
    await assertFails(join("bob", false));
    await assertFails(join("eve"));
  });
  it("nega convite expirado", async () => {
    await env.withSecurityRulesDisabled((c) =>
      updateDoc(doc(c.firestore(), "invitations", token), {
        expiresAt: Timestamp.fromMillis(Date.now() - 1000),
      }),
    );
    await assertFails(join());
  });
  it("nega vínculo não atômico e mudanças nas permissões", async () => {
    await assertFails(
      updateDoc(doc(ctx("bob"), "users", "bob"), {
        coupleId: "couple",
        updatedAt: serverTimestamp(),
      }),
    );
    await assertFails(
      updateDoc(doc(ctx("alice"), "couples", "couple"), {
        memberIds: ["alice", "eve"],
        names: { alice: "alice", eve: "eve" },
        updatedAt: serverTimestamp(),
      }),
    );
  });
  it("restringe consultas de convites", async () => {
    await assertFails(getDocs(collection(ctx("bob"), "invitations")));
    await assertFails(getDoc(doc(ctx("eve"), "invitations", token)));
  });
  it("valida metas e impede alteração por outro integrante", async () => {
    await assertSucceeds(join());
    const db = ctx("alice");
    await assertSucceeds(
      setDoc(doc(db, "goals", "new"), {
        ...goal("new"),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
    );
    await assertFails(
      updateDoc(doc(ctx("bob"), "goals", "shared"), {
        title: "Mudado",
        updatedAt: serverTimestamp(),
      }),
    );
    await assertFails(
      updateDoc(doc(db, "goals", "new"), {
        target: 0,
        updatedAt: serverTimestamp(),
      }),
    );
    await assertFails(
      updateDoc(doc(db, "goals", "new"), {
        ownerId: "bob",
        updatedAt: serverTimestamp(),
      }),
    );
  });
  it("cria registro compartilhado sem expor registro individual", async () => {
    await assertSucceeds(join());
    const db = ctx("bob");
    const log = {
      id: "log",
      ownerId: "bob",
      coupleId: "couple",
      goalId: "shared",
      title: "Ler",
      category: "Espiritualidade",
      date: "2026-10-13",
      amount: 1,
      duration: 10,
      notes: "",
      kind: "study",
      details: "Aprendizados",
      visibility: "couple",
      participants: ["alice", "bob"],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await assertSucceeds(setDoc(doc(db, "activityLogs", "log"), log));
    await assertSucceeds(getDoc(doc(ctx("alice"), "activityLogs", "log")));
    await assertFails(
      setDoc(doc(db, "activityLogs", "bad"), {
        ...log,
        id: "bad",
        ownerId: "alice",
      }),
    );
    await assertFails(
      setDoc(doc(db, "activityLogs", "bad"), {
        ...log,
        id: "bad",
        goalId: "private",
      }),
    );
    await assertFails(
      setDoc(doc(db, "activityLogs", "bad"), {
        ...log,
        id: "bad",
        kind: "ministry",
      }),
    );
  });
  it("permite consultas delimitadas e nega consultas globais", async () => {
    await assertSucceeds(
      getDocs(
        query(
          collection(ctx("alice"), "goals"),
          where("ownerId", "==", "alice"),
        ),
      ),
    );
    await assertFails(getDocs(collection(ctx("eve"), "goals")));
  });
  it("autoriza as consultas exatas usadas no aplicativo após criar o espaço", async () => {
    for (const path of ["goals", "activityLogs", "plans", "sharedNotes"]) {
      await assertSucceeds(
        getDocs(
          query(
            collection(ctx("alice"), path),
            where("ownerId", "==", "alice"),
          ),
        ),
      );
      const constraints =
        path === "goals"
          ? [
              where("coupleId", "==", "couple"),
              where("type", "in", ["shared", "parallel"]),
            ]
          : [
              where("coupleId", "==", "couple"),
              where("visibility", "==", "couple"),
            ];
      await assertSucceeds(
        getDocs(query(collection(ctx("alice"), path), ...constraints)),
      );
      await assertFails(
        getDocs(query(collection(ctx("eve"), path), ...constraints)),
      );
    }
  });
  it("permite agenda compartilhada por participante e edição somente pelo criador", async () => {
    await assertSucceeds(join());
    const agenda = {
      id: "agenda",
      ownerId: "alice",
      coupleId: "couple",
      title: "Pregação",
      date: "2026-10-13",
      time: "09:00",
      endTime: "11:00",
      category: "Ministério",
      participants: ["bob"],
      notes: "",
      visibility: "couple",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await assertSucceeds(setDoc(doc(ctx("alice"), "plans", "agenda"), agenda));
    await assertSucceeds(getDoc(doc(ctx("bob"), "plans", "agenda")));
    await assertSucceeds(
      updateDoc(doc(ctx("alice"), "plans", "agenda"), {
        endTime: "12:00",
        updatedAt: serverTimestamp(),
      }),
    );
    await assertFails(
      updateDoc(doc(ctx("bob"), "plans", "agenda"), {
        endTime: "12:00",
        updatedAt: serverTimestamp(),
      }),
    );
    await assertFails(
      updateDoc(doc(ctx("alice"), "plans", "agenda"), {
        participants: ["eve"],
        updatedAt: serverTimestamp(),
      }),
    );
    await assertFails(
      updateDoc(doc(ctx("alice"), "plans", "agenda"), {
        endTime: "08:00",
        updatedAt: serverTimestamp(),
      }),
    );
  });
  it("nega convites substituídos", async () => {
    await env.withSecurityRulesDisabled((c) =>
      updateDoc(doc(c.firestore(), "couples", "couple"), {
        invitationId: "b".repeat(64),
      }),
    );
    await assertFails(join());
  });
  it("compartilha resumo apenas com consentimento do dono", async () => {
    await assertSucceeds(join());
    const summary = {
      id: "alice",
      ownerId: "alice",
      coupleId: "couple",
      date: "2026-10-13",
      weeklyProgress: 67,
      bibleStreak: 5,
      studies: 1,
      exercises: 2,
      ministryHours: 10,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await assertSucceeds(
      setDoc(doc(ctx("alice"), "sharedSummaries", "alice"), summary),
    );
    await assertSucceeds(getDoc(doc(ctx("bob"), "sharedSummaries", "alice")));
    await assertFails(getDoc(doc(ctx("eve"), "sharedSummaries", "alice")));
    await assertFails(
      updateDoc(doc(ctx("bob"), "sharedSummaries", "alice"), {
        weeklyProgress: 100,
        updatedAt: serverTimestamp(),
      }),
    );
    await assertFails(
      setDoc(doc(ctx("bob"), "sharedSummaries", "alice"), summary),
    );
    await assertSucceeds(
      getDocs(
        query(
          collection(ctx("bob"), "sharedSummaries"),
          where("coupleId", "==", "couple"),
        ),
      ),
    );
  });
  it("mantém horas ministeriais privadas mesmo dentro do casal", async () => {
    await assertSucceeds(join());
    await assertSucceeds(
      setDoc(doc(ctx("alice"), "activityLogs", "ministry"), {
        id: "ministry",
        ownerId: "alice",
        coupleId: null,
        goalId: "",
        title: "Pregação",
        category: "Ministério",
        date: "2026-10-13",
        amount: 1,
        duration: 60,
        notes: "",
        kind: "ministry",
        details: "",
        visibility: "private",
        participants: ["alice"],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
    );
    await assertFails(getDoc(doc(ctx("bob"), "activityLogs", "ministry")));
  });
});

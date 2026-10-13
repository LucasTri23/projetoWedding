import { describe, expect, it } from "vitest";
const base = `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts`;
async function call(method: string, body: unknown) {
  const result = await fetch(`${base}:${method}?key=emulator-public-key`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return { status: result.status, data: await result.json() };
}
describe("autenticação por e-mail no emulador", () => {
  it("cria conta, autentica e rejeita senha incorreta", async () => {
    const email = `flow-${crypto.randomUUID()}@example.com`;
    const created = await call("signUp", {
      email,
      password: "UmaSenha123!",
      returnSecureToken: true,
    });
    expect(created.status).toBe(200);
    expect(created.data.localId).toBeTruthy();
    const login = await call("signInWithPassword", {
      email,
      password: "UmaSenha123!",
      returnSecureToken: true,
    });
    expect(login.status).toBe(200);
    expect(login.data.localId).toBe(created.data.localId);
    const invalid = await call("signInWithPassword", {
      email,
      password: "OutraSenha123!",
      returnSecureToken: true,
    });
    expect(invalid.status).toBe(400);
  });
  it("não permite duplicar uma conta", async () => {
    const email = `duplicate-${crypto.randomUUID()}@example.com`;
    await call("signUp", { email, password: "UmaSenha123!" });
    const duplicate = await call("signUp", { email, password: "UmaSenha123!" });
    expect(duplicate.status).toBe(400);
    expect(duplicate.data.error.message).toBe("EMAIL_EXISTS");
  });
});

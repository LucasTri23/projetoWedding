import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { ArrowRight, Leaf, ShieldCheck } from "lucide-react";
import { auth, configured } from "../lib/firebase";
import { ensureProfile } from "../lib/service";
import { useData } from "../lib/context";
import { Field } from "../components/ui";
import { Brand } from "../components/Brand";
export function Auth() {
  const [mode, setMode] = useState<"login" | "signup" | "reset">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const { run } = useData();
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!auth) return;
    setBusy(true);
    await run(
      async () => {
        if (mode === "reset") {
          await sendPasswordResetEmail(auth!, email);
          return;
        }
        if (mode === "signup") {
          const result = await createUserWithEmailAndPassword(
            auth!,
            email,
            password,
          );
          await updateProfile(result.user, { displayName: name });
          await ensureProfile(result.user.uid, name);
          await sendEmailVerification(result.user);
        } else {
          const result = await signInWithEmailAndPassword(
            auth!,
            email,
            password,
          );
          await ensureProfile(
            result.user.uid,
            result.user.displayName || "Meu perfil",
          );
        }
      },
      mode === "reset"
        ? "Confira seu e-mail para redefinir a senha."
        : mode === "signup"
          ? "Conta criada. Confira seu e-mail para verificar a conta."
          : undefined,
    );
    setBusy(false);
  }
  return (
    <main className="auth-page">
      <section className="auth-story">
        <div className="brand">
          <Brand />
        </div>
        <div>
          <span className="eyebrow">UMA VIDA COM MAIS PROPÓSITO</span>
          <h1>
            Pequenos passos.
            <br />
            Uma vida mais
            <br />
            <em>equilibrada.</em>
          </h1>
          <p>
            Um espaço para cuidar de vocês, cultivar bons hábitos e crescer
            juntos. No seu ritmo.
          </p>
          <div className="story-symbol">
            <Leaf size={100} />
            <span>
              Individualidade.
              <br />
              Companheirismo.
              <br />
              Constância.
            </span>
          </div>
        </div>
        <small>Construindo hoje o que queremos viver amanhã.</small>
      </section>
      <section className="auth-form">
        <div className="auth-card">
          <span className="eyebrow">CULTIVA</span>
          <h2>
            {mode === "signup"
              ? "Vamos começar?"
              : mode === "reset"
                ? "Recupere seu acesso"
                : "Que bom ter você aqui."}
          </h2>
          <p>
            {mode === "signup"
              ? "Crie seu espaço para novos hábitos."
              : "Entre no seu espaço e continue a sua jornada."}
          </p>
          {!configured ? (
            <div className="setup">
              <ShieldCheck />
              <h3>Configure seu espaço seguro</h3>
              <p>
                O projeto está pronto para conectar ao Firebase. Copie{" "}
                <code>.env.example</code> para <code>.env</code>, preencha a
                configuração pública do seu projeto e reinicie a aplicação.
              </p>
              <p>
                O README explica como ativar Authentication, publicar as regras
                do Firestore e configurar o GitHub Pages.
              </p>
              <a
                className="button secondary"
                href="https://console.firebase.google.com/"
                target="_blank"
                rel="noreferrer"
              >
                Abrir Firebase Console <ArrowRight size={16} />
              </a>
            </div>
          ) : (
            <>
              <form onSubmit={submit}>
                {mode === "signup" && (
                  <Field label="Seu nome">
                    <input
                      required
                      maxLength={80}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      autoComplete="name"
                    />
                  </Field>
                )}
                <Field label="E-mail">
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </Field>
                {mode !== "reset" && (
                  <Field label="Senha">
                    <input
                      required
                      type="password"
                      minLength={mode === "signup" ? 8 : 1}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete={
                        mode === "signup" ? "new-password" : "current-password"
                      }
                    />
                  </Field>
                )}
                <button className="button full" disabled={busy}>
                  {busy
                    ? "Aguarde…"
                    : mode === "signup"
                      ? "Criar minha conta"
                      : mode === "reset"
                        ? "Enviar e-mail"
                        : "Entrar"}
                  <ArrowRight size={18} />
                </button>
              </form>
              <div className="auth-links">
                <button
                  onClick={() =>
                    setMode(mode === "signup" ? "login" : "signup")
                  }
                >
                  {mode === "signup" ? "Já tenho uma conta" : "Criar uma conta"}
                </button>
                <button
                  onClick={() => setMode(mode === "reset" ? "login" : "reset")}
                >
                  {mode === "reset"
                    ? "Voltar para entrar"
                    : "Esqueci minha senha"}
                </button>
              </div>
            </>
          )}
          <div className="privacy">
            <ShieldCheck size={16} /> Seus dados pessoais, no seu espaço.
          </div>
        </div>
      </section>
    </main>
  );
}

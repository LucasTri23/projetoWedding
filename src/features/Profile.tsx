import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { sendEmailVerification, signOut } from "firebase/auth";
import { Heart, Link2, LogOut, ShieldCheck } from "lucide-react";
import { useData } from "../lib/context";
import {
  acceptInvitation,
  createCouple,
  createInvitation,
  saveProfile,
} from "../lib/service";
import { auth } from "../lib/firebase";
import { Field, Heading } from "../components/ui";
import { SummarySettings } from "./Summaries";
export function Profile() {
  const { user, profile, couple, run, notify } = useData();
  const [params] = useSearchParams();
  const [name, setName] = useState(profile?.name || "");
  const [photo, setPhoto] = useState(profile?.photo || "");
  const [timezone, setTimezone] = useState(
    profile?.timezone || "America/Sao_Paulo",
  );
  const [email, setEmail] = useState("");
  const [invite, setInvite] = useState(params.get("invite") || "");
  const [link, setLink] = useState("");
  const [busy, setBusy] = useState(false);
  async function action(fn: () => Promise<unknown>, message: string) {
    setBusy(true);
    await run(fn, message);
    setBusy(false);
  }
  return (
    <>
      <Heading
        eyebrow="SEU ESPAÇO, SUAS ESCOLHAS"
        title="Perfil & nosso espaço"
        description="Cuide da sua conta e escolha o que construir em conjunto."
      />
      <div className="profile-grid">
        <article className="panel">
          <div className="profile-intro">
            <span className="avatar large">
              {profile?.photo ? (
                <img src={profile.photo} alt="" referrerPolicy="no-referrer" />
              ) : (
                profile?.name.slice(0, 1).toUpperCase()
              )}
            </span>
            <div>
              <h2>{profile?.name}</h2>
              <p className="muted">{user?.email}</p>
            </div>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (photo) {
                try {
                  if (new URL(photo).protocol !== "https:") throw new Error();
                } catch {
                  notify("Use uma URL HTTPS válida para a foto.");
                  return;
                }
              }
              void action(
                () =>
                  saveProfile(user!.uid, {
                    name: name.trim(),
                    photo,
                    timezone,
                  }),
                "Perfil atualizado.",
              );
            }}
          >
            <Field label="Nome">
              <input
                required
                maxLength={80}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>
            <Field label="Foto de perfil (URL HTTPS, opcional)">
              <input
                type="url"
                value={photo}
                maxLength={2000}
                onChange={(e) => setPhoto(e.target.value)}
              />
            </Field>
            <Field label="Fuso horário dos seus registros">
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
              >
                {[
                  "America/Sao_Paulo",
                  "America/Manaus",
                  "America/Belem",
                  "America/Rio_Branco",
                  "Europe/Lisbon",
                  "UTC",
                ].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </Field>
            <button className="button" disabled={busy}>
              Salvar perfil
            </button>
          </form>
          <div className="profile-security">
            <ShieldCheck size={18} />
            <span>
              {user?.emailVerified
                ? "E-mail verificado"
                : "Verifique seu e-mail antes de aceitar um convite."}
            </span>
            {!user?.emailVerified && (
              <button
                className="text-link"
                onClick={() =>
                  action(
                    () => sendEmailVerification(user!),
                    "E-mail de verificação enviado.",
                  )
                }
              >
                Enviar verificação
              </button>
            )}
          </div>
          <button
            className="button secondary"
            onClick={() => run(() => signOut(auth!))}
          >
            <LogOut size={16} /> Sair da conta
          </button>
        </article>
        <article className="panel">
          <span className="category-icon">
            <Heart size={24} />
          </span>
          <h2>Um espaço para nós</h2>
          <p className="muted">
            Metas pessoais continuam privadas. Metas compartilhadas e paralelas
            ficam disponíveis para o casal.
          </p>
          {couple ? (
            <>
              <SummarySettings />
              <div className="couple-members">
                {Object.entries(couple.names).map(([id, n]) => (
                  <div key={id}>
                    <span className="avatar">{n[0]}</span>
                    <b>
                      {n}
                      {id === user!.uid ? " (você)" : ""}
                    </b>
                  </div>
                ))}
              </div>
              {couple.memberIds.length === 1 &&
                couple.ownerId === user!.uid && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      void action(async () => {
                        setLink(
                          await createInvitation(user!.uid, couple.id, email),
                        );
                      }, "Convite criado. Compartilhe o link com seu par.");
                    }}
                  >
                    <Field label="E-mail da pessoa convidada">
                      <input
                        required
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </Field>
                    <p className="muted">
                      Válido por 48 horas. Um novo convite substitui o anterior.
                    </p>
                    <button className="button" disabled={busy}>
                      <Link2 size={16} /> Gerar convite
                    </button>
                  </form>
                )}
              {link && (
                <div className="invite-box">
                  <input readOnly aria-label="Link do convite" value={link} />
                  <button
                    className="button secondary small"
                    onClick={() =>
                      run(
                        () => navigator.clipboard.writeText(link),
                        "Link copiado.",
                      )
                    }
                  >
                    Copiar link
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              <button
                className="button"
                disabled={busy}
                onClick={() =>
                  action(
                    () => createCouple(user!.uid, profile!.name),
                    "Espaço criado. Agora você pode convidar seu par.",
                  )
                }
              >
                <PlusHeart /> Criar nosso espaço
              </button>
              <div className="separator">ou aceite um convite</div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void action(async () => {
                    await user!.reload();
                    if (!user!.emailVerified)
                      throw new Error(
                        "Verifique seu e-mail primeiro e entre novamente na conta para atualizar a verificação.",
                      );
                    await user!.getIdToken(true);
                    const id = invite.includes("invite=")
                      ? invite.split("invite=")[1].split("&")[0]
                      : invite.trim();
                    if (!/^[a-f0-9]{64}$/.test(id))
                      throw new Error(
                        "Cole o link completo ou o código válido do convite.",
                      );
                    await acceptInvitation(user!.uid, profile!.name, id);
                  }, "Bem-vindos ao espaço de vocês!");
                }}
              >
                <Field label="Link ou código do convite">
                  <input
                    required
                    value={invite}
                    onChange={(e) => setInvite(e.target.value)}
                  />
                </Field>
                <button className="button secondary" disabled={busy}>
                  Aceitar convite
                </button>
              </form>
            </>
          )}
        </article>
      </div>
    </>
  );
}
function PlusHeart() {
  return <Heart size={16} />;
}

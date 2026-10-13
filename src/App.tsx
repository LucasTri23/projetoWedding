import { lazy, Suspense, useEffect, useState } from "react";
import { HashRouter, NavLink, Navigate, Route, Routes } from "react-router-dom";
import {
  LayoutDashboard,
  Sprout,
  CalendarDays,
  BookOpen,
  HeartHandshake,
  ChartNoAxesCombined,
  NotebookPen,
  UserRound,
  Plus,
  Moon,
  Sun,
  WifiOff,
  Menu,
  Heart,
} from "lucide-react";
import { useData } from "./lib/context";
import { saveProfile } from "./lib/service";
import { Auth } from "./features/Auth";
import { Goals, ActivityEditor } from "./features/Goals";
import { Planning } from "./features/Planning";
import { Ministry } from "./features/Ministry";
import { Library } from "./features/Library";
import { Profile } from "./features/Profile";
import { Notes } from "./features/Notes";
import { updateApp } from "./lib/pwa";
import { signOut } from "firebase/auth";
import { auth } from "./lib/firebase";
import { Modal } from "./components/ui";
import { Brand } from "./components/Brand";
import { dailyBibleGoals } from "./lib/bible";
import { BibleReading } from "./features/BibleReading";
import { FamilyWorship } from "./features/FamilyWorship";
const baseLinks = [
  { to: "/", label: "Visão geral", icon: LayoutDashboard },
  { to: "/habitos", label: "Hábitos & metas", icon: Sprout },
  { to: "/planejamento", label: "Planejamento", icon: CalendarDays },
  { to: "/ministerio", label: "Ministério", icon: HeartHandshake },
  { to: "/biblioteca", label: "Biblioteca espiritual", icon: BookOpen },
  { to: "/adoracao", label: "Adoração em família", icon: Heart },
  { to: "/relatorios", label: "Nossa evolução", icon: ChartNoAxesCombined },
  { to: "/caderno", label: "Nosso caderno", icon: NotebookPen },
];
const Dashboard = lazy(() =>
  import("./features/Dashboard").then((m) => ({ default: m.Dashboard })),
);
const Reports = lazy(() =>
  import("./features/Reports").then((m) => ({ default: m.Reports })),
);
export default function App() {
  const { user, profile, goals, loading, error, run, retry } = useData();
  const links = [...baseLinks];
  if (dailyBibleGoals(goals).length)
    links.splice(4, 0, {
      to: "/leitura-biblia",
      label: "Leitura da Bíblia",
      icon: BookOpen,
    });
  const [record, setRecord] = useState(false);
  const [menu, setMenu] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  useEffect(() => {
    const update = () => setUpdateAvailable(true);
    window.addEventListener("app-update-available", update);
    return () => window.removeEventListener("app-update-available", update);
  }, []);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);
  if (loading)
    return (
      <div className="loading" role="status" aria-label="Carregando seu espaço">
        <div className="skeleton" />
        <div className="skeleton" />
        <div className="skeleton" />
      </div>
    );
  if (!user) return <Auth />;
  if (!profile)
    return (
      <main className="auth-card">
        <h1>Preparando seu perfil</h1>
        <p>
          {error ||
            "Seu perfil ainda não está disponível. Confira as regras do Firestore e entre novamente."}
        </p>
        <button className="button" onClick={() => location.reload()}>
          Tentar novamente
        </button>
        <button
          className="button secondary"
          onClick={() => run(() => signOut(auth!))}
        >
          Sair da conta
        </button>
      </main>
    );
  const dark = profile.theme === "dark";
  return (
    <HashRouter>
      <a
        className="skip-link"
        href="#main"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("main")?.focus();
        }}
      >
        Pular para o conteúdo
      </a>
      <div className="app-shell">
        <aside className="sidebar">
          <NavLink className="brand" to="/">
            <Brand />
          </NavLink>
          <span className="nav-caption">NOSSO ESPAÇO</span>
          <nav aria-label="Navegação principal">
            {links.map(({ to, label, icon: Icon }) => (
              <NavLink end={to === "/"} to={to} key={to}>
                <Icon size={19} />
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="sidebar-note">
            <Sprout size={25} />
            <p>
              O importante é florescer.
              <br />
              <b>No nosso ritmo.</b>
            </p>
          </div>
          <NavLink className="sidebar-profile" to="/perfil">
            <span className="avatar">{profile.name[0]}</span>
            <span>
              <b>{profile.name}</b>
              <small>Perfil & configurações</small>
            </span>
            <UserRound size={17} />
          </NavLink>
        </aside>
        <div className="main-shell">
          <div className="topbar">
            <button
              className="icon-button mobile-menu-button"
              aria-label="Abrir todos os módulos"
              onClick={() => setMenu(true)}
            >
              <Menu size={21} />
            </button>
            <span className="topbar-label">Um pouco melhor, juntos.</span>
            <NavLink
              className="topbar-brand"
              to="/"
              aria-label="Cultiva, início"
            >
              <Brand compact />
            </NavLink>
            <div>
              <button
                className="icon-button"
                aria-label={dark ? "Ativar modo claro" : "Ativar modo escuro"}
                onClick={() =>
                  run(() =>
                    saveProfile(user.uid, { theme: dark ? "light" : "dark" }),
                  )
                }
              >
                {dark ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <button className="button small" onClick={() => setRecord(true)}>
                <Plus size={17} /> Registrar atividade
              </button>
              <NavLink
                to="/perfil"
                className="avatar"
                aria-label="Abrir perfil"
              >
                {profile.name[0]}
              </NavLink>
            </div>
          </div>
          {!online && (
            <div className="offline" role="status">
              <WifiOff size={17} /> Você está offline. Registros em cache ficam
              disponíveis; alterações sincronizam ao reconectar. Contas e
              convites exigem internet.
            </div>
          )}
          {updateAvailable && (
            <div className="offline" role="status">
              Uma nova versão está disponível.{" "}
              <button
                className="button secondary small"
                onClick={() => void updateApp(true)}
              >
                Atualizar aplicação
              </button>
            </div>
          )}
          {error && (
            <div className="error-banner" role="alert">
              {error}
              <button
                className="button secondary small"
                onClick={() => run(retry, "Conexão atualizada.")}
              >
                Tentar novamente
              </button>
            </div>
          )}
          <main id="main" tabIndex={-1} className="content">
            <Suspense
              fallback={
                <div
                  className="skeleton"
                  role="status"
                  aria-label="Carregando página"
                />
              }
            >
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/habitos" element={<Goals />} />
                <Route path="/planejamento" element={<Planning />} />
                <Route path="/ministerio" element={<Ministry />} />
                <Route path="/biblioteca" element={<Library />} />
                <Route path="/leitura-biblia" element={<BibleReading />} />
                <Route path="/adoracao" element={<FamilyWorship />} />
                <Route path="/relatorios" element={<Reports />} />
                <Route path="/caderno" element={<Notes />} />
                <Route path="/perfil" element={<Profile />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
            <footer>
              <Brand compact /> <span>·</span> Cultivando uma vida com
              propósito.
            </footer>
          </main>
        </div>
        <nav className="bottom-nav" aria-label="Navegação no celular">
          {[
            ...links.slice(0, 3),
            { to: "/perfil", label: "Perfil", icon: UserRound },
          ].map(({ to, label, icon: Icon }) => (
            <NavLink end={to === "/"} to={to} key={to}>
              <Icon size={21} />
              <span>
                {label === "Visão geral"
                  ? "Início"
                  : label === "Hábitos & metas"
                    ? "Hábitos"
                    : label}
              </span>
            </NavLink>
          ))}
        </nav>
      </div>
      {record && <ActivityEditor close={() => setRecord(false)} />}
      {menu && (
        <Modal title="Nosso espaço" close={() => setMenu(false)}>
          <nav className="mobile-menu" aria-label="Todos os módulos">
            {links.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                onClick={() => setMenu(false)}
              >
                <Icon size={20} />
                {label}
              </NavLink>
            ))}
          </nav>
        </Modal>
      )}
    </HashRouter>
  );
}

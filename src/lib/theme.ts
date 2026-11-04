export type Theme = "light" | "dark";

const KEY = "theme";

export function storedTheme(): Theme {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    /* storage unavailable */
  }
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

/** Applies the theme to <html> right away, with a short color cross-fade. */
export function applyTheme(theme: Theme, animate = false) {
  const root = document.documentElement;
  if (root.dataset.theme === theme) return;
  if (animate) {
    root.classList.add("theme-anim");
    window.setTimeout(() => root.classList.remove("theme-anim"), 500);
  }
  root.dataset.theme = theme;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", theme === "dark" ? "#0f1a17" : "#f4f6f1");
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    /* storage unavailable */
  }
}

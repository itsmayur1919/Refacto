export type ThemePreference = "light" | "dark" | "auto";

let activeMediaQueryListener: ((e: MediaQueryListEvent) => void) | null = null;
let mediaQuery: MediaQueryList | null = null;

export function getStoredThemePreference(): ThemePreference {
  if (typeof window === "undefined") return "auto";
  const stored = localStorage.getItem("theme_preference") as ThemePreference;
  if (stored === "light" || stored === "dark" || stored === "auto") {
    return stored;
  }
  return "auto";
}

export function applyTheme(preference: ThemePreference) {
  if (typeof window === "undefined") return;

  const root = document.documentElement;

  // Clean up previous listener if any
  if (mediaQuery && activeMediaQueryListener) {
    mediaQuery.removeEventListener("change", activeMediaQueryListener);
    activeMediaQueryListener = null;
    mediaQuery = null;
  }

  const setDark = (isDark: boolean) => {
    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  };

  if (preference === "dark") {
    setDark(true);
  } else if (preference === "light") {
    setDark(false);
  } else {
    mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    setDark(mediaQuery.matches);

    activeMediaQueryListener = (e: MediaQueryListEvent) => {
      setDark(e.matches);
    };

    mediaQuery.addEventListener("change", activeMediaQueryListener);
  }

  try {
    localStorage.setItem("theme_preference", preference);
    window.dispatchEvent(new Event("theme-changed"));
  } catch {}
}


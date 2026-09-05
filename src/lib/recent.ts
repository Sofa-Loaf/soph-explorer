const KEY = "soph-explorer-recent";
const MAX = 6;

export function loadRecent(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === "string").slice(0, MAX);
  } catch {
    return [];
  }
}

export function rememberFolder(path: string): string[] {
  const next = [path, ...loadRecent().filter((p) => p !== path)].slice(0, MAX);
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export function loadTheme(): "light" | "dark" {
  return localStorage.getItem("soph-explorer-theme") === "dark" ? "dark" : "light";
}

export function saveTheme(theme: "light" | "dark"): void {
  localStorage.setItem("soph-explorer-theme", theme);
}

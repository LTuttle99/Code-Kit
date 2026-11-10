import type { Project } from "./types";
import { languages, snippets } from "./registry";
export interface State {
  version: 1;
  projects: Project[];
  favorites: string[];
  recent: string[];
  theme: string;
  fontSize: number;
  activeId?: string;
}
export const fresh = (): State => ({
  version: 1,
  projects: [],
  favorites: [],
  recent: [],
  theme: "dark",
  fontSize: 13,
});
export function loadState(raw: string | null): State {
  if (!raw) return fresh();
  try {
    const s = JSON.parse(raw);
    if (s.version !== 1) return fresh();
    return {
      ...fresh(),
      projects: Array.isArray(s.projects)
        ? s.projects.filter(
            (p: Project) =>
              p &&
              typeof p.id === "string" &&
              typeof p.name === "string" &&
              languages.some((l) => l.name === p.language) &&
              Array.isArray(p.blocks) &&
              p.blocks.every(
                (b) =>
                  b &&
                  typeof b.id === "string" &&
                  snippets.some(
                    (s) => s.id === b.snippetId && s.language === p.language,
                  ) &&
                  b.values &&
                  typeof b.values === "object" &&
                  Object.values(b.values).every((v) => typeof v === "string"),
              ) &&
              Array.isArray(p.files) &&
              p.files.length > 0 &&
              p.files.every(
                (f) =>
                  f &&
                  typeof f.name === "string" &&
                  /^[\w.-]+$/.test(f.name) &&
                  !f.name.startsWith(".") &&
                  typeof f.code === "string" &&
                  typeof f.id === "string",
              ),
          )
        : [],
      favorites: Array.isArray(s.favorites)
        ? s.favorites.filter(
            (id: unknown) =>
              typeof id === "string" && snippets.some((s) => s.id === id),
          )
        : [],
      recent: Array.isArray(s.recent)
        ? s.recent
            .filter(
              (id: unknown) =>
                typeof id === "string" && snippets.some((s) => s.id === id),
            )
            .slice(0, 12)
        : [],
      theme: s.theme === "light" ? "light" : "dark",
      fontSize:
        typeof s.fontSize === "number"
          ? Math.max(11, Math.min(s.fontSize, 22))
          : 13,
      activeId: typeof s.activeId === "string" ? s.activeId : undefined,
    };
  } catch {
    return fresh();
  }
}
export function persist(state: State) {
  localStorage.setItem("codekit:v1", JSON.stringify(state));
}

export const toggleFavorite = (favorites: string[], id: string) =>
  favorites.includes(id)
    ? favorites.filter((x) => x !== id)
    : [...favorites, id];

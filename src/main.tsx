import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import {
  LayoutDashboard,
  Code2,
  Blocks,
  Library,
  Folder,
  BookOpen,
  Search,
  ArrowUpRight,
  ArrowRight,
  Plus,
  ChevronRight,
  ChevronDown,
  Star,
  Clock,
  Command,
  Copy,
  Check,
  Download,
  Play,
  Trash2,
  X,
  Sun,
  Moon,
  Settings2,
  Maximize2,
  Minimize2,
  ArrowUp,
  ArrowDown,
  FileCode2,
  Terminal,
  PanelLeft,
  RotateCcw,
  Info,
  ExternalLink,
  GitCompareArrows,
  Save,
  Braces,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import CodeMirror from "@uiw/react-codemirror";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { java } from "@codemirror/lang-java";
import { cpp } from "@codemirror/lang-cpp";
import { sql } from "@codemirror/lang-sql";
import { projectArchive } from "./export";
import { runSQLite, resetSQLite } from "./sql-client";
import { languages, snippets, searchSnippets, starters } from "./registry";
import {
  compose,
  uid,
  defaults,
  validate,
  renderSnippet,
  compatible,
  createProject,
  download,
  safeFilename,
  schema,
} from "./engine";
import { loadState, persist, toggleFavorite } from "./storage";
import type { Language, Snippet, Project, Block } from "./types";
import { guides } from "./guides";
import "./style.css";
const nav = [
  { name: "Dashboard", icon: LayoutDashboard },
  { name: "Languages", icon: Code2 },
  { name: "Code Builder", icon: Blocks },
  { name: "Snippet Library", icon: Library },
  { name: "My Projects", icon: Folder },
  { name: "Quick Reference", icon: BookOpen },
];
function extensions(language: Language) {
  return [
    language === "HTML"
      ? html()
      : language === "CSS"
        ? css()
        : language === "Python"
          ? python()
          : language === "Java"
            ? java()
            : language === "C" || language === "C++"
              ? cpp()
              : language === "SQL"
                ? sql()
                : javascript({ typescript: language === "TypeScript" }),
  ];
}
function App() {
  const [state, setState] = useState(() => {
    try {
      return loadState(localStorage.getItem("codekit:v1"));
    } catch {
      return loadState(null);
    }
  });
  const [page, setPage] = useState("Dashboard");
  const [lang, setLang] = useState<Language>("HTML");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All languages");
  const [level, setLevel] = useState("All levels");
  const [category, setCategory] = useState("All categories");
  const [tab, setTab] = useState("All snippets");
  const [selected, setSelected] = useState<Snippet | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [toast, setToast] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [globalQuery, setGlobalQuery] = useState("");
  const [explain, setExplain] = useState(false);
  const [advanced, setAdvanced] = useState(false);
  const [preview, setPreview] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [full, setFull] = useState(false);
  const [fileId, setFileId] = useState("main");
  const [mobile, setMobile] = useState(false);
  const [compare, setCompare] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [results, setResults] = useState<
    { columns: string[]; values: unknown[][] }[]
  >([]);
  const [sqlError, setSqlError] = useState("");
  const [sqlBusy, setSqlBusy] = useState(false);
  const [showSchema, setShowSchema] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [storageError, setStorageError] = useState("");
  const [dialog, setDialog] = useState<{
    title: string;
    label: string;
    value: string;
    action: (v: string) => void;
  } | null>(null);
  const [confirm, setConfirm] = useState<{
    title: string;
    message: string;
    action: () => void;
  } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notify = (message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 3500);
  };
  useEffect(() => {
    try {
      persist(state);
      setStorageError("");
    } catch {
      setStorageError(
        "Your browser could not save changes. Export your project to keep a copy.",
      );
    }
    document.documentElement.dataset.theme = state.theme;
  }, [state]);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((o) => !o);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
        setSelected(null);
        setFull(false);
        setCompareOpen(false);
        setGuideOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  useEffect(() => {
    const open =
      !!selected ||
      searchOpen ||
      !!dialog ||
      !!confirm ||
      compareOpen ||
      guideOpen;
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const modal = document.querySelector(".modal") as HTMLElement | null;
    const focusable = () =>
      Array.from(
        modal?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), input:not(:disabled), textarea, select, [tabindex="0"]',
        ) || [],
      );
    const nodes = focusable();
    if (!modal?.contains(document.activeElement) && nodes.length)
      nodes[0].focus();
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        const items = focusable();
        const first = items[0],
          last = items.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handler);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", handler);
      previous?.focus();
    };
  }, [!!selected, searchOpen, !!dialog, !!confirm, compareOpen, guideOpen]);
  const active = state.projects.find((p) => p.id === state.activeId);
  const projectInvalid = !!active?.blocks.some((b) => {
    const s = snippets.find((s) => s.id === b.snippetId);
    return !s || Object.keys(validate(s, b.values)).length > 0;
  });
  const meta = languages.find((l) => l.name === (active?.language || lang))!;
  const generated = active
    ? (() => {
        try {
          return compose(active.language, active.blocks, active.dialect);
        } catch {
          return "// Correct invalid fields in the workspace to generate code.";
        }
      })()
    : starters[lang];
  const currentFile =
    active?.files.find((f) => f.id === fileId) || active?.files[0];
  const code = currentFile?.manual
    ? currentFile.code
    : currentFile?.code || (currentFile?.id === "main" ? generated : "");
  const go = (name: string) => {
    setPage(name);
    setMobile(false);
    setQuery("");
    setCategory("All categories");
  };
  const updateProject = (fn: (p: Project) => Project) => {
    setState((s) => ({
      ...s,
      projects: s.projects.map((p) =>
        p.id === s.activeId
          ? { ...fn(p), updated: new Date().toISOString() }
          : p,
      ),
    }));
  };
  const start = (language: Language, name?: string) => {
    const p = createProject(language, name);
    setState((s) => ({ ...s, projects: [p, ...s.projects], activeId: p.id }));
    setLang(language);
    setFileId("main");
    setResults([]);
    setPreview(false);
    go("Code Builder");
    notify("Project created. Start adding code blocks.");
  };
  const openSnippet = (s: Snippet) => {
    setSelected(s);
    setValues(defaults(s));
    setExplain(false);
    setState((st) => ({
      ...st,
      recent: [s.id, ...st.recent.filter((id) => id !== s.id)].slice(0, 12),
    }));
  };
  const favorite = (id: string) =>
    setState((s) => ({ ...s, favorites: toggleFavorite(s.favorites, id) }));
  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      notify("Code copied to clipboard");
    } catch {
      notify("Clipboard unavailable. Select the code and copy it manually.");
    }
  };
  const addBlock = (s: Snippet, v = defaults(s)) => {
    const errors = validate(s, v);
    if (Object.keys(errors).length) {
      notify("Correct the fields before adding this snippet.");
      return;
    }
    let p = active;
    if (!p || p.language !== s.language) {
      p = createProject(s.language);
      p.blocks = [{ id: uid(), snippetId: s.id, values: v }];
      const next = p;
      setState((st) => ({
        ...st,
        projects: [next, ...st.projects],
        activeId: next.id,
      }));
    } else {
      const reason = compatible(s, p.blocks);
      if (reason) {
        notify(reason);
        return;
      }
      if (p.files[0].manual) {
        notify("Reset the main file to generated code before adding blocks.");
        return;
      }
      updateProject((p) => ({
        ...p,
        blocks: [...p.blocks, { id: uid(), snippetId: s.id, values: v }],
      }));
    }
    setSelected(null);
    setLang(s.language);
    setFileId("main");
    go("Code Builder");
    notify("Snippet added to your project");
  };
  const exportProject = async (p: Project) => {
    try {
      const zip = await projectArchive(p);
      download(
        await zip.generateAsync({ type: "blob" }),
        p.name.replace(/[^\w-]/g, "-") + ".zip",
      );
      notify("Project exported as ZIP");
    } catch {
      notify("Could not export. Check your project fields.");
    }
  };
  const runSQL = async () => {
    if (active?.dialect !== "SQLite") {
      notify(
        "Execution is available for SQLite. Other dialects can be exported for local use.",
      );
      return;
    }
    setSqlBusy(true);
    setSqlError("");
    try {
      setResults(await runSQLite(code));
      notify("Query executed in local SQLite");
    } catch (e) {
      setSqlError(String(e));
    } finally {
      setSqlBusy(false);
    }
  };
  const card = (s: Snippet, compact = false) => (
    <article
      className={"snippet-card " + (compact ? "compact" : "")}
      key={s.id}
    >
      <div className="snippet-top">
        <span
          className="language-label"
          style={{ color: languages.find((l) => l.name === s.language)?.color }}
        >
          {s.language}
        </span>
        <button
          className={
            "icon-button " +
            (state.favorites.includes(s.id) ? "is-favorite" : "")
          }
          aria-label={"Favorite " + s.title}
          onClick={() => favorite(s.id)}
        >
          <Star
            size={15}
            fill={state.favorites.includes(s.id) ? "currentColor" : "none"}
          />
        </button>
      </div>
      <button className="snippet-title" onClick={() => openSnippet(s)}>
        {s.title}
        <ArrowUpRight size={16} />
      </button>
      <p>{s.description}</p>
      {!compact && (
        <pre onClick={() => openSnippet(s)}>
          {renderSnippet(s).split("\n").slice(0, 4).join("\n")}
        </pre>
      )}
      <div className="snippet-bottom">
        <span>
          <i className={"level-dot " + s.difficulty.toLowerCase()} />
          {s.difficulty}
        </span>
        <div>
          <button
            className="icon-button"
            title="Compare snippet"
            aria-label={"Compare " + s.title}
            onClick={() => {
              setCompare((c) =>
                c.includes(s.id)
                  ? c.filter((id) => id !== s.id)
                  : [...c.slice(-1), s.id],
              );
              notify("Select two snippets, then open Compare.");
            }}
          >
            <GitCompareArrows size={14} />
          </button>
          <button
            className="icon-button"
            aria-label={"Copy " + s.title}
            onClick={() => copy(renderSnippet(s))}
          >
            <Copy size={14} />
          </button>
        </div>
      </div>
    </article>
  );
  const filtered = searchSnippets(
    query,
    page === "Languages" ? lang : filter,
    level,
    category,
  ).filter((s) => tab !== "Favorites" || state.favorites.includes(s.id));
  const previewSource = () => {
    if (!active) return "";
    let source =
      active.language === "HTML"
        ? code
        : '<!DOCTYPE html><html><head></head><body><h1>Hello, world!</h1><p>A preview of your code.</p><button type="button">Click me</button></body></html>';
    if (active.language === "CSS")
      source = source.replace(
        "</head>",
        "<style>" + code.replace(/<\/style/gi, "<\\/style") + "</style></head>",
      );
    if (active.language === "JavaScript")
      source = source.replace(
        "</body>",
        '<script type="module">' +
          code.replace(/<\/script/gi, "<\\/script") +
          "</script></body>",
      );
    if (active.language === "HTML") {
      for (const f of active.files.filter((f) => f.id !== "main")) {
        if (f.name.endsWith(".css"))
          source = source.replace(
            new RegExp(
              "<link[^>]+href=[\"']" +
                f.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") +
                "[\"'][^>]*>",
              "g",
            ),
            "<style>" + f.code.replace(/<\/style/gi, "<\\/style") + "</style>",
          );
        if (/\.(js|mjs)$/.test(f.name))
          source = source.replace(
            new RegExp(
              "<script[^>]+src=[\"']" +
                f.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") +
                "[\"'][^>]*>\\s*</script>",
              "g",
            ),
            '<script type="module">' +
              f.code.replace(/<\/script/gi, "<\\/script") +
              "</script>",
          );
      }
    }
    return (
      "<meta http-equiv=\"Content-Security-Policy\" content=\"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src https: data:; font-src https:; connect-src 'none'; form-action 'none'; base-uri 'none'\">" +
      source
    );
  };
  return (
    <div className="app-shell">
      <aside className={"sidebar " + (mobile ? "mobile-open" : "")}>
        <button className="brand" onClick={() => go("Dashboard")}>
          <span className="brand-icon">
            <Code2 size={23} />
          </span>
          codekit<span className="brand-dot">.</span>
        </button>
        <div className="workspace-label">YOUR WORKSPACE</div>
        <nav>
          {nav.map((n) => (
            <button
              key={n.name}
              className={"nav-item " + (page === n.name ? "active" : "")}
              onClick={() => go(n.name)}
            >
              <n.icon size={18} />
              {n.name}
              {n.name === "Code Builder" && (
                <span className="new-badge">NEW</span>
              )}
              {n.name === "My Projects" && (
                <span className="nav-count">{state.projects.length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-divider" />
        <div className="workspace-label flex-label">
          YOUR COLLECTION
          <button
            className="icon-button"
            title="View favorites"
            onClick={() => {
              go("Snippet Library");
              setTab("Favorites");
            }}
          >
            <Plus size={14} />
          </button>
        </div>
        <button
          className="nav-item"
          onClick={() => {
            go("Snippet Library");
            setTab("Favorites");
          }}
        >
          <Star size={17} />
          Favorites<span className="nav-count">{state.favorites.length}</span>
        </button>
        <button
          className="nav-item"
          onClick={() => {
            go("Snippet Library");
            setTab("Recently viewed");
          }}
        >
          <Clock size={17} />
          Recently viewed
        </button>
        <div className="sidebar-bottom">
          <div className="little-tip">
            <div>
              <Sparkles size={16} />
              <strong>A little help, a lot of possibility.</strong>
            </div>
            <p>You don't have to memorize it all. Just know where to start.</p>
            <button onClick={() => go("Quick Reference")}>
              Explore the quick reference <ArrowUpRight size={14} />
            </button>
          </div>
          <button
            className="profile-button"
            onClick={() => {
              setState((s) => ({
                ...s,
                theme: s.theme === "dark" ? "light" : "dark",
              }));
            }}
          >
            <span className="avatar">Y</span>
            <span>
              Your workspace<small>Saved on this device</small>
            </span>
            {state.theme === "dark" ? <Moon size={16} /> : <Sun size={16} />}
          </button>
        </div>
      </aside>
      <main className={"main " + (full ? "fullscreen" : "")}>
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button mobile-menu"
              onClick={() => setMobile(!mobile)}
              aria-label="Toggle navigation"
            >
              <PanelLeft size={20} />
            </button>
            <span>Workspace</span>
            <ChevronRight size={13} />
            <strong>{page}</strong>
          </div>
          <div className="top-actions">
            <button
              className="global-search"
              aria-label="Search anything"
              onClick={() => setSearchOpen(true)}
            >
              <Search size={15} />
              <span>Search anything...</span>
              <kbd>⌘ K</kbd>
            </button>
            <span className="local-status">
              <i />
              All changes local
            </span>
            <button
              className="icon-button"
              aria-label="Toggle color theme"
              onClick={() =>
                setState((s) => ({
                  ...s,
                  theme: s.theme === "dark" ? "light" : "dark",
                }))
              }
            >
              {state.theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
            </button>
          </div>
        </header>
        {storageError && <div className="warning">{storageError}</div>}
        {page === "Dashboard" && (
          <div className="page dashboard">
            <div className="page-heading">
              <div>
                <div className="eyebrow">
                  <span />
                  YOUR NEXT IDEA STARTS HERE
                </div>
                <h1>
                  Less remembering.
                  <br />
                  More <em>building.</em>
                </h1>
                <p>
                  Your go-to coding companion. Find the syntax, make it yours,
                  <br className="desktop-break" /> and bring your next idea to
                  life.
                </p>
                <div className="hero-actions">
                  <button className="primary" onClick={() => start("HTML")}>
                    <Blocks size={16} />
                    Open Code Builder
                    <ArrowRight size={16} />
                  </button>
                  <button
                    className="text-button"
                    onClick={() => go("Snippet Library")}
                  >
                    Explore snippets
                    <ArrowUpRight size={16} />
                  </button>
                </div>
              </div>
              <div className="hero-code" aria-label="CodeKit code illustration">
                <div className="code-window-bar">
                  <div className="window-dots">
                    <i />
                    <i />
                    <i />
                  </div>
                  <span>your-next-idea.html</span>
                  <Code2 size={14} />
                </div>
                <div className="hero-code-body">
                  <div className="line-numbers">
                    1<br />2<br />3<br />4<br />5<br />6<br />7<br />8<br />9
                  </div>
                  <pre>
                    <span className="code-muted">&lt;!DOCTYPE html&gt;</span>
                    {"\n"}
                    <span className="code-pink">&lt;html</span>{" "}
                    <span className="code-lilac">lang</span>=
                    <span className="code-green">"en"</span>
                    <span className="code-pink">&gt;</span>
                    {"\n  "}
                    <span className="code-pink">&lt;body&gt;</span>
                    {"\n    "}
                    <span className="code-muted">
                      &lt;!-- Big ideas start small. --&gt;
                    </span>
                    {"\n    "}
                    <span className="code-pink">&lt;h1&gt;</span>Hello, world.
                    <span className="code-pink">&lt;/h1&gt;</span>
                    {"\n    "}
                    <span className="code-pink">&lt;p&gt;</span>Let's build
                    something.<span className="code-pink">&lt;/p&gt;</span>
                    {"\n  "}
                    <span className="code-pink">&lt;/body&gt;</span>
                    {"\n"}
                    <span className="code-pink">&lt;/html&gt;</span>
                    {"\n"}
                    <span className="code-cursor">▌</span>
                  </pre>
                </div>
                <span className="floating-chip">
                  <CheckCircle2 size={15} />
                  You've got this.
                </span>
              </div>
            </div>
            <div className="stats-strip">
              <div>
                <span className="stat-icon">
                  <Code2 size={18} />
                </span>
                <strong>10</strong>
                <span>languages, one place</span>
              </div>
              <div>
                <span className="stat-icon">
                  <Braces size={18} />
                </span>
                <strong>270</strong>
                <span>ready-to-use snippets</span>
              </div>
              <div>
                <span className="stat-icon">
                  <Blocks size={18} />
                </span>
                <strong>Endless</strong>
                <span>ways to build</span>
              </div>
              <div className="private-stat">
                <span className="status-dot" />
                No account. Just code.
              </div>
            </div>
            <section>
              <div className="section-header">
                <div>
                  <h2>
                    Pick a language
                    <span className="small-caption">
                      A good place to start.
                    </span>
                  </h2>
                </div>
                <button className="text-button" onClick={() => go("Languages")}>
                  View all languages
                  <ArrowRight size={15} />
                </button>
              </div>
              <div className="language-grid">
                {languages.map((l) => (
                  <button
                    key={l.name}
                    className="language-card"
                    onClick={() => {
                      setLang(l.name);
                      go("Languages");
                    }}
                  >
                    <div className="language-card-top">
                      <span
                        className="language-symbol"
                        style={{
                          color: l.color,
                          background: l.color + "12",
                          borderColor: l.color + "25",
                        }}
                      >
                        {l.symbol}
                      </span>
                      <ArrowUpRight size={17} />
                    </div>
                    <h3>{l.name}</h3>
                    <p>{l.description}</p>
                    <span className="language-card-foot">
                      27 snippets
                      <span>
                        Explore
                        <ChevronRight size={13} />
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </section>
            {(state.projects.length > 0 || state.favorites.length > 0) && (
              <section className="dashboard-saved">
                <div className="section-header">
                  <h2>Your workspace, ready to resume</h2>
                  <button
                    className="text-button"
                    onClick={() => go("My Projects")}
                  >
                    All projects
                    <ArrowRight size={14} />
                  </button>
                </div>
                <div className="resume-grid">
                  {state.projects.slice(0, 3).map((p) => (
                    <button
                      key={p.id}
                      className="resume-project"
                      onClick={() => {
                        setState((s) => ({ ...s, activeId: p.id }));
                        setFileId("main");
                        go("Code Builder");
                      }}
                    >
                      <Folder size={18} />
                      <span>
                        {p.name}
                        <small>
                          {p.language} · {p.blocks.length} blocks
                        </small>
                      </span>
                      <ArrowUpRight size={15} />
                    </button>
                  ))}
                  {state.favorites.length > 0 && (
                    <button
                      className="resume-project"
                      onClick={() => {
                        go("Snippet Library");
                        setTab("Favorites");
                      }}
                    >
                      <Star size={18} />
                      <span>
                        Your favorites
                        <small>{state.favorites.length} saved snippets</small>
                      </span>
                      <ArrowUpRight size={15} />
                    </button>
                  )}
                </div>
              </section>
            )}
            <div className="dashboard-lower">
              <section>
                <div className="section-header">
                  <h2>
                    {state.recent.length
                      ? "Pick up where you left off"
                      : "A few useful starting points"}
                  </h2>
                  <button
                    className="text-button"
                    onClick={() => go("Snippet Library")}
                  >
                    View library
                    <ArrowRight size={14} />
                  </button>
                </div>
                <div className="small-snippets">
                  {(state.recent.length
                    ? state.recent
                        .slice(0, 3)
                        .map((id) => snippets.find((s) => s.id === id)!)
                    : [snippets[2], snippets[33], snippets[58]]
                  ).map((s) => card(s, true))}
                </div>
              </section>
              <section className="starter-callout">
                <span className="outline-icon">
                  <Folder size={20} />
                </span>
                <div>
                  <h3>From blank page to first project.</h3>
                  <p>
                    Start with a solid foundation.
                    <br />
                    Make the rest your own.
                  </p>
                  <button
                    className="text-button pink"
                    onClick={() => start("HTML")}
                  >
                    Start a website
                    <ArrowRight size={15} />
                  </button>
                </div>
              </section>
            </div>
            <footer className="page-footer">
              <span>
                <Code2 size={15} />
                Made for the moments syntax slips your mind.
              </span>
              <span>Build with confidence.</span>
            </footer>
          </div>
        )}
        {(page === "Languages" || page === "Snippet Library") && (
          <div className="page">
            <div className="title-row">
              <div>
                <div className="eyebrow">
                  {page === "Languages"
                    ? "LEARN ONE BLOCK AT A TIME"
                    : "YOUR SYNTAX, WITHIN REACH"}
                </div>
                <h1>
                  {page === "Languages" ? (
                    <>
                      <span
                        style={{
                          color: languages.find((l) => l.name === lang)?.color,
                        }}
                      >
                        {lang}
                      </span>{" "}
                      reference
                    </>
                  ) : (
                    "The snippet library"
                  )}
                </h1>
                <p>
                  {page === "Languages"
                    ? languages.find((l) => l.name === lang)?.structure
                    : "Find the right code. Understand it. Make it yours."}
                </p>
              </div>
              <button
                className="secondary"
                onClick={() => setCompareOpen(true)}
                disabled={compare.length !== 2}
              >
                <GitCompareArrows size={16} />
                Compare ({compare.length}/2)
              </button>
            </div>
            {page === "Languages" && (
              <>
                <div className="language-tabs">
                  {languages.map((l) => (
                    <button
                      className={lang === l.name ? "selected" : ""}
                      key={l.name}
                      onClick={() => {
                        setLang(l.name);
                        setCategory("All categories");
                      }}
                    >
                      {l.name}
                    </button>
                  ))}
                </div>
                <div className="getting-started">
                  <div>
                    <span className="tag">START HERE</span>
                    <h2>{languages.find((l) => l.name === lang)?.start}</h2>
                    <p>
                      A complete starting structure, ready for your first idea.
                    </p>
                    <code>
                      {languages.find((l) => l.name === lang)?.command}
                    </code>
                  </div>
                  <div className="starter-buttons">
                    <button className="primary" onClick={() => start(lang)}>
                      <Plus size={16} />
                      Use starter template
                    </button>
                    <button
                      className="secondary"
                      onClick={() => setGuideOpen(true)}
                    >
                      View & copy starter
                    </button>
                  </div>
                </div>
              </>
            )}
            <div className="tabs">
              <button
                className={tab === "All snippets" ? "selected" : ""}
                onClick={() => setTab("All snippets")}
              >
                All snippets <span>{page === "Languages" ? 27 : 270}</span>
              </button>
              <button
                className={tab === "Favorites" ? "selected" : ""}
                onClick={() => setTab("Favorites")}
              >
                <Star size={14} />
                Favorites
              </button>
              <button
                className={tab === "Recently viewed" ? "selected" : ""}
                onClick={() => setTab("Recently viewed")}
              >
                <Clock size={14} />
                Recently viewed
              </button>
            </div>
            <div className="filter-bar">
              <div className="search-input">
                <Search size={17} />
                <input
                  aria-label="Search snippets"
                  placeholder={
                    "Search " +
                    (page === "Languages" ? lang + " " : "") +
                    "snippets, topics, or ideas..."
                  }
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              {page !== "Languages" && (
                <select
                  aria-label="Filter language"
                  value={filter}
                  onChange={(e) => {
                    setFilter(e.target.value);
                    setCategory("All categories");
                  }}
                >
                  <option>All languages</option>
                  {languages.map((l) => (
                    <option key={l.name}>{l.name}</option>
                  ))}
                </select>
              )}
              <select
                aria-label="Filter difficulty"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
              >
                {["All levels", "Beginner", "Intermediate", "Advanced"].map(
                  (l) => (
                    <option key={l}>{l}</option>
                  ),
                )}
              </select>
              <select
                aria-label="Filter category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option>All categories</option>
                {[
                  ...new Set(
                    snippets
                      .filter((s) =>
                        page === "Languages"
                          ? s.language === lang
                          : filter === "All languages" || s.language === filter,
                      )
                      .map((s) => s.category),
                  ),
                ].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <p className="results-label">
              {
                filtered.filter(
                  (s) =>
                    tab !== "Recently viewed" || state.recent.includes(s.id),
                ).length
              }{" "}
              snippets · ready to make your own
            </p>
            <div className="snippet-grid">
              {filtered
                .filter(
                  (s) =>
                    tab !== "Recently viewed" || state.recent.includes(s.id),
                )
                .map((s) => card(s))}
            </div>
            {!filtered.filter(
              (s) => tab !== "Recently viewed" || state.recent.includes(s.id),
            ).length && (
              <div className="empty">
                <Search size={28} />
                <h2>Nothing here just yet.</h2>
                <p>Try a different search or explore another language.</p>
                <button
                  className="secondary"
                  onClick={() => {
                    setQuery("");
                    setFilter("All languages");
                    setCategory("All categories");
                    setLevel("All levels");
                    setTab("All snippets");
                  }}
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        )}
        {page === "Code Builder" && (
          <div className="builder-page">
            <div className="builder-heading">
              <div>
                <div className="eyebrow">SMALL BLOCKS. BIG POSSIBILITIES.</div>
                <h1>Code Builder</h1>
                <p>Start with the structure. Build one idea at a time.</p>
              </div>
              <div className="builder-header-actions">
                <select
                  aria-label="Builder language"
                  value={active?.language || lang}
                  onChange={(e) => start(e.target.value as Language)}
                >
                  {languages.map((l) => (
                    <option key={l.name}>{l.name}</option>
                  ))}
                </select>
                <button
                  className="primary"
                  onClick={() =>
                    active
                      ? projectInvalid
                        ? notify("Correct invalid fields before exporting.")
                        : exportProject(active)
                      : start(lang)
                  }
                >
                  {active ? <Download size={16} /> : <Plus size={16} />}
                  {active ? "Export project" : "Create project"}
                </button>
              </div>
            </div>
            {!active ? (
              <div className="empty">
                <Blocks size={36} />
                <h2>What will you build?</h2>
                <p>
                  Choose a language above and start with a complete, valid
                  template.
                </p>
                <button className="primary" onClick={() => start(lang)}>
                  Start {lang} project
                  <ArrowRight size={16} />
                </button>
              </div>
            ) : (
              <>
                <div className="project-toolbar">
                  <div>
                    <Folder size={16} />
                    <button
                      onClick={() =>
                        setDialog({
                          title: "Rename project",
                          label: "Project name",
                          value: active.name,
                          action: (v) => {
                            if (v.trim()) {
                              updateProject((p) => ({ ...p, name: v.trim() }));
                              setDialog(null);
                            }
                          },
                        })
                      }
                    >
                      {active.name}
                    </button>
                    <span className="tag">{active.language}</span>
                  </div>
                  <div className="project-save-status">
                    <span>
                      <span className="status-dot" />
                      Autosaved on this device
                    </span>
                    <button
                      className="icon-button"
                      aria-label="Reset project to starter"
                      title="Reset project to starter"
                      onClick={() =>
                        setConfirm({
                          title: "Reset project to starter?",
                          message:
                            "All blocks, extra files, and manual edits in this project will be removed.",
                          action: () => {
                            updateProject((p) => ({
                              ...createProject(p.language, p.name),
                              id: p.id,
                            }));
                            setFileId("main");
                            setPreview(false);
                            notify("Project reset to its starter template");
                          },
                        })
                      }
                    >
                      <RotateCcw size={14} />
                    </button>
                  </div>
                </div>
                <div className="builder-grid">
                  <section className="component-panel">
                    <div className="panel-heading">
                      <h3>Add a block</h3>
                      <span>
                        {
                          snippets.filter((s) => s.language === active.language)
                            .length
                        }
                      </span>
                    </div>
                    <div className="search-input">
                      <Search size={15} />
                      <input
                        aria-label="Search builder blocks"
                        placeholder="Find a component..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                      />
                    </div>
                    <div className="component-list">
                      {searchSnippets(query, active.language).map((s) => (
                        <div key={s.id} className="component-item">
                          <button onClick={() => openSnippet(s)}>
                            <span>{s.title}</span>
                            <small>{s.category}</small>
                          </button>
                          <button
                            className="icon-button"
                            aria-label={"Add " + s.title}
                            title={
                              compatible(s, active.blocks) || "Add to project"
                            }
                            disabled={
                              !!compatible(s, active.blocks) ||
                              !!active.files[0].manual
                            }
                            onClick={() => addBlock(s)}
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </section>
                  <section className="workspace-panel">
                    <div className="panel-heading">
                      <h3>Your workspace</h3>
                      <span>{active.blocks.length} blocks</span>
                    </div>
                    <div className="workspace-scroll">
                      <div className="structure-note">
                        <Info size={16} />
                        <p>{meta.structure}</p>
                      </div>
                      {active.files[0].manual && (
                        <div className="warning">
                          Main file has manual edits. Reset it to resume block
                          composition.
                        </div>
                      )}
                      {!active.blocks.length && (
                        <div className="block-empty">
                          <span>
                            <Blocks size={25} />
                          </span>
                          <h3>Your foundation is ready.</h3>
                          <p>
                            Add a block from the left.
                            <br />
                            Your code takes shape on the right.
                          </p>
                        </div>
                      )}
                      {active.blocks.map((b, index) => {
                        const s = snippets.find((s) => s.id === b.snippetId)!;
                        const errors = validate(s, b.values);
                        return (
                          <article className="workspace-block" key={b.id}>
                            <div className="block-header">
                              <span className="block-number">
                                {String(index + 1).padStart(2, "0")}
                              </span>
                              <h3>{s.title}</h3>
                              <div>
                                <button
                                  className="icon-button"
                                  disabled={index === 0}
                                  aria-label={"Move " + s.title + " up"}
                                  onClick={() =>
                                    updateProject((p) => {
                                      const bs = [...p.blocks];
                                      [bs[index - 1], bs[index]] = [
                                        bs[index],
                                        bs[index - 1],
                                      ];
                                      return { ...p, blocks: bs };
                                    })
                                  }
                                >
                                  <ArrowUp size={13} />
                                </button>
                                <button
                                  className="icon-button"
                                  disabled={index === active.blocks.length - 1}
                                  aria-label={"Move " + s.title + " down"}
                                  onClick={() =>
                                    updateProject((p) => {
                                      const bs = [...p.blocks];
                                      [bs[index], bs[index + 1]] = [
                                        bs[index + 1],
                                        bs[index],
                                      ];
                                      return { ...p, blocks: bs };
                                    })
                                  }
                                >
                                  <ArrowDown size={13} />
                                </button>
                                <button
                                  className="icon-button"
                                  aria-label={"Remove " + s.title}
                                  onClick={() =>
                                    updateProject((p) => ({
                                      ...p,
                                      blocks: p.blocks.filter(
                                        (x) => x.id !== b.id,
                                      ),
                                    }))
                                  }
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            </div>
                            <p>{s.description}</p>
                            {s.fields.map((f) => (
                              <label className="field" key={f.key}>
                                {f.label}
                                <input
                                  value={b.values[f.key] ?? f.value}
                                  aria-invalid={!!errors[f.key]}
                                  onChange={(e) =>
                                    updateProject((p) => ({
                                      ...p,
                                      blocks: p.blocks.map((x) =>
                                        x.id === b.id
                                          ? {
                                              ...x,
                                              values: {
                                                ...x.values,
                                                [f.key]: e.target.value,
                                              },
                                            }
                                          : x,
                                      ),
                                    }))
                                  }
                                />
                                {errors[f.key] && (
                                  <small className="error">
                                    {errors[f.key]}
                                  </small>
                                )}
                              </label>
                            ))}
                            <button
                              className="learn-link"
                              onClick={() => openSnippet(s)}
                            >
                              <BookOpen size={13} />
                              Understand this block
                              <ArrowUpRight size={12} />
                            </button>
                          </article>
                        );
                      })}
                      <div className="run-instructions">
                        <Terminal size={15} />
                        <div>
                          <strong>Run it locally</strong>
                          <code>{meta.command}</code>
                        </div>
                      </div>
                    </div>
                  </section>
                  <section className="editor-panel">
                    <div className="panel-heading">
                      <h3>
                        <Code2 size={16} />
                        Generated code
                      </h3>
                      <div className="editor-actions">
                        <button
                          className="icon-button"
                          title="Decrease editor font"
                          onClick={() =>
                            setState((s) => ({
                              ...s,
                              fontSize: Math.max(11, s.fontSize - 1),
                            }))
                          }
                        >
                          A−
                        </button>
                        <button
                          className="icon-button"
                          title="Increase editor font"
                          onClick={() =>
                            setState((s) => ({
                              ...s,
                              fontSize: Math.min(22, s.fontSize + 1),
                            }))
                          }
                        >
                          A+
                        </button>
                        <button
                          className="icon-button"
                          aria-label="Toggle fullscreen"
                          onClick={() => setFull(!full)}
                        >
                          {full ? (
                            <Minimize2 size={15} />
                          ) : (
                            <Maximize2 size={15} />
                          )}
                        </button>
                        <button
                          className="icon-button"
                          aria-label="Copy generated code"
                          disabled={projectInvalid && !currentFile?.manual}
                          onClick={() => copy(code)}
                        >
                          <Copy size={15} />
                        </button>
                      </div>
                    </div>
                    <div className="file-tabs">
                      {active.files.map((f) => (
                        <button
                          className={currentFile?.id === f.id ? "selected" : ""}
                          key={f.id}
                          onClick={() => {
                            setFileId(f.id);
                            setPreview(false);
                          }}
                        >
                          <FileCode2 size={13} />
                          {f.name}
                        </button>
                      ))}
                      <button
                        aria-label="Add file"
                        onClick={() =>
                          setDialog({
                            title: "Add a project file",
                            label: "Filename, such as styles.css",
                            value: "styles.css",
                            action: (v) => {
                              if (
                                !safeFilename(v) ||
                                active.files.some((f) => f.name === v)
                              ) {
                                notify(
                                  "Choose a unique filename using letters, numbers, dots, underscores, or hyphens.",
                                );
                                return;
                              }
                              const id = uid();
                              updateProject((p) => ({
                                ...p,
                                files: [...p.files, { id, name: v, code: "" }],
                              }));
                              setFileId(id);
                              setDialog(null);
                            },
                          })
                        }
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <div className="editor-subbar">
                      <span>
                        {currentFile?.id === "main" && !currentFile.manual
                          ? "Generated from blocks"
                          : "Editable source"}{" "}
                        · {active.language}
                      </span>
                      <div>
                        <button
                          title="Rename file"
                          onClick={() =>
                            setDialog({
                              title: "Rename file",
                              label:
                                "Filename (Main.java must match the public Java class)",
                              value: currentFile!.name,
                              action: (v) => {
                                if (
                                  !safeFilename(v) ||
                                  active.files.some(
                                    (f) =>
                                      f.id !== currentFile?.id && f.name === v,
                                  )
                                ) {
                                  notify("Use a unique valid filename.");
                                  return;
                                }
                                if (
                                  active.language === "Java" &&
                                  currentFile?.id === "main" &&
                                  v !== "Main.java"
                                ) {
                                  notify(
                                    "The public Main class requires Main.java.",
                                  );
                                  return;
                                }
                                updateProject((p) => ({
                                  ...p,
                                  files: p.files.map((f) =>
                                    f.id === currentFile?.id
                                      ? { ...f, name: v }
                                      : f,
                                  ),
                                }));
                                setDialog(null);
                              },
                            })
                          }
                        >
                          Rename
                        </button>
                        {currentFile?.id !== "main" && (
                          <button
                            onClick={() =>
                              setConfirm({
                                title: "Delete file?",
                                message: currentFile?.name || "",
                                action: () => {
                                  updateProject((p) => ({
                                    ...p,
                                    files: p.files.filter(
                                      (f) => f.id !== currentFile?.id,
                                    ),
                                  }));
                                  setFileId("main");
                                },
                              })
                            }
                          >
                            Delete
                          </button>
                        )}
                        <button
                          disabled={projectInvalid && !currentFile?.manual}
                          onClick={() => download(code, currentFile!.name)}
                        >
                          <Download size={12} />
                          Download
                        </button>
                      </div>
                    </div>
                    {preview ? (
                      <div className="preview-wrap">
                        <iframe
                          key={previewKey}
                          title="Sandboxed website preview"
                          sandbox="allow-scripts"
                          referrerPolicy="no-referrer"
                          srcDoc={previewSource()}
                        />
                      </div>
                    ) : (
                      <div className="code-editor">
                        <CodeMirror
                          value={code}
                          height="100%"
                          theme={state.theme === "dark" ? "dark" : "light"}
                          extensions={extensions(active.language)}
                          style={{ fontSize: state.fontSize }}
                          onChange={(v) => {
                            if (v !== code)
                              updateProject((p) => ({
                                ...p,
                                files: p.files.map((f) =>
                                  f.id === currentFile?.id
                                    ? { ...f, code: v, manual: true }
                                    : f,
                                ),
                              }));
                          }}
                          basicSetup={{
                            lineNumbers: true,
                            foldGutter: true,
                            highlightActiveLine: true,
                          }}
                        />
                      </div>
                    )}
                    <div className="editor-footer">
                      <button
                        className="text-button"
                        onClick={() =>
                          setConfirm({
                            title: "Reset to generated code?",
                            message:
                              "Manual changes to this file will be replaced. Blocks will be kept.",
                            action: () => {
                              updateProject((p) => ({
                                ...p,
                                files: p.files.map((f) =>
                                  f.id === currentFile?.id
                                    ? { ...f, code: "", manual: false }
                                    : f,
                                ),
                              }));
                              notify("File reset to generated code");
                            },
                          })
                        }
                      >
                        <RotateCcw size={13} />
                        Reset file
                      </button>
                      {["HTML", "CSS", "JavaScript"].includes(
                        active.language,
                      ) && (
                        <div>
                          <button
                            className="icon-button"
                            aria-label="Refresh preview"
                            onClick={() => setPreviewKey((k) => k + 1)}
                          >
                            <RotateCcw size={14} />
                          </button>
                          <button
                            className="secondary"
                            onClick={() => setPreview(!preview)}
                          >
                            {preview ? <Code2 size={14} /> : <Play size={14} />}
                            {preview ? "Code" : "Live preview"}
                          </button>
                        </div>
                      )}
                      {active.language === "SQL" && (
                        <button
                          className="primary"
                          disabled={
                            sqlBusy ||
                            active.dialect !== "SQLite" ||
                            projectInvalid
                          }
                          onClick={runSQL}
                        >
                          <Play size={14} />
                          {sqlBusy ? "Running..." : "Run SQLite"}
                        </button>
                      )}
                    </div>
                  </section>
                </div>
                {active.language === "SQL" && (
                  <section className="sql-panel">
                    <div className="section-header">
                      <h2>SQL playground</h2>
                      <div className="inline-actions">
                        <select
                          aria-label="SQL dialect"
                          value={active.dialect}
                          onChange={(e) =>
                            updateProject((p) => ({
                              ...p,
                              dialect: e.target.value,
                            }))
                          }
                        >
                          {["SQLite", "PostgreSQL", "MySQL"].map((d) => (
                            <option key={d}>{d}</option>
                          ))}
                        </select>
                        <button
                          className="secondary"
                          onClick={() => setShowSchema(!showSchema)}
                        >
                          Sample schema
                        </button>
                        <button
                          className="secondary"
                          onClick={() => {
                            resetSQLite();
                            setResults([]);
                            setSqlError("");
                            notify("Sample database reset");
                          }}
                        >
                          Reset database
                        </button>
                      </div>
                    </div>
                    <p>
                      Queries run in a temporary, in-browser SQLite database.
                      Writes persist in this playground until reset or refresh.
                      PostgreSQL and MySQL are export-only.
                    </p>
                    {showSchema && <pre>{schema}</pre>}
                    {sqlError && <div className="error">{sqlError}</div>}
                    {results.map((r, i) => (
                      <div className="table-scroll" key={i}>
                        <table>
                          <thead>
                            <tr>
                              {r.columns.map((c, i) => (
                                <th key={i}>{c}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {r.values.map((row, i) => (
                              <tr key={i}>
                                {row.map((v, i) => (
                                  <td key={i}>
                                    {v === null ? <em>NULL</em> : String(v)}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ))}
                    {!results.length && !sqlError && (
                      <p className="muted">
                        Run a query to see results. Write statements may return
                        no rows.
                      </p>
                    )}
                  </section>
                )}
              </>
            )}
          </div>
        )}
        {page === "My Projects" && (
          <div className="page">
            <div className="title-row">
              <div>
                <div className="eyebrow">YOUR IDEAS, IN PROGRESS</div>
                <h1>My Projects</h1>
                <p>Everything is saved in your browser, ready when you are.</p>
              </div>
              <button className="primary" onClick={() => start(lang)}>
                <Plus size={16} />
                New project
              </button>
            </div>
            <div className="filter-bar">
              <div className="search-input">
                <Search size={16} />
                <input
                  aria-label="Search projects"
                  placeholder="Find a project..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="projects-grid">
              {state.projects
                .filter((p) =>
                  p.name.toLowerCase().includes(query.toLowerCase()),
                )
                .map((p) => (
                  <article className="project-card" key={p.id}>
                    <div className="project-card-top">
                      <span className="outline-icon">
                        <Folder size={22} />
                      </span>
                      <span className="tag">{p.language}</span>
                    </div>
                    <h2>
                      <button
                        onClick={() => {
                          setState((s) => ({ ...s, activeId: p.id }));
                          setLang(p.language);
                          setFileId("main");
                          go("Code Builder");
                        }}
                      >
                        {p.name}
                        <ArrowUpRight size={17} />
                      </button>
                    </h2>
                    <p>
                      {p.files.length} {p.files.length === 1 ? "file" : "files"}{" "}
                      · {p.blocks.length} code blocks
                    </p>
                    <small>
                      Updated {new Date(p.updated).toLocaleDateString()}
                    </small>
                    <div className="project-actions">
                      <button
                        className="text-button"
                        onClick={() => {
                          setState((s) => ({ ...s, activeId: p.id }));
                          setFileId("main");
                          go("Code Builder");
                        }}
                      >
                        Open project
                        <ArrowRight size={14} />
                      </button>
                      <button
                        className="icon-button"
                        title="Rename project"
                        aria-label={"Rename " + p.name}
                        onClick={() =>
                          setDialog({
                            title: "Rename project",
                            label: "Project name",
                            value: p.name,
                            action: (v) => {
                              if (v.trim()) {
                                setState((s) => ({
                                  ...s,
                                  projects: s.projects.map((x) =>
                                    x.id === p.id
                                      ? { ...x, name: v.trim() }
                                      : x,
                                  ),
                                }));
                                setDialog(null);
                              }
                            },
                          })
                        }
                      >
                        <FileCode2 size={15} />
                      </button>
                      <button
                        className="icon-button"
                        aria-label={"Duplicate " + p.name}
                        title="Duplicate project"
                        onClick={() => {
                          const duplicate = {
                            ...structuredClone(p),
                            id: uid(),
                            name: p.name + " copy",
                            updated: new Date().toISOString(),
                          };
                          setState((s) => ({
                            ...s,
                            projects: [duplicate, ...s.projects],
                          }));
                          notify("Project duplicated");
                        }}
                      >
                        <Copy size={15} />
                      </button>
                      <button
                        className="icon-button"
                        aria-label={"Export " + p.name}
                        title="Export ZIP"
                        onClick={() => exportProject(p)}
                      >
                        <Download size={15} />
                      </button>
                      <button
                        className="icon-button"
                        aria-label={"Delete " + p.name}
                        title="Delete project"
                        onClick={() =>
                          setConfirm({
                            title: "Delete this project?",
                            message:
                              "“" +
                              p.name +
                              "” will be removed from this browser. Export a copy first if you need it.",
                            action: () => {
                              setState((s) => ({
                                ...s,
                                projects: s.projects.filter(
                                  (x) => x.id !== p.id,
                                ),
                                activeId:
                                  s.activeId === p.id ? undefined : s.activeId,
                              }));
                              notify("Project deleted");
                            },
                          })
                        }
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </article>
                ))}
            </div>
            {!state.projects.length && (
              <div className="empty">
                <Folder size={35} />
                <h2>Make room for your next idea.</h2>
                <p>
                  Create a project from any language template. We'll save it as
                  you build.
                </p>
                <div className="inline-actions">
                  <select
                    aria-label="New project language"
                    value={lang}
                    onChange={(e) => setLang(e.target.value as Language)}
                  >
                    {languages.map((l) => (
                      <option key={l.name}>{l.name}</option>
                    ))}
                  </select>
                  <button className="primary" onClick={() => start(lang)}>
                    Create a project
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        {page === "Quick Reference" && (
          <div className="page">
            <div className="title-row">
              <div>
                <div className="eyebrow">
                  THE DETAILS YOU DON'T NEED TO MEMORIZE
                </div>
                <h1>Quick Reference</h1>
                <p>A little clarity, right when you need it.</p>
              </div>
            </div>
            <div className="language-tabs">
              {languages.map((l) => (
                <button
                  className={lang === l.name ? "selected" : ""}
                  key={l.name}
                  onClick={() => setLang(l.name)}
                >
                  {l.name}
                </button>
              ))}
            </div>
            <div className="reference-layout">
              <section className="reference-card">
                <h2>
                  <Terminal size={19} />
                  Start & run
                </h2>
                <p>{languages.find((l) => l.name === lang)?.structure}</p>
                <pre>{languages.find((l) => l.name === lang)?.command}</pre>
                <button
                  className="secondary"
                  onClick={() =>
                    copy(languages.find((l) => l.name === lang)!.command)
                  }
                >
                  <Copy size={14} />
                  Copy instructions
                </button>
              </section>
              <section className="reference-card">
                <h2>
                  <Info size={19} />
                  When something goes wrong
                </h2>
                <ul>
                  {(lang === "HTML"
                    ? [
                        "Check closing tags and unique IDs.",
                        "Put metadata in head and visible content in body.",
                        "Check relative file paths from the HTML file.",
                      ]
                    : lang === "CSS"
                      ? [
                          "Make sure your stylesheet is linked.",
                          "Check selector spelling and CSS specificity.",
                          "Most lengths need units, such as px or rem.",
                        ]
                      : lang === "Python"
                        ? [
                            "Use consistent four-space indentation.",
                            "Check the exception name and line number.",
                            "Install dependencies in the same Python environment.",
                          ]
                        : lang === "SQL"
                          ? [
                              "Check the schema and column names.",
                              "Use IS NULL for missing values.",
                              "Review WHERE before any UPDATE or DELETE.",
                            ]
                          : lang === "Bash"
                            ? [
                                "Use Bash instead of sh for these examples.",
                                'Quote variable expansions: "$name".',
                                "Assignments have no spaces around =.",
                              ]
                            : [
                                "Read the first compiler or runtime error first.",
                                "Check required imports and version requirements.",
                                "Keep declarations and statements in their correct scopes.",
                              ]
                  ).map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </section>
            </div>
            <div className="section-header">
              <h2>The essentials</h2>
              <button
                className="text-button"
                onClick={() => {
                  go("Languages");
                  setLang(lang);
                }}
              >
                Open full reference
                <ArrowRight size={14} />
              </button>
            </div>
            <div className="snippet-grid">
              {snippets
                .filter((s) => s.language === lang)
                .slice(0, 12)
                .map((s) => card(s))}
            </div>
            <section className="reference-card comparison-table">
              <h2>Same idea, different syntax</h2>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Language</th>
                      <th>Print a message</th>
                      <th>Comment</th>
                      <th>File</th>
                    </tr>
                  </thead>
                  <tbody>
                    {languages
                      .filter((l) => !["HTML", "CSS", "SQL"].includes(l.name))
                      .map((l) => (
                        <tr key={l.name}>
                          <td>{l.name}</td>
                          <td>
                            <code>
                              {l.name === "Python"
                                ? 'print("Hello")'
                                : l.name === "Java"
                                  ? 'System.out.println("Hello");'
                                  : l.name === "C"
                                    ? 'printf("Hello\\n");'
                                    : l.name === "C++"
                                      ? 'std::cout << "Hello\\n";'
                                      : l.name === "Bash"
                                        ? "printf 'Hello\\n'"
                                        : 'console.log("Hello");'}
                            </code>
                          </td>
                          <td>
                            {["Python", "Bash"].includes(l.name)
                              ? "# comment"
                              : "// comment"}
                          </td>
                          <td>{l.file}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}
      </main>
      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <section
            className="snippet-modal modal"
            role="dialog"
            aria-modal="true"
            aria-label={selected.title}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-top">
              <span
                className="language-label"
                style={{
                  color: languages.find((l) => l.name === selected.language)
                    ?.color,
                }}
              >
                {selected.language}{" "}
                <span className="muted">/ {selected.category}</span>
              </span>
              <div>
                <button
                  className={
                    "icon-button " +
                    (state.favorites.includes(selected.id) ? "is-favorite" : "")
                  }
                  aria-label="Favorite snippet"
                  onClick={() => favorite(selected.id)}
                >
                  <Star
                    size={18}
                    fill={
                      state.favorites.includes(selected.id)
                        ? "currentColor"
                        : "none"
                    }
                  />
                </button>
                <button
                  className="icon-button"
                  aria-label="Close snippet"
                  onClick={() => setSelected(null)}
                >
                  <X size={19} />
                </button>
              </div>
            </div>
            <h2>{selected.title}</h2>
            <p>{selected.description}</p>
            <div className="snippet-modal-layout">
              <div className="snippet-customize">
                <h3>
                  Make it yours <Settings2 size={15} />
                </h3>
                {selected.fields.length ? (
                  selected.fields.map((f) => (
                    <label className="field" key={f.key}>
                      {f.label}
                      <span className="required-label">Required</span>
                      <input
                        value={values[f.key] ?? f.value}
                        autoComplete="off"
                        aria-invalid={!!validate(selected, values)[f.key]}
                        onChange={(e) =>
                          setValues((v) => ({ ...v, [f.key]: e.target.value }))
                        }
                      />
                      {validate(selected, values)[f.key] && (
                        <small className="error">
                          {validate(selected, values)[f.key]}
                        </small>
                      )}
                    </label>
                  ))
                ) : (
                  <p>
                    This example is ready to use. Edit the generated source in
                    your project for more control.
                  </p>
                )}
                <div className="mini-note">
                  <Info size={15} />
                  <span>
                    {selected.fields.length
                      ? "Only the labeled values change. CodeKit handles escaping and keeps required syntax in place."
                      : "Required punctuation, names, and example data are shown directly in the code."}
                  </span>
                </div>
              </div>
              <div>
                <div className="code-preview">
                  <CodeMirror
                    value={(() => {
                      try {
                        return renderSnippet(selected, values);
                      } catch {
                        return "// Correct the fields to generate your snippet.";
                      }
                    })()}
                    theme={state.theme === "dark" ? "dark" : "light"}
                    extensions={extensions(selected.language)}
                    editable={false}
                    basicSetup={{ lineNumbers: true }}
                  />
                </div>
                <div className="explain-toggle">
                  <button
                    className={explain ? "pink" : ""}
                    onClick={() => setExplain(!explain)}
                  >
                    <BookOpen size={14} />
                    Explain this code
                  </button>
                  <span>{selected.compatibility}</span>
                </div>
                {explain && (
                  <div className="line-explanations">
                    {selected.code.split("\n").map((line, i) => (
                      <div key={i}>
                        <code>{i + 1}</code>
                        <span>
                          {!line.trim()
                            ? "Space separates logical sections."
                            : line.trim().startsWith("import") ||
                                line.trim().startsWith("#include")
                              ? "Load a dependency needed by this example."
                              : line.includes("{{")
                                ? "Your customized values are inserted here, with required syntax preserved."
                                : /^(\s*)(}|\)|\]|end|fi|done|<\/)/.test(line)
                                  ? "Close the block or element opened above."
                                  : line.includes("print") ||
                                      line.includes("cout") ||
                                      line.includes("console.log")
                                    ? "Display a value in the output."
                                    : line.includes("return")
                                      ? "Return a result to the caller."
                                      : line.includes("if ") ||
                                          line.includes("if(")
                                        ? "Choose whether this branch should run."
                                        : line.includes("for ") ||
                                            line.includes("while ")
                                          ? "Repeat the indented or braced code."
                                          : line.includes("<") &&
                                              selected.language === "HTML"
                                            ? "Define part of the page structure or its content."
                                            : selected.language === "SQL"
                                              ? "Part of the " +
                                                selected.title.toLowerCase() +
                                                " statement; run against the sample schema."
                                              : selected.explanation}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="learning-grid">
              <div>
                <h3>When to use it</h3>
                <p>{selected.usage}</p>
              </div>
              <div>
                <h3>What to change</h3>
                <p>
                  {selected.fields.length
                    ? selected.fields.map((f) => f.label).join(", ") +
                      ". Other code is required syntax."
                    : "Adapt the example names and data in your project; keep punctuation and block structure intact."}
                </p>
              </div>
              <div>
                <h3>Common mistakes</h3>
                <p>{selected.mistakes[0]}</p>
              </div>
              <div>
                <h3>Requirements & placement</h3>
                <p>
                  {selected.requirements.length
                    ? selected.requirements.join(" · ")
                    : "No additional packages required."}{" "}
                  {selected.imports.length
                    ? "Imports: " + selected.imports.join(", ") + ". "
                    : ""}
                  Goes in{" "}
                  {selected.region === "main"
                    ? "the main function"
                    : selected.region === "definition"
                      ? "the definitions area"
                      : selected.region === "head"
                        ? "the document head"
                        : selected.region === "body"
                          ? "the document body"
                          : "the source file"}
                  .
                </p>
              </div>
            </div>
            <button
              className="learn-link"
              onClick={() => setAdvanced(!advanced)}
            >
              {advanced ? "Hide" : "Show"} execution instructions
              <ChevronDown size={13} />
            </button>
            {selected.output && (
              <div className="sample-output">
                <h3>
                  Example output <span>Illustrative · not executed</span>
                </h3>
                <pre>{selected.output}</pre>
              </div>
            )}
            {advanced && (
              <div className="run-instructions">
                <code>
                  {languages.find((l) => l.name === selected.language)?.command}
                </code>
                <p>
                  {["HTML", "CSS", "JavaScript", "SQL"].includes(
                    selected.language,
                  )
                    ? "Use the builder preview or SQLite playground where supported."
                    : "This code is not executed in CodeKit. Run it locally with the instructions above."}
                </p>
              </div>
            )}
            <div className="modal-footer">
              <span className="level-label">
                <i className="level-dot" />
                {selected.difficulty}
              </span>
              <div>
                <button
                  className="secondary"
                  disabled={!!Object.keys(validate(selected, values)).length}
                  onClick={() => copy(renderSnippet(selected, values))}
                >
                  <Copy size={15} />
                  Copy snippet
                </button>
                <button
                  className="primary"
                  disabled={
                    !!Object.keys(validate(selected, values)).length ||
                    !!(
                      active?.language === selected.language &&
                      compatible(selected, active.blocks)
                    )
                  }
                  title={
                    active?.language === selected.language
                      ? compatible(selected, active.blocks)
                      : ""
                  }
                  onClick={() => addBlock(selected, values)}
                >
                  <Plus size={15} />
                  {active?.language === selected.language
                    ? "Add to project"
                    : "Start project with this"}
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
      {guideOpen && (
        <div className="modal-backdrop" onClick={() => setGuideOpen(false)}>
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label={lang + " starting guide"}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-top">
              <div>
                <span className="tag">START HERE · {lang}</span>
              </div>
              <button
                className="icon-button"
                aria-label="Close starting guide"
                onClick={() => setGuideOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
            <h2>{languages.find((l) => l.name === lang)?.start}</h2>
            <p>{languages.find((l) => l.name === lang)?.structure}</p>
            <div className="code-preview" style={{ marginTop: 20 }}>
              <CodeMirror
                value={starters[lang]}
                theme={state.theme === "dark" ? "dark" : "light"}
                extensions={extensions(lang)}
                editable={false}
              />
            </div>
            <div className="learning-grid" style={{ marginTop: 20 }}>
              <div>
                <h3>What to change</h3>
                <p>{guides[lang].change}</p>
              </div>
              <div>
                <h3>What stays the same</h3>
                <p>{guides[lang].keep}</p>
              </div>
            </div>
            <ol className="guide-steps">
              {guides[lang].steps.map((step, i) => (
                <li key={i}>
                  <span>{i + 1}</span>
                  <p>{step}</p>
                </li>
              ))}
            </ol>
            <div className="modal-footer">
              <button
                className="secondary"
                onClick={() => copy(starters[lang])}
              >
                <Copy size={15} />
                Copy starter
              </button>
              <button
                className="primary"
                onClick={() => {
                  setGuideOpen(false);
                  start(lang);
                }}
              >
                <Plus size={15} />
                Build from this template
              </button>
            </div>
          </section>
        </div>
      )}
      {searchOpen && (
        <div className="modal-backdrop" onClick={() => setSearchOpen(false)}>
          <section
            className="search-modal modal"
            role="dialog"
            aria-modal="true"
            aria-label="Global search"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="global-search-box">
              <Search size={22} />
              <input
                autoFocus
                aria-label="Search all languages"
                placeholder="What do you want to build?"
                value={globalQuery}
                onChange={(e) => setGlobalQuery(e.target.value)}
              />
              <button
                className="icon-button"
                onClick={() => setSearchOpen(false)}
                aria-label="Close search"
              >
                <X size={18} />
              </button>
            </div>
            <p className="results-label">
              {globalQuery
                ? "Matching snippets"
                : "TRY “PYTHON LOOP”, “READ CSV”, OR “BUTTON”"}
            </p>
            <div className="search-results">
              {searchSnippets(globalQuery)
                .slice(0, 30)
                .map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setSearchOpen(false);
                      openSnippet(s);
                    }}
                  >
                    <span
                      className="search-result-icon"
                      style={{
                        color: languages.find((l) => l.name === s.language)
                          ?.color,
                      }}
                    >
                      <Code2 size={18} />
                    </span>
                    <span>
                      {s.title}
                      <small>
                        {s.language} · {s.description}
                      </small>
                    </span>
                    <ArrowUpRight size={16} />
                  </button>
                ))}
              {!searchSnippets(globalQuery).length && (
                <p className="empty">
                  No matches. Try a language or a shorter topic.
                </p>
              )}
            </div>
            <div className="search-footer">
              Search all 270 snippets across 10 languages{" "}
              <kbd>ESC to close</kbd>
            </div>
          </section>
        </div>
      )}
      {compareOpen && (
        <div className="modal-backdrop" onClick={() => setCompareOpen(false)}>
          <section
            className="modal compare-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Compare snippets"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-top">
              <h2>Side by side</h2>
              <button
                className="icon-button"
                aria-label="Close comparison"
                onClick={() => setCompareOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="compare-grid">
              {compare.map((id) => {
                const s = snippets.find((s) => s.id === id)!;
                return (
                  <div key={id}>
                    <span className="tag">{s.language}</span>
                    <h3>{s.title}</h3>
                    <p>{s.description}</p>
                    <CodeMirror
                      value={renderSnippet(s)}
                      theme={state.theme === "dark" ? "dark" : "light"}
                      extensions={extensions(s.language)}
                      editable={false}
                    />
                    <p>{s.mistakes[0]}</p>
                    <button
                      className="secondary"
                      onClick={() => copy(renderSnippet(s))}
                    >
                      <Copy size={14} />
                      Copy
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}
      {dialog && (
        <div className="modal-backdrop">
          <form
            className="modal small-modal"
            role="dialog"
            aria-modal="true"
            aria-label={dialog.title}
            onSubmit={(e) => {
              e.preventDefault();
              dialog.action(dialog.value);
            }}
          >
            <div className="modal-top">
              <h2>{dialog.title}</h2>
              <button
                type="button"
                className="icon-button"
                aria-label="Close"
                onClick={() => setDialog(null)}
              >
                <X size={18} />
              </button>
            </div>
            <label className="field">
              {dialog.label}
              {dialog.title.includes("starter") ? (
                <textarea
                  autoFocus
                  rows={16}
                  value={dialog.value}
                  onChange={(e) =>
                    setDialog({ ...dialog, value: e.target.value })
                  }
                />
              ) : (
                <input
                  autoFocus
                  required
                  maxLength={100}
                  value={dialog.value}
                  onChange={(e) =>
                    setDialog({ ...dialog, value: e.target.value })
                  }
                />
              )}
            </label>
            <div className="modal-footer">
              <button
                type="button"
                className="secondary"
                onClick={() => setDialog(null)}
              >
                Cancel
              </button>
              <button className="primary" type="submit">
                {dialog.title.includes("starter") ? "Copy code" : "Save"}
              </button>
            </div>
          </form>
        </div>
      )}
      {confirm && (
        <div className="modal-backdrop">
          <section
            className="modal small-modal"
            role="alertdialog"
            aria-modal="true"
            aria-label={confirm.title}
          >
            <h2>{confirm.title}</h2>
            <p>{confirm.message}</p>
            <div className="modal-footer">
              <button
                className="secondary"
                autoFocus
                onClick={() => setConfirm(null)}
              >
                Cancel
              </button>
              <button
                className="primary"
                onClick={() => {
                  confirm.action();
                  setConfirm(null);
                }}
              >
                Confirm
              </button>
            </div>
          </section>
        </div>
      )}
      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={17} />
          {toast}
          <button
            className="icon-button"
            aria-label="Dismiss notification"
            onClick={() => setToast("")}
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

import { describe, it, expect, vi } from "vitest";
import { snippets, languages, searchSnippets, starters } from "./registry";
import {
  defaults,
  renderSnippet,
  validate,
  compose,
  compatible,
  createProject,
  safeFilename,
  download,
  schema,
} from "./engine";
import { loadState, fresh, toggleFavorite, persist } from "./storage";
import type { Block, Language } from "./types";
import initSqlJs from "sql.js";
import { execFileSync } from "node:child_process";
import { writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const blocks = (language: Language): Block[] =>
  snippets
    .filter((s) => s.language === language)
    .map((s) => ({ id: s.id, snippetId: s.id, values: defaults(s) }));
describe("registry and rendering", () => {
  it("has 25+ distinct snippets and a starter for every language", () => {
    expect(new Set(snippets.map((s) => s.id)).size).toBe(270);
    for (const l of languages) {
      expect(
        snippets.filter((s) => s.language === l.name).length,
      ).toBeGreaterThanOrEqual(25);
      expect(starters[l.name]).toBeTruthy();
    }
  });
  it.each(snippets.map((s) => [s.title, s]))(
    "renders %s without unresolved fields",
    (_, s) => {
      expect(renderSnippet(s)).not.toMatch(/\{\{\w+\}\}/);
      expect(Object.keys(validate(s, defaults(s)))).toHaveLength(0);
    },
  );
  it("escapes HTML and string values", () => {
    const s = snippets[2];
    expect(renderSnippet(s, { text: '<script>"&' })).toContain(
      "&lt;script&gt;&quot;&amp;",
    );
    const py = snippets.find(
      (s) => s.language === "Python" && s.title === "Print a message",
    )!;
    expect(renderSnippet(py, { text: 'hello"\n' })).toContain('hello\\"\\n');
  });
  it("rejects invalid and reserved identifiers", () => {
    const s = snippets.find(
      (s) => s.language === "Python" && s.title === "Variable",
    )!;
    for (const name of ["3name", "a b", "class", "for", "name;exit()"])
      expect(validate(s, { name, text: "Hello" }).name).toBeTruthy();
  });
  it("rejects invalid numbers and dangerous URL schemes", () => {
    expect(
      validate(snippets[3], { url: "javascript:alert(1)", text: "x" }).url,
    ).toBeTruthy();
  });
});
describe("composition", () => {
  it("inserts HTML into the correct document regions", () => {
    const text = compose("HTML", blocks("HTML"));
    expect(text.indexOf("<link")).toBeLessThan(text.indexOf("</head>"));
    expect(text.indexOf("<button")).toBeGreaterThan(text.indexOf("<body>"));
    expect(text.trim().endsWith("</html>")).toBe(true);
  });
  it("deduplicates imports and puts definitions before entry point", () => {
    for (const l of ["Java", "C", "C++"] as Language[]) {
      const code = compose(l, blocks(l));
      expect(
        code.indexOf(l === "Java" ? "static int add" : "int add"),
      ).toBeLessThan(
        code.indexOf(l === "Java" ? "public static void main" : "int main"),
      );
    }
    const p = compose("Python", blocks("Python"));
    expect(p.match(/^import csv$/gm)).toHaveLength(1);
  });
  it("adapts MySQL index syntax", () => {
    const b = blocks("SQL").filter(
      (b) =>
        snippets.find((s) => s.id === b.snippetId)?.title === "Create index",
    );
    expect(compose("SQL", b, "MySQL")).not.toContain("IF NOT EXISTS");
    expect(compose("SQL", b, "SQLite")).toContain("IF NOT EXISTS");
  });
  it("prevents duplicate definitions", () => {
    const s = snippets.find(
      (s) => s.language === "C" && s.title === "Function",
    )!;
    expect(
      compatible(s, [{ id: "1", snippetId: s.id, values: {} }]),
    ).toBeTruthy();
  });
});
describe("search and storage", () => {
  it.each([
    "How to make a button",
    "Python loop",
    "SQL inner join",
    "Read CSV",
    "Change background color",
    "Java ArrayList",
    "C pointer",
    "Call an API",
  ])("finds %s", (q) => expect(searchSnippets(q).length).toBeGreaterThan(0));
  it("filters by language, category and level", () =>
    expect(
      searchSnippets("", "Python", "Beginner", "Basics").every(
        (s) =>
          s.language === "Python" &&
          s.difficulty === "Beginner" &&
          s.category === "Basics",
      ),
    ).toBe(true));
  it("handles damaged data and unknown versions", () => {
    expect(loadState("{")).toEqual(fresh());
    expect(loadState('{"version":99}')).toEqual(fresh());
  });
  it("round trips projects, favorites, recents and preferences", () => {
    const s = {
      ...fresh(),
      projects: [createProject("HTML")],
      favorites: ["html-1"],
      recent: ["html-2"],
      fontSize: 16,
      theme: "light",
    };
    expect(loadState(JSON.stringify(s))).toEqual({ ...s, activeId: undefined });
  });
  it("drops malformed projects and unknown favorites", () => {
    expect(
      loadState(
        JSON.stringify({
          version: 1,
          projects: [{ id: "x" }],
          favorites: ["unknown"],
        }),
      ).projects,
    ).toEqual([]);
  });
  it("validates file names", () => {
    expect(safeFilename("../oops")).toBe(false);
    expect(safeFilename("styles.css")).toBe(true);
  });
  it("downloads via Blob URL and revokes the URL", () => {
    vi.useFakeTimers();
    const click = vi.fn();
    vi.stubGlobal("document", { createElement: () => ({ click }) });
    const create = vi.fn(() => "blob:test"),
      revoke = vi.fn();
    vi.stubGlobal("URL", { createObjectURL: create, revokeObjectURL: revoke });
    download("hello", "main.txt");
    expect(create).toHaveBeenCalled();
    expect(click).toHaveBeenCalled();
    vi.runAllTimers();
    expect(revoke).toHaveBeenCalledWith("blob:test");
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });
});
describe("real syntax and execution", () => {
  it("executes all bundled SQL statements in SQLite", async () => {
    const SQL = await initSqlJs();
    const db = new SQL.Database();
    db.run(schema);
    for (const b of blocks("SQL")) db.exec(compose("SQL", [b]));
    expect(db.exec("SELECT COUNT(*) FROM students")[0].values[0][0]).toBe(4);
    db.close();
  });
  it("validates generated Python, JS, Bash and C/C++ using available local tools", () => {
    const dir = mkdtempSync(join(tmpdir(), "codekit-"));
    try {
      for (const [language, file, cmd, args] of [
        ["Python", "main.py", "python3", ["-m", "py_compile"]],
        ["JavaScript", "main.mjs", "node", ["--check"]],
        ["Bash", "main.sh", "bash", ["-n"]],
        ["C", "main.c", "cc", ["-std=c11", "-fsyntax-only"]],
        ["C++", "main.cpp", "c++", ["-std=c++17", "-fsyntax-only"]],
      ] as [Language, string, string, string[]][]) {
        const path = join(dir, file);
        writeFileSync(path, compose(language, blocks(language)));
        execFileSync(cmd, [...args, path], {
          encoding: "utf8",
          env: { ...process.env, PYTHONPYCACHEPREFIX: join(dir, "pycache") },
        });
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("additional syntax checks", () => {
  it("typechecks assembled TypeScript with the real compiler", () => {
    const dir = mkdtempSync(join(tmpdir(), "codekit-ts-"));
    try {
      const path = join(dir, "main.ts");
      writeFileSync(path, compose("TypeScript", blocks("TypeScript")));
      execFileSync(
        process.execPath,
        [
          "node_modules/typescript/bin/tsc",
          path,
          "--noEmit",
          "--strict",
          "--target",
          "ES2022",
          "--module",
          "ESNext",
          "--skipLibCheck",
        ],
        { encoding: "utf8" },
      );
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("favorites and persistence actions", () => {
  it("adds and removes a favorite", () => {
    expect(toggleFavorite([], "html-1")).toEqual(["html-1"]);
    expect(toggleFavorite(["html-1"], "html-1")).toEqual([]);
  });
  it("writes versioned browser state", () => {
    const setItem = vi.fn();
    vi.stubGlobal("localStorage", { setItem });
    const s = fresh();
    persist(s);
    expect(setItem).toHaveBeenCalledWith("codekit:v1", JSON.stringify(s));
    vi.unstubAllGlobals();
  });
});

import { projectArchive } from "./export";
import { htmlLanguage } from "@codemirror/lang-html";
import { cssLanguage } from "@codemirror/lang-css";
describe("export and markup validation", () => {
  it("exports all source files and local run instructions", async () => {
    const p = createProject("HTML");
    p.blocks = [{ id: "b", snippetId: "html-3", values: { text: "Build it" } }];
    p.files.push({
      id: "css",
      name: "styles.css",
      code: "body {color: pink;}",
    });
    const zip = await projectArchive(p);
    const bytes = await zip.generateAsync({ type: "uint8array" });
    expect(bytes[0]).toBe(80);
    expect(await zip.file("index.html")!.async("string")).toContain(
      '<button type="button">Build it</button>',
    );
    expect(await zip.file("styles.css")!.async("string")).toBe(
      "body {color: pink;}",
    );
    expect(zip.file("RUN.txt")).toBeTruthy();
  });
  it("includes a runnable SQL schema in SQL projects", async () => {
    const zip = await projectArchive(createProject("SQL"));
    expect(await zip.file("sample-schema.sql")!.async("string")).toBe(schema);
  });
  it("preserves explicitly empty manual files", async () => {
    const p = createProject("HTML");
    p.files[0].manual = true;
    p.files[0].code = "";
    expect(
      await (await projectArchive(p)).file("index.html")!.async("string"),
    ).toBe("");
  });
  it("parses generated HTML and CSS with language parsers", () => {
    for (const [language, parser] of [
      ["HTML", htmlLanguage.parser],
      ["CSS", cssLanguage.parser],
    ] as const) {
      const tree = parser.parse(compose(language, blocks(language)));
      let errors = 0;
      tree.iterate({
        enter(node) {
          if (node.type.isError) errors++;
        },
      });
      expect(errors).toBe(0);
    }
  });
  it("disallows duplicate HTML IDs", () => {
    const s = snippets.find(
      (s) => s.title === "Form" && s.language === "HTML",
    )!;
    expect(compatible(s, [{ id: "x", snippetId: s.id, values: {} }])).toContain(
      "repeat an HTML ID",
    );
  });
});

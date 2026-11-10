import { snippets, starters, languages } from "./registry";
import type { Language, Snippet, Block, Project } from "./types";
export const uid = () =>
  typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : Array.from(crypto.getRandomValues(new Uint8Array(16)), (n) =>
        n.toString(16).padStart(2, "0"),
      ).join("");
export const defaults = (s: Snippet) =>
  Object.fromEntries(s.fields.map((f) => [f.key, f.value]));
const reserved = new Set(
  "if else for while class return import from def const let var function int void public static new switch case break default do enum interface type extends implements package true false null None True False try catch except finally with as in is pass lambda yield global nonlocal delete export await async this super throw throws private protected final double float char long short unsigned signed struct typedef sizeof union volatile register auto extern goto continue boolean byte String namespace template typename using virtual override include done then fi esac local readonly select until time coproc".split(
    " ",
  ),
);
export function validate(s: Snippet, values: Record<string, string>) {
  const errors: Record<string, string> = {};
  for (const f of s.fields) {
    const v = values[f.key] ?? f.value;
    if (f.required && !v.trim()) errors[f.key] = "Please enter a value.";
    else if (
      f.kind === "identifier" &&
      (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(v) || reserved.has(v))
    )
      errors[f.key] =
        "Use a valid name: letters, numbers, underscores; no reserved words.";
    else if (f.kind === "number" && !/^-?\d+(\.\d+)?$/.test(v))
      errors[f.key] = "Enter a number.";
    else if (
      f.kind === "url" &&
      !/^(https?:\/\/|mailto:|#|\/|\.\.?\/)[^\s]*$/i.test(v)
    )
      errors[f.key] =
        "Use https://, mailto:, #, or a relative path starting with ./ or /.";
    else if (s.language === "CSS" && /[{};<>]/.test(v))
      errors[f.key] = "Use a CSS value without braces or semicolons.";
    else if (
      s.language === "HTML" &&
      ["file"].includes(f.key) &&
      !/^[\w./-]+$/.test(v)
    )
      errors[f.key] = "Use a simple relative filename.";
  }
  return errors;
}
export function renderSnippet(s: Snippet, values = defaults(s)) {
  if (Object.keys(validate(s, values)).length)
    throw new Error("Please correct the highlighted fields.");
  return s.code.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    let v = values[key] ?? defaults(s)[key] ?? "";
    const f = s.fields.find((f) => f.key === key);
    if (f?.kind === "identifier" || f?.kind === "number") return v;
    if (s.language === "HTML")
      return v
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    if (s.language === "Bash")
      return v.replace(/[\\"$`]/g, "\\$&").replace(/\r?\n/g, " ");
    if (
      ["Python", "Java", "JavaScript", "TypeScript", "C", "C++"].includes(
        s.language,
      )
    )
      return JSON.stringify(v).slice(1, -1);
    return v;
  });
}
const indent = (s: string, n = 4) =>
  s
    .split("\n")
    .map((l) => " ".repeat(n) + l)
    .join("\n");
export function compose(
  language: Language,
  blocks: Block[],
  dialect = "SQLite",
): string {
  if (!blocks.length) return starters[language];
  const entries = blocks
    .map((b) => ({ b, s: snippets.find((s) => s.id === b.snippetId) }))
    .filter(
      (e): e is { b: Block; s: Snippet } => !!e.s && e.s.language === language,
    );
  const imports = [...new Set(entries.flatMap((e) => e.s.imports))];
  const sections = (region?: string) =>
    entries
      .filter((e) => !region || e.s.region === region)
      .map(({ s, b }, i) => {
        let code = renderSnippet(s, b.values);
        if (
          language === "SQL" &&
          dialect === "MySQL" &&
          s.title === "Create index"
        )
          code = code.replace(" IF NOT EXISTS", "");
        return { code, s, i };
      });
  // Brace-scoped blocks isolate local names in Java, C and C++; definitions stay at class/module scope.
  const main = sections("main")
    .map((e) => "{\n" + indent(e.code) + "\n}")
    .join("\n\n");
  const definitions = sections("definition")
    .map((e) => e.code)
    .join("\n\n");
  if (language === "HTML")
    return (
      '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>My Website</title>\n' +
      sections("head")
        .map((e) => indent(e.code, 2))
        .join("\n") +
      "\n</head>\n<body>\n" +
      (sections("body")
        .map((e) => indent(e.code, 2))
        .join("\n\n") || "  <h1>Hello, world!</h1>") +
      "\n</body>\n</html>"
    );
  if (language === "Java")
    return (
      imports.join("\n") +
      "\n\npublic class Main {\n" +
      (definitions ? indent(definitions) + "\n\n" : "") +
      "    public static void main(String[] args) {\n" +
      indent(main, 8) +
      "\n    }\n}"
    );
  if (language === "C" || language === "C++")
    return (
      [
        ...new Set([
          language === "C" ? "#include <stdio.h>" : "#include <iostream>",
          ...imports,
        ]),
      ].join("\n") +
      "\n\n" +
      (definitions ? definitions + "\n\n" : "") +
      (language === "C" ? "int main(void)" : "int main()") +
      " {\n" +
      indent(main) +
      "\n    return 0;\n}"
    );
  if (language === "Python")
    return (
      imports.join("\n") +
      (imports.length ? "\n\n" : "") +
      sections()
        .map((e) => "# " + e.s.title + "\n" + e.code)
        .join("\n\n") +
      "\n"
    );
  if (language === "Bash")
    return (
      "#!/usr/bin/env bash\nset -euo pipefail\n\n" +
      sections()
        .map((e) => "# " + e.s.title + "\n" + e.code)
        .join("\n\n") +
      "\n"
    );
  if (language === "TypeScript" || language === "JavaScript")
    return (
      (language === "TypeScript" ? "export {};\n\n" : "") +
      sections()
        .map((e) =>
          e.s.title === "Module export"
            ? e.code
            : "// " + e.s.title + "\n{\n" + indent(e.code, 2) + "\n}",
        )
        .join("\n\n") +
      "\n"
    );
  return (
    sections()
      .map(
        (e) =>
          (language === "CSS" ? "/* " + e.s.title + " */" : "-- " + e.s.title) +
          "\n" +
          e.code,
      )
      .join("\n\n") + "\n"
  );
}
export function compatible(s: Snippet, blocks: Block[]) {
  if (s.language === "HTML") {
    const ids = [...s.code.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
    const existing = blocks
      .map((b) => snippets.find((x) => x.id === b.snippetId)?.code || "")
      .join("\n");
    if (ids.some((id) => existing.includes('id="' + id + '"')))
      return "This block would repeat an HTML ID. Edit the existing block, or customize IDs in the source editor.";
  }
  if (blocks.some((b) => b.snippetId === s.id) && s.region === "definition")
    return "This definition is already in the project. Edit the existing block to avoid duplicate declarations.";
  if (s.title === "Skip navigation" && blocks.some((b) => b.snippetId === s.id))
    return "Only one main content landmark should be added.";
  if (s.title === "Module export" && blocks.some((b) => b.snippetId === s.id))
    return "This module export is already present.";
  return "";
}
export const schema = `CREATE TABLE courses (id INTEGER PRIMARY KEY, title VARCHAR(100) NOT NULL);\nCREATE TABLE students (id INTEGER PRIMARY KEY, name VARCHAR(100) NOT NULL, score INTEGER, course_id INTEGER REFERENCES courses(id));\nINSERT INTO courses VALUES (1, 'Web development'), (2, 'Computer science');\nINSERT INTO students VALUES (1, 'Alex', 92, 1), (2, 'Sam', 88, 1), (3, 'Jordan', 58, 2), (4, 'Taylor', 76, NULL);`;
export function createProject(language: Language, name?: string): Project {
  return {
    id: uid(),
    name: name || `My ${language} project`,
    language,
    blocks: [],
    files: [
      {
        id: "main",
        name: languages.find((l) => l.name === language)!.file,
        code: "",
      },
    ],
    updated: new Date().toISOString(),
    dialect: "SQLite",
  };
}
export function safeFilename(name: string) {
  return /^[\w.-]+$/.test(name) && !name.startsWith(".") && name.length < 100;
}
export function download(content: string | Blob, name: string) {
  const blob =
    content instanceof Blob
      ? content
      : new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

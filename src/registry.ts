import type { Language, Snippet } from "./types";
import html from "./content/html.json";
import css from "./content/css.json";
import js from "./content/javascript.json";
import py from "./content/python.json";
import java from "./content/java.json";
import sql from "./content/sql.json";
import c from "./content/c.json";
import cpp from "./content/cpp.json";
import ts from "./content/typescript.json";
import bash from "./content/bash.json";
export const snippets = [
  ...html,
  ...css,
  ...js,
  ...py,
  ...java,
  ...sql,
  ...c,
  ...cpp,
  ...ts,
  ...bash,
] as Snippet[];
export const languages: {
  name: Language;
  symbol: string;
  color: string;
  description: string;
  file: string;
  command: string;
  structure: string;
  start: string;
}[] = [
  {
    name: "HTML",
    symbol: "<>",
    color: "#f59c66",
    description: "Give your ideas a structure.",
    file: "index.html",
    command: "Open index.html in your browser.",
    structure:
      "The head holds metadata and resource links. Visible elements belong inside body.",
    start: "Start a website",
  },
  {
    name: "CSS",
    symbol: "#",
    color: "#8ba8ff",
    description: "Make every detail your own.",
    file: "styles.css",
    command:
      'Link styles.css from an HTML file using <link rel="stylesheet" href="styles.css">.',
    structure:
      "Selectors target elements. Braces contain property: value; declarations.",
    start: "Style a page",
  },
  {
    name: "JavaScript",
    symbol: "JS",
    color: "#e8cf67",
    description: "Bring your pages to life.",
    file: "main.mjs",
    command:
      "node main.mjs (DOM snippets need a browser and matching elements).",
    structure:
      "Declarations and functions can live at module scope. Browser APIs such as document require a browser.",
    start: "Write your first script",
  },
  {
    name: "Python",
    symbol: "Py",
    color: "#74b9bb",
    description: "A little code. A lot of possibility.",
    file: "main.py",
    command: "python3 main.py",
    structure:
      "Imports go first. Four-space indentation defines blocks. The main guard runs the script entry point.",
    start: "Start a Python script",
  },
  {
    name: "Java",
    symbol: "Ja",
    color: "#e99786",
    description: "Build something that scales.",
    file: "Main.java",
    command: "javac Main.java && java Main",
    structure:
      "Imports precede the public Main class. Statements go in main; methods and nested types go in the class.",
    start: "Create a Java program",
  },
  {
    name: "SQL",
    symbol: "▤",
    color: "#b6a0f2",
    description: "Find the story in your data.",
    file: "queries.sql",
    command:
      "sqlite3 sample.db < queries.sql (create the sample schema first).",
    structure:
      "Each statement ends with a semicolon. SELECT reads, WHERE filters, and JOIN connects tables.",
    start: "Explore a dataset",
  },
  {
    name: "C",
    symbol: "C",
    color: "#94b8d9",
    description: "Get closer to the fundamentals.",
    file: "main.c",
    command: "cc -std=c11 -Wall -Wextra main.c -o app && ./app",
    structure:
      "Headers come first, followed by definitions and int main(void). Main returns an exit status.",
    start: "Create a C program",
  },
  {
    name: "C++",
    symbol: "C+",
    color: "#ac9ee5",
    description: "Power meets possibility.",
    file: "main.cpp",
    command: "c++ -std=c++17 -Wall -Wextra main.cpp -o app && ./app",
    structure:
      "Headers and type or function definitions precede main. Standard-library names use std::.",
    start: "Create a C++ program",
  },
  {
    name: "TypeScript",
    symbol: "TS",
    color: "#77adf1",
    description: "JavaScript, with a little clarity.",
    file: "main.ts",
    command:
      'npm install --save-dev typescript; npx tsc main.ts --strict --target ES2022 --module ESNext; node main.js (set "type": "module" in package.json).',
    structure:
      "Types describe values and functions at build time. External data still needs runtime validation.",
    start: "Start a typed script",
  },
  {
    name: "Bash",
    symbol: "$_",
    color: "#a1cfa1",
    description: "Let your terminal do the work.",
    file: "main.sh",
    command: "bash main.sh",
    structure:
      "The shebang chooses Bash. Strict mode catches many errors; quote expansions and inspect file operations.",
    start: "Automate a task",
  },
];
export const starters: Record<Language, string> = {
  HTML: '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>My Website</title>\n</head>\n<body>\n  <h1>Hello, world!</h1>\n</body>\n</html>',
  CSS: "/* Link this file from your HTML document. */\n* { box-sizing: border-box; }\nbody { margin: 0; font-family: system-ui, sans-serif; }",
  JavaScript:
    '// Run with Node.js, or load as a browser module.\nconsole.log("Hello, world!");',
  Python:
    'def main():\n    print("Hello, world!")\n\nif __name__ == "__main__":\n    main()',
  Java: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, world!");\n    }\n}',
  SQL: "-- Uses the students and courses sample tables.\nSELECT name, score FROM students ORDER BY score DESC;",
  C: '#include <stdio.h>\n\nint main(void) {\n    puts("Hello, world!");\n    return 0;\n}',
  "C++":
    '#include <iostream>\n\nint main() {\n    std::cout << "Hello, world!\\n";\n    return 0;\n}',
  TypeScript:
    'export {};\nconst greeting: string = "Hello, world!";\nconsole.log(greeting);',
  Bash: "#!/usr/bin/env bash\nset -euo pipefail\n\nprintf 'Hello, world!\\n'",
};
export function searchSnippets(
  query: string,
  language?: string,
  difficulty?: string,
  category?: string,
) {
  const aliases: Record<string, string> = {
    call: "",
    how: "",
    to: "",
    make: "",
    a: "",
    an: "",
    change: "",
    background: "background",
    read: "read",
    api: "api fetch request",
    loop: "loop for while",
    button: "button click",
  };
  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => aliases[t] ?? t)
    .filter(Boolean);
  return snippets.filter(
    (s) =>
      (!language || language === "All languages" || s.language === language) &&
      (!difficulty ||
        difficulty === "All levels" ||
        s.difficulty === difficulty) &&
      (!category || category === "All categories" || s.category === category) &&
      terms.every((term) =>
        term
          .split(" ")
          .some((t) =>
            (
              s.language +
              " " +
              s.title +
              " " +
              s.description +
              " " +
              s.category +
              " " +
              s.keywords.join(" ")
            )
              .toLowerCase()
              .includes(t),
          ),
      ),
  );
}

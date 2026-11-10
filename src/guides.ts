import type { Language } from "./types";
export const guides: Record<
  Language,
  { change: string; keep: string; steps: string[] }
> = {
  HTML: {
    change:
      "Change the title text and the visible h1. Add page content between the body tags.",
    keep: "Keep the HTML5 doctype, UTF-8 charset, viewport metadata, and matching html/head/body tags.",
    steps: [
      "Save the file as index.html, with the .html extension.",
      "Double-click the file to open it in a browser.",
      "Add visible elements to body; link CSS and JavaScript in head.",
      "Edit a block field to update the generated source automatically.",
    ],
  },
  CSS: {
    change:
      "Replace selectors and property values to style elements that exist in your HTML.",
    keep: "Keep braces around declarations and semicolons between properties.",
    steps: [
      "Save as styles.css next to your HTML file.",
      'Add <link rel="stylesheet" href="styles.css"> inside the HTML head.',
      "Start with typography, colors, and spacing; then add layout rules.",
      "Open the HTML page and refresh to see the styles.",
    ],
  },
  JavaScript: {
    change:
      "Change the message, and add variables, functions, or browser interactions.",
    keep: "Keep matching braces and parentheses. ES module exports require a module runtime.",
    steps: [
      "Save as main.mjs for Node.js.",
      "Install Node.js 20 or later and run node main.mjs.",
      'For DOM examples, create matching HTML elements and load the script with type="module".',
      "Browser-only globals such as document are unavailable in Node.js.",
    ],
  },
  Python: {
    change:
      "Change the print message and add statements to main, or add reusable functions.",
    keep: "Keep the main guard and use four spaces consistently to indent each block.",
    steps: [
      "Save as main.py.",
      "Install Python 3.10 or later.",
      "Open a terminal in the file directory and run python3 main.py.",
      "Install any listed packages with the same Python interpreter.",
    ],
  },
  Java: {
    change:
      "Change the printed message. Add statements inside main and methods inside Main.",
    keep: "Keep public class Main and public static void main(String[] args).",
    steps: [
      "Save as Main.java; the filename must match the public class.",
      "Install a Java 17 or later JDK, including javac.",
      "Run javac Main.java to compile, then java Main to execute.",
      "Put imports before the class; definitions belong outside main.",
    ],
  },
  SQL: {
    change:
      "Choose columns, filters, and ordering for the sample students and courses tables.",
    keep: "Terminate separate statements with semicolons and use the selected dialect.",
    steps: [
      "Run the starter in the SQLite playground to inspect the sample data.",
      "Use Sample schema to see the available columns and rows.",
      "Export includes sample-schema.sql; load it into a fresh local database first.",
      "PostgreSQL and MySQL examples export for local execution; they do not run in this playground.",
    ],
  },
  C: {
    change:
      "Change the printed text and add statements to main. Add functions before main.",
    keep: "Keep required headers, int main(void), and return 0 for a successful exit.",
    steps: [
      "Save as main.c.",
      "Install a C compiler such as Clang or GCC.",
      "Run cc -std=c11 -Wall -Wextra main.c -o app.",
      "Run ./app. Check input results, allocation failures, and array bounds.",
    ],
  },
  "C++": {
    change:
      "Change the printed text and add standard-library containers or reusable functions.",
    keep: "Keep iostream for std::cout, a valid main function, and the std:: qualifiers.",
    steps: [
      "Save as main.cpp.",
      "Install a compiler with C++17 support.",
      "Run c++ -std=c++17 -Wall -Wextra main.cpp -o app.",
      "Run ./app. Prefer containers and automatic resource cleanup.",
    ],
  },
  TypeScript: {
    change:
      "Change the typed values and add interfaces or functions describing your data.",
    keep: "Keep valid type annotations; export {} marks a standalone module.",
    steps: [
      "Save as main.ts and install TypeScript with npm install --save-dev typescript.",
      "Compile using npx tsc main.ts --strict --target ES2022 --module ESNext.",
      'Set "type": "module" in package.json before running node main.js.',
      "Types are erased when compiled. Validate external values at runtime.",
    ],
  },
  Bash: {
    change:
      "Change the printed message or add quoted variables, conditions, and automation steps.",
    keep: "Keep the Bash shebang and understand how set -euo pipefail affects error handling.",
    steps: [
      "Save as main.sh.",
      "Run bash main.sh in a terminal with Bash 4 or later.",
      "Optional: chmod +x main.sh, then run ./main.sh.",
      "Inspect file-writing commands before running them; quote every filename expansion.",
    ],
  },
};

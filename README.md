# CodeKit

A local-first visual coding reference and structured builder for HTML, CSS, JavaScript, Python, Java, SQL, C, C++, TypeScript, and Bash. React 19, TypeScript, Vite, Tailwind CSS 4, Lucide, CodeMirror 6, SQL.js, and JSZip. No app backend, API keys, accounts, subscriptions, or analytics.

## Run locally

Use Node.js **22.12+** (Node 24 recommended) and npm.

```sh
npm ci
npm run dev
```

Open the URL printed by Vite. To build a static production copy:

```sh
npm run build
npx vite preview
```

Deploy the **contents of `dist/`** with a static host; opening `index.html` through `file://` is not supported because modules and WebAssembly require HTTP. There are no environment variables or backend services to configure.

## What works

- Dashboard, all ten language references, snippet library, three-panel code builder, projects, and quick reference.
- **270 distinct bundled snippets: 27 per language**, with a complete example per language, plus ten getting-started templates and save/run guides.
- Global search (`Cmd/Ctrl+K`), language/category/difficulty filters, favorites, recents, and two-snippet comparisons.
- Editable structured fields on common examples, identifier and value validation, escaping, explanations, topic-specific pitfalls, compatibility information, imports and package requirements, and illustrative sample outputs where useful.
- Scope-aware code composition: HTML head/body, deduplicated imports, Java class definitions, C/C++ definitions before main, and independent statement scopes for Java/C/C++/JavaScript/TypeScript.
- Reordering and removal of blocks; clear rejection of duplicate definitions and HTML IDs.
- Manual source editing, file tabs, create/rename/delete extra files, individual downloads, ZIP exports, project rename/duplicate/delete, and reset with confirmation.
- Automatic versioned LocalStorage persistence, validation of restored state, damaged-data fallback, and visible storage failure messages.
- HTML/CSS/JavaScript preview in a sandboxed iframe with an opaque origin. Preview scripts cannot access app storage. A restrictive preview CSP blocks fetch, form submission, and external script loading. Project-local linked CSS and JS are inlined for the HTML preview.
- Real SQLite in a dedicated Web Worker with seeded students/courses tables, query result tables, reset, and a five-second execution limit. PostgreSQL/MySQL export options explicitly do not claim execution; index syntax is adapted for MySQL.
- Dark/light theme, editor font-size controls, fullscreen workspace, toast confirmations, keyboard-accessible controls, dialog focus containment, and responsive layouts.

## Your first website

1. Open **Languages → HTML → Use starter template**, or choose **Open Code Builder** from the dashboard.
2. Add Navigation, Heading, Paragraph, and Button blocks.
3. Change the labeled text fields. Generated code updates immediately, with visible content inside `body`.
4. Open **Live preview**, copy the code, download `index.html`, or export a ZIP.
5. Return to **My Projects** or the dashboard to resume. Work stays in this browser on this origin.

The starting guide explains what to edit, what syntax to preserve, where code belongs, and how to save and run each language locally.

## Snippet architecture

```text
src/
  types.ts             Shared snippet, field, block, file, and project contracts
  content/*.json       Ten maintainable language registries, 27 entries each
  registry.ts          Registry aggregation, language metadata, starters, search
  guides.ts            Getting-started instructions for all ten languages
  engine.ts            Validation, contextual escaping, compatibility, composition
  storage.ts           Versioned state loading, validation, persistence, favorites
  export.ts            Project ZIP construction
  sql.worker.ts        Isolated in-memory SQLite runtime
  sql-client.ts        Worker lifecycle, request correlation, timeout/reset
  main.tsx             React application, navigation, workspace, dialogs
  style.css            Signal Noir visual system and responsive layouts
  engine.test.ts       Unit, export, parser, real engine and compiler checks
```

A snippet has a unique `id`, `language`, title, description, category, difficulty, keywords, code template, structured fields, imports, insertion region, explanation, use case, optional sample output, pitfalls, requirements, and compatibility notes. Tokens use `{{fieldKey}}`; defaults always produce real code. Fields have a beginner-facing label, default, kind, and required flag.

Add a snippet to its language JSON file with a new ID. Use `head`/`body` for HTML; `definition`/`main` for Java/C/C++; `statement` for other languages. Place dependency declarations in `imports`. The UI reads registry metadata rather than hard-coding a separate page for each language. Adding another language also requires language metadata, a starter, guide, and any language-specific composer/editor support.

The engine renders and escapes fields before composing region-specific structures. It deduplicates imports and scopes independent blocks where the language supports it. Named definitions and repeated HTML IDs are blocked instead of silently generating duplicate declarations. Python imports remain at module scope. SQL statements stay independent; no statement is rewritten into a misleading universal dialect.

The main file follows generated blocks until manually edited. Manual edits are preserved and disable further block insertion until **Reset file** restores generated output. **Reset project to starter** clears the complete project after confirmation. Manually edited source is user-controlled and is not automatically parsed or repaired.

## Tests and validation

```sh
npm test
npm run build
```

**302 tests passed** in the implementation environment. The suite checks every snippet's default rendering and placeholder resolution, invalid identifiers and values, escaping, insertion regions, imports, duplicate-definition rejection, dialect adaptation, the requested natural-language searches, filters, favorite toggling, state persistence/recovery, filenames, Blob downloads, ZIP file contents, explicit empty manual files, and HTML/CSS syntax parsing.

Integration checks compile assembled Python, JavaScript, Bash, C, C++, and TypeScript with real local tools and execute every bundled SQL statement against actual SQLite. The compiler tests require Python 3, a C/C++ compiler (`cc` and `c++`), Bash, and Node on PATH. They syntax-check rather than run arbitrary file/network examples. TypeScript's compiler is an npm dev dependency. Java's class structure is tested, but Java compilation was not verified: this machine has the macOS javac launcher without an installed JDK.

Browser verification completed:

- Responsive dashboard rendered at the default narrow viewport.
- HTML project creation, four-block composition, editable heading/button fields, and rendered iframe output.
- Persistence of blocks and customized fields across a browser refresh.
- Desktop navigation and project reopening at a 1440px viewport.
- SQLite starter query executed in its worker and displayed Alex/92, Sam/88, Taylor/76, and Jordan/58.

The browser automation timed out waiting for a download event and could not reconnect afterward. ZIP contents and Blob download behavior were verified in automated tests; the browser's downloaded file was not inspected. The final guide/metadata/accessibility refinements were built and tested, but a complete final visual regression pass was not possible. Dependency installation finished with **zero npm audit vulnerabilities**.

## Cloudflare Pages

The app is static; it does not require Cloudflare Workers, D1, or a server.

1. Put this source in a Git repository and connect it to a Cloudflare Pages project.
2. Select the Vite framework preset (or configure a custom static build).
3. Set build command to `npm run build`, output directory to `dist`, and root directory to this package's directory.
4. Use Node 22.12+ or 24 for the build.
5. Deploy. Keep `.wasm` and worker assets from `dist/assets/`; they are necessary for SQLite.

Alternatively, upload the built `dist` directory with Cloudflare Pages Direct Upload. Pages does not need the Sites-specific `.openai/hosting.json` file. There is no browser router requiring a custom SPA fallback; sections are internal React navigation. Existing local data is tied to the hostname and will not move automatically between localhost, Sites, and Cloudflare Pages.

## Boundaries and remaining work

- This is a curated reference, not a full language textbook. Every language has 27 substantive snippets, but not every possible subtopic or advanced variant is covered.
- Common snippets expose structured form fields. Examples without fields can be customized in the source editor. A general nested-block editor, configurable function parameters for every example, and arbitrary Python loop-body form fields are not implemented.
- The optional line explanation mode uses local, rule-based educational annotations plus snippet explanations. It is not a full parser-backed explanation of arbitrary edited source. Output examples are explicitly illustrative and do not change for every field edit.
- Composition preserves syntax scaffolding; it is not semantic analysis. Python/Bash blocks can intentionally reuse variables, statements can depend on local assets/input/network, and arbitrary manual edits can contain errors. Name collision detection is conservative for definitions and HTML IDs; it is not a complete cross-snippet symbol resolver.
- Generated blocks have consistent indentation, but there is no full arbitrary-source formatter. The editor supports direct source editing, not bidirectional reconstruction of blocks from code.
- Only SQLite executes SQL in the app. PostgreSQL and MySQL are export-only and were not tested against running servers. The bundled examples mostly use their shared syntax; MySQL index creation is explicitly adapted. No automatic migration of arbitrary dialect-specific custom SQL is attempted.
- Python, Java, C, C++, TypeScript, and Bash code is not executed in the browser. Installation/import/run instructions are shown. The app never claims otherwise.
- Preview supports the active main HTML/CSS/JS file and linked project-local CSS/JS. It is not a module bundler, web server, external API proxy, or general multi-page site runner. Media files must already exist at their referenced URLs or paths.
- SQLite data is ephemeral. LocalStorage projects/favorites persist only in the current browser profile and origin; there is no cloud sync, archive import, or migration from unknown future/legacy versions. Invalid or unknown-version data falls back gracefully; export ZIPs for durable copies.
- Browser storage can be cleared or exceed quota. Source ZIP exports are backups, and are not reopenable as block projects in this release.
- CodeMirror's bundled language support makes the initial JavaScript bundle relatively large; Vite reports a chunk-size warning. Bash has editor highlighting through the default editor mode rather than a dedicated Bash language parser.
- Dialog focus and labels are implemented, but a full screen-reader audit and all-device browser matrix have not been performed.

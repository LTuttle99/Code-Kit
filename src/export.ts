import JSZip from "jszip";
import { compose, schema, safeFilename } from "./engine";
import { languages } from "./registry";
import type { Project } from "./types";
export async function projectArchive(project: Project) {
  const zip = new JSZip();
  for (const f of project.files) {
    if (!safeFilename(f.name)) throw new Error("Invalid filename");
    zip.file(
      f.name,
      f.manual
        ? f.code
        : f.code ||
            (f.id === "main"
              ? compose(project.language, project.blocks, project.dialect)
              : ""),
    );
  }
  if (project.language === "SQL") zip.file("sample-schema.sql", schema);
  zip.file(
    "RUN.txt",
    languages.find((l) => l.name === project.language)!.command,
  );
  return zip;
}

export type Language =
  | "HTML"
  | "CSS"
  | "JavaScript"
  | "Python"
  | "Java"
  | "SQL"
  | "C"
  | "C++"
  | "TypeScript"
  | "Bash";
export type Region = "body" | "head" | "main" | "definition" | "statement";
export interface Field {
  key: string;
  label: string;
  value: string;
  kind: "text" | "identifier" | "number" | "code" | "url";
  required?: boolean;
}
export interface Snippet {
  id: string;
  language: Language;
  title: string;
  description: string;
  category: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  keywords: string[];
  code: string;
  fields: Field[];
  imports: string[];
  region: Region;
  explanation: string;
  usage: string;
  output?: string | null;
  mistakes: string[];
  requirements: string[];
  compatibility: string;
}
export interface Block {
  id: string;
  snippetId: string;
  values: Record<string, string>;
}
export interface ProjectFile {
  id: string;
  name: string;
  code: string;
  manual?: boolean;
}
export interface Project {
  id: string;
  name: string;
  language: Language;
  blocks: Block[];
  files: ProjectFile[];
  updated: string;
  dialect: string;
}

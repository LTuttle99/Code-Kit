export type QueryResult = { columns: string[]; values: unknown[][] };
let worker: Worker | undefined;
let nextId = 0;
const pending = new Map<
  number,
  {
    resolve: (r: QueryResult[]) => void;
    reject: (e: Error) => void;
    timer: ReturnType<typeof setTimeout>;
  }
>();
export function resetSQLite() {
  worker?.terminate();
  worker = undefined;
  for (const p of pending.values()) {
    clearTimeout(p.timer);
    p.reject(new Error("SQLite database reset."));
  }
  pending.clear();
}
export function runSQLite(code: string): Promise<QueryResult[]> {
  if (!worker) {
    worker = new Worker(new URL("./sql.worker.ts", import.meta.url), {
      type: "module",
    });
    worker.onmessage = (event) => {
      const { id, error, results } = event.data;
      const p = pending.get(id);
      if (!p) return;
      clearTimeout(p.timer);
      pending.delete(id);
      if (error) p.reject(new Error(error));
      else p.resolve(results);
    };
    worker.onerror = () => {
      resetSQLite();
    };
  }
  return new Promise((resolve, reject) => {
    const id = ++nextId;
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(
        new Error("Query exceeded 5 seconds. The sample database was reset."),
      );
      resetSQLite();
    }, 5000);
    pending.set(id, { resolve, reject, timer });
    worker!.postMessage({ id, code });
  });
}

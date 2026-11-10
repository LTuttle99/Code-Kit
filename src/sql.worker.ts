import initSqlJs from "sql.js";
import wasmUrl from "sql.js/dist/sql-wasm.wasm?url";
import { schema } from "./engine";
let database: import("sql.js").Database | undefined;
self.onmessage = async (event: MessageEvent<{ id: number; code: string }>) => {
  const { id, code } = event.data;
  try {
    if (!database) {
      const SQL = await initSqlJs({ locateFile: () => wasmUrl });
      database = new SQL.Database();
      database.run(schema);
    }
    const results = database.exec(code);
    self.postMessage({ id, results });
  } catch (error) {
    self.postMessage({ id, error: String(error) });
  }
};

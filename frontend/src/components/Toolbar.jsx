import { CATS } from "../constants.js";
import styles from "./Toolbar.module.css";

export default function Toolbar({ mode, setMode, km, setKm, cat, setCat, onImport, onLogout, msg }) {
  return (
    <div className={styles.bar}>
      <select value={mode} onChange={(e) => setMode(e.target.value)}>
        <option value="add">Click = add place</option>
        <option value="nearby">Click = nearby search</option>
      </select>

      {mode === "nearby" && (
        <label>
          Radius km{" "}
          <input type="number" min="0.1" step="0.5" value={km} onChange={(e) => setKm(e.target.value)} className={styles.km} />
        </label>
      )}

      <select value={cat} onChange={(e) => setCat(e.target.value)}>
        <option value="">All categories</option>
        {CATS.map((c) => <option key={c}>{c}</option>)}
      </select>

      <label>Import <input type="file" accept=".geojson,.json,.csv" onChange={onImport} /></label>
      <button onClick={onLogout}>Log out</button>
      {msg && <span className={styles.msg}>{msg}</span>}
    </div>
  );
}

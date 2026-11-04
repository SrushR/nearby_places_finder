import { CATS } from "../constants.js";
import styles from "./Toolbar.module.css";

export default function Toolbar({ mode, setMode, km, setKm, cat, setCat, onImport, onLogout, msg }) {
  return (
    <div className={styles.bar}>

      <select value={cat} onChange={(e) => setCat(e.target.value)}>
        <option value="">All categories</option>
        {CATS.map((c) => <option key={c}>{c}</option>)}
      </select>

      <button onClick={onLogout}>Log out</button>
      {msg && <span className={styles.msg}>{msg}</span>}
    </div>
  );
}

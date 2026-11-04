import { useEffect, useState } from "react";
import { api } from "../api.js";
import MapView from "../components/MapView.jsx";
import styles from "./MapPage.module.css";

export default function MapPage({ onLogout }) {
  const [msg, setMsg] = useState("");






  const logout = () => { localStorage.removeItem("token"); onLogout(); };

  return (
    <div className={styles.page}>
      <div className={styles.simpleBar}>
        <button onClick={logout}>Log out</button>
        {msg && <span className={styles.msg}>{msg}</span>}
      </div>

      <div className={styles.mapWrap}>
        <MapView
        />
      </div>
    </div>
  );
}

import { useState } from "react";
import { api } from "../api.js";
import styles from "./LoginForm.module.css";

export default function LoginForm({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [f, setF] = useState({ email: "", password: "" });
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    if (!f.email || !f.password) return setErr("Email and password are required");
    try {
      const r = await api(mode === "login" ? "/auth/login" : "/auth/signup", {
        method: "POST",
        body: JSON.stringify(f),
      });
      localStorage.setItem("token", r.token);
      onAuth();
    } catch (e) {
      setErr(e.message);
    }
  };

  return (
    <form onSubmit={submit} className={styles.form}>
      <h2>{mode === "login" ? "Log in" : "Sign up"}</h2>
      <input placeholder="Email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
      <input type="password" placeholder="Password (min 6)" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
      {err && <div className={styles.error}>{err}</div>}
      <button>{mode === "login" ? "Log in" : "Create account"}</button>
      <a href="#" onClick={(e) => { e.preventDefault(); setMode(mode === "login" ? "signup" : "login"); }}>
        {mode === "login" ? "No account? Sign up" : "Have an account? Log in"}
      </a>
    </form>
  );
}

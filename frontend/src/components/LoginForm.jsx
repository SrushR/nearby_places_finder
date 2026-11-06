import { useState } from "react";
import { api } from "../api.js";
import styles from "./LoginForm.module.css";

export default function LoginForm({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [f, setF] = useState({ email: "", password: "" });
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [err, setErr] = useState("");

  const isSignup = mode === "signup";

  const switchMode = () => {
    setMode(isSignup ? "login" : "signup");
    setConfirm("");
    setShow(false);
    setShowConfirm(false);
    setErr("");
  };

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    if (!f.email || !f.password) return setErr("Email and password are required");
    if (isSignup && f.password !== confirm) return setErr("Passwords do not match");
    try {
      const r = await api(isSignup ? "/auth/signup" : "/auth/login", {
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
      <h2>{isSignup ? "Sign up" : "Log in"}</h2>
      <input placeholder="Email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />

      <div className={styles.passWrap}>
        <input
          type={show ? "text" : "password"}
          placeholder="Password (min 6)"
          value={f.password}
          onChange={(e) => setF({ ...f, password: e.target.value })}
        />
        <button
          type="button"
          className={styles.eye}
          onClick={() => setShow(!show)}
          aria-label={show ? "Hide password" : "Show password"}
          title={show ? "Hide password" : "Show password"}
        >
          {show ? "🙈" : "👁️"}
        </button>
      </div>

      {isSignup && (
        <div className={styles.passWrap}>
          <input
            type={showConfirm ? "text" : "password"}
            placeholder="Re-enter password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
          <button
            type="button"
            className={styles.eye}
            onClick={() => setShowConfirm(!showConfirm)}
            aria-label={showConfirm ? "Hide password" : "Show password"}
            title={showConfirm ? "Hide password" : "Show password"}
          >
            {showConfirm ? "🙈" : "👁️"}
          </button>
        </div>
      )}

      {err && <div className={styles.error}>{err}</div>}
      <button>{isSignup ? "Create account" : "Log in"}</button>
      <a href="#" onClick={(e) => { e.preventDefault(); switchMode(); }}>
        {isSignup ? "Have an account? Log in" : "No account? Sign up"}
      </a>
    </form>
  );
}
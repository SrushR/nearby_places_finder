import { useState } from "react";
import LoginForm from "./components/LoginForm.jsx";
import MapPage from "./pages/MapPage.jsx";

export default function App() {
  const [authed, setAuthed] = useState(!!localStorage.getItem("token"));
  return authed ? (
    <MapPage onLogout={() => setAuthed(false)} />
  ) : (
    <LoginForm onAuth={() => setAuthed(true)} />
  );
}

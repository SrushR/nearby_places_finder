import { useEffect, useState } from "react";
import { api } from "../api.js";
import Toolbar from "../components/Toolbar.jsx";
import MapView from "../components/MapView.jsx";
import PlaceForm from "../components/PlaceForm.jsx";
import styles from "./MapPage.module.css";

export default function MapPage({ onLogout }) {
  const [msg, setMsg] = useState("");
  const [places, setPlaces] = useState([]);
  const [draft, setDraft] = useState(null);
  const [form, setForm] = useState({ name: "", category: "restaurant", description: "" });
  const [cat, setCat] = useState("");

  const load = async () => {
    try {
      setPlaces((await api("/places" + (cat ? `?category=${cat}` : ""))).features);
    } catch (e) { setMsg(e.message); }
  };

  useEffect(() => { load(); }, [cat]);


  const onMapClick = async (ll) => {
    setMsg("");
    setDraft(ll);
  };

  const save = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setMsg("Name is required");
    try {
      await api("/places", { method: "POST", body: JSON.stringify({ ...form, lat: draft.lat, lng: draft.lng }) });
      setDraft(null);
      setForm({ ...form, name: "", description: "" });
      setMsg("");
      load();
    } catch (e) { setMsg(e.message); }
  };

  const edit = async (f) => {
    const name = prompt("Name", f.properties.name);
    if (!name) return;
    const description = prompt("Description", f.properties.description) ?? "";
    const [lng, lat] = f.geometry.coordinates;
    try {
      await api(`/places/${f.properties.id}`, {
        method: "PUT",
        body: JSON.stringify({ name, description, category: f.properties.category, lat, lng }),
      });
      load();
    } catch (e) { setMsg(e.message); }
  };

  const del = async (f) => {
    if (!confirm("Delete this place?")) return;
    try { await api(`/places/${f.properties.id}`, { method: "DELETE" }); load(); }
    catch (e) { setMsg(e.message); }
  };


  const logout = () => { localStorage.removeItem("token"); onLogout(); };

  return (
    <div className={styles.page}>
      <Toolbar
        cat={cat}
        setCat={setCat}
        onLogout={logout}
        msg={msg}
      />

      <div className={styles.mapWrap}>
        <MapView
          places={places}
          draft={draft}
          onMapClick={onMapClick}
          onEdit={edit}
          onDelete={del}
        />
        {draft && <PlaceForm form={form} setForm={setForm} onSave={save} onCancel={() => setDraft(null)} />}
      </div>
    </div>
  );
}

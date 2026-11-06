import { useEffect, useState } from "react";
import { api } from "../api.js";
import Toolbar from "../components/Toolbar.jsx";
import MapView from "../components/MapView.jsx";
import PlaceForm from "../components/PlaceForm.jsx";
import NearbyPanel from "../components/NearbyPanel.jsx";
import styles from "./MapPage.module.css";

export default function MapPage({ onLogout }) {
  const [msg, setMsg] = useState("");
  const [places, setPlaces] = useState([]);
  const [draft, setDraft] = useState(null);
  const [form, setForm] = useState({ name: "", category: "restaurant", description: "" });
  const [cat, setCat] = useState("");
  const [mode, setMode] = useState("add"); // "add" | "nearby" | "polygon"
  const [km, setKm] = useState(1);
  const [nearby, setNearby] = useState(null);
  const [center, setCenter] = useState(null);
  const [me, setMe] = useState(null);

  const load = async () => {
    try {
      setPlaces((await api("/places" + (cat ? `?category=${cat}` : ""))).features);
    } catch (e) { setMsg(e.message); }
  };

  useEffect(() => { load(); }, [cat]);

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition((p) => setMe([p.coords.latitude, p.coords.longitude]));
  }, []);

  const changeMode = (m) => { setMode(m); setNearby(null); setCenter(null); setDraft(null); setMsg(""); };

  const onMapClick = async (ll) => {
    if (mode === "polygon") return; // clicks while drawing must not add places
    setMsg("");
    if (mode === "nearby") {
      try {
        setCenter(ll);
        setNearby((await api(`/places/nearby?lat=${ll.lat}&lng=${ll.lng}&km=${km}${cat ? `&category=${cat}`: ""}`)).features);
      } catch (e) { setMsg(e.message); }
      return;
    }
    setDraft(ll);
  };

  const onPolygon = async (ring) => {
    setMsg("");
    try {
      const r = await api("/places/within", {
        method: "POST",
        body: JSON.stringify({ coordinates: [ring] }),
      });
      setNearby(r.features);
    } catch (e) { setMsg(e.message); }
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

  const upload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    try {
      const r = await api("/places/import", { method: "POST", body: fd });
      setMsg(`Imported ${r.added}, rejected ${r.rejected}`);
      load();
    } catch (e) { setMsg(e.message); }
    e.target.value = "";
  };

  const logout = () => { localStorage.removeItem("token"); onLogout(); };

  return (
    <div className={styles.page}>
      <Toolbar
        cat={cat}
        setCat={setCat}
        mode={mode}
        setMode={changeMode}
        km={km}
        setKm={setKm}
        onImport={upload}
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
          center={center}
          km={km}
          me={me}
          drawMode={mode === "polygon"}
          onPolygon={onPolygon}
        />
        {draft && <PlaceForm form={form} setForm={setForm} onSave={save} onCancel={() => setDraft(null)} />}
        {nearby && <NearbyPanel results={nearby} km={km} mode={mode} />}
      </div>
    </div>
  );
}

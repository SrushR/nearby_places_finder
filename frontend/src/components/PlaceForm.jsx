import { CATS } from "../constants.js";
import styles from "./PlaceForm.module.css";

export default function PlaceForm({ form, setForm, onSave, onCancel }) {
  return (
    <form onSubmit={onSave} className={styles.form}>
      <b>New place</b>
      <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
        {CATS.map((c) => <option key={c}>{c}</option>)}
      </select>
      <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      <button>Save</button>
      <button type="button" onClick={onCancel}>Cancel</button>
    </form>
  );
}

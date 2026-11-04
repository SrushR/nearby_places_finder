import styles from "./PlacePopup.module.css";

export default function PlacePopup({ feature, distance, onEdit, onDelete }) {
  const p = feature.properties;
  return (
    <div className={styles.popup}>
      <b>{p.name}</b> <span className={styles.cat}>({p.category})</span>
      <p>{p.description}</p>
      <div className={styles.actions}>
        <button onClick={() => onEdit(feature)}>Edit</button>
        <button onClick={() => onDelete(feature)}>Delete</button>
      </div>
    </div>
  );
}

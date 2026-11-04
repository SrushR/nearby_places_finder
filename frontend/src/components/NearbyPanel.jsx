import styles from "./NearbyPanel.module.css";

export default function NearbyPanel({ results, km }) {
  return (
    <div className={styles.panel}>
      <b>{results.length} places within {km} km</b>
      {results.map((f) => (
        <div key={f.properties.id}>{f.properties.name} – {f.properties.distance_m} m</div>
      ))}
    </div>
  );
}

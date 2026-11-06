import styles from "./NearbyPanel.module.css";

export default function NearbyPanel({ results, km, mode }) {
  const polygon = mode === "polygon";
  return (
    <div className={styles.panel}>
      <b>
        {polygon
          ? `${results.length} places inside the polygon`
          : `${results.length} places within ${km} km`}
      </b>
      {results.map((f) => (
        <div key={f.properties.id}>
          {f.properties.name}
          {polygon ? ` (${f.properties.category})` : ` – ${f.properties.distance_m} m`}
        </div>
      ))}
    </div>
  );
}

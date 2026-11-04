import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents } from "react-leaflet";
import "../leafletSetup.js";
import { DEFAULT_CENTER } from "../constants.js";
import styles from "./MapView.module.css";


export default function MapView({ places = [], draft = null, center = null, km = 1, me = null, onMapClick, onEdit, onDelete }) {
  return (
    <MapContainer center={DEFAULT_CENTER} zoom={12} className={styles.map}>
      <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />

    </MapContainer>
  );
}

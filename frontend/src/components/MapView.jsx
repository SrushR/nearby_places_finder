import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents } from "react-leaflet";
import "../leafletSetup.js";
import { DEFAULT_CENTER } from "../constants.js";
import PlacePopup from "./PlacePopup.jsx";
import styles from "./MapView.module.css";

function ClickHandler({ onClick }) {
  useMapEvents({ click: (e) => onClick(e.latlng) });
  return null;
}

export default function MapView({ places = [], draft = null, center = null, km = 1, me = null, onMapClick, onEdit, onDelete }) {
  return (
    <MapContainer center={DEFAULT_CENTER} zoom={12} className={styles.map}>
      <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
      <ClickHandler onClick={onMapClick} />

        {places.map((f) => (
          <Marker key={f.properties.id} position={[f.geometry.coordinates[1], f.geometry.coordinates[0]]}>
            <Popup>
              <PlacePopup
                feature={f}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            </Popup>
          </Marker>
        ))}

      {draft && <Marker position={draft} />}
    </MapContainer>
  );
}

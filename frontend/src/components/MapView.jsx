import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import "../leafletSetup.js";
import { DEFAULT_CENTER } from "../constants.js";
import { distanceText } from "../utils.js";
import PlacePopup from "./PlacePopup.jsx";
import DrawControl from "./DrawControl.jsx";
import styles from "./MapView.module.css";

function ClickHandler({ onClick }) {
  useMapEvents({ click: (e) => onClick(e.latlng) });
  return null;
}

export default function MapView({ places = [], draft = null, center = null, km = 1, me = null, drawMode = false, onPolygon, onMapClick, onEdit, onDelete }) {
  return (
    <MapContainer center={DEFAULT_CENTER} zoom={12} className={styles.map}>
      <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
      <ClickHandler onClick={onMapClick} />
      {drawMode && <DrawControl onPolygon={onPolygon} />}

      <MarkerClusterGroup chunkedLoading>
        {places.map((f) => (
          <Marker key={f.properties.id} position={[f.geometry.coordinates[1], f.geometry.coordinates[0]]}>
            <Popup>
              <PlacePopup
                feature={f}
                distance={distanceText(me, f)}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            </Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>

      {center && <Circle center={center} radius={km * 1000} />}
      {draft && <Marker position={draft} />}
    </MapContainer>
  );
}

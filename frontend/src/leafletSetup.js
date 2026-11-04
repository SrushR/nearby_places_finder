import L from "leaflet";
import "leaflet/dist/leaflet.css";
import icon from "leaflet/dist/images/marker-icon.png";
import shadow from "leaflet/dist/images/marker-shadow.png";

// Vite breaks Leaflet's default marker image paths, so set them explicitly.
L.Marker.prototype.options.icon = L.icon({
  iconUrl: icon,
  shadowUrl: shadow,
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

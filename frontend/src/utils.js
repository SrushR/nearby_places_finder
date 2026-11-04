import L from "leaflet";

// Distance from the user's browser location to a GeoJSON point feature.
export function distanceText(me, feature) {
  if (!me) return "Location unavailable";
  const [lng, lat] = feature.geometry.coordinates;
  return (L.latLng(me).distanceTo([lat, lng]) / 1000).toFixed(2) + " km from you";
}

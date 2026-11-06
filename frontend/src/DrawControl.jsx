import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "../exposeLeaflet.js";
import "leaflet-draw";
import "leaflet-draw/dist/leaflet.draw.css";

// Adds a "draw polygon" tool. When a shape is finished, calls onPolygon(ring)
// where ring is [[lng, lat], ...] with the first point repeated at the end (GeoJSON).
export default function DrawControl({ onPolygon }) {
  const map = useMap();
  const cb = useRef(onPolygon);
  cb.current = onPolygon;

  useEffect(() => {
    const layers = new L.FeatureGroup().addTo(map);
    const control = new L.Control.Draw({
      position: "topright",
      draw: {
        polygon: { allowIntersection: false, showArea: false },
        rectangle: true,
        polyline: false,
        circle: false,
        marker: false,
        circlemarker: false,
      },
      edit: false,
    });
    map.addControl(control);

    const onCreated = (e) => {
      layers.clearLayers();
      layers.addLayer(e.layer);
      const ring = e.layer.getLatLngs()[0].map((p) => [p.lng, p.lat]);
      ring.push(ring[0]);
      cb.current(ring);
    };
    map.on(L.Draw.Event.CREATED, onCreated);

    return () => {
      map.off(L.Draw.Event.CREATED, onCreated);
      map.removeControl(control);
      map.removeLayer(layers);
    };
  }, [map]);

  return null;
    }

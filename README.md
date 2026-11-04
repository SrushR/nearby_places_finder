# Nearby Places Finder
FastAPI + PostgreSQL/PostGIS + React (Leaflet/OSM).

## Run
1. `docker compose up -d --build`  (starts PostGIS + API on :8000; docs at /docs)
2. `cd frontend && npm install && npm run dev`  (http://localhost:5173)
3. Sign up in the UI. Load sample data with the "Import" button (GeoJSON features need properties: name, category, description).

Env vars: `DATABASE_URL`, `JWT_SECRET` (set a real secret in production), frontend `VITE_API`.

## Done / Skipped / Next
Done: auth (bcrypt+JWT), CRUD, filter, GeoJSON API, nearby (ST_DWithin), distance (geolocation), bulk import, clustering, spatial index (GiST).
Skipped: polygon search UI (endpoint `/places/within` exists), tests, deploy.
Next: leaflet-draw for polygons, pytest suite, 10k-point benchmark with EXPLAIN ANALYZE.


Database: PostgreSQL 16+ PostGIS, db "places", user "app"

-[x] Auth:signup,login,bcrypt,JWT 
-[x]Places CRUD with GeoJSON API 
-[x] Nearby search (PostGIS ST_DWithin)
-[x] Nearby search endpoint
-[x] Auth: signup,login,logout(bcrypt+JWT)
-[x] Leaflet map with OpenStreetMap titles
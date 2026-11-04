# Nearby Places Finder

A full-stack web app where logged-in users can add, view, search and manage places on a map.

**Stack:** React + Leaflet (OpenStreetMap tiles) · FastAPI · PostgreSQL + PostGIS · JWT auth (bcrypt-hashed passwords)

## Features

- Sign up / log in with email and password (bcrypt hashing, JWT), log out, redirect to login when not authenticated
- Interactive map; click the map to add a place (name, category, description)
- Markers with a details popup; edit and delete places
- Filter by category (hospital, school, restaurant, shop)
- Each user sees, edits and deletes only their own places
- REST API returning places as GeoJSON
- Validation with clear error messages (empty fields, invalid coordinates, wrong login, API failures)
- Spatial features (done in PostGIS): nearby search within X km, distance from your browser location, bulk import (GeoJSON/CSV), marker clustering

## Project structure

```
backend/     FastAPI app (main.py), Dockerfile, requirements.txt
frontend/    React + Vite app (Leaflet map)
data/        sample_places.geojson (test data)
docker-compose.yml   PostGIS database + API
```

## Setup

### Option A: Docker for database + API (recommended)

1. `docker compose up -d --build`
   This starts PostGIS on port 5432 and the API on http://localhost:8000 (API docs at http://localhost:8000/docs not tested fully). Tables and the PostGIS extension are created automatically on startup.
2. In a second terminal:
   ```
   cd frontend
   npm install
   npm run dev
   ```
3. Open http://localhost:5173

### Option B: Without Docker

1. Install PostgreSQL with PostGIS. Create a database `places` and a user `app` with password `app` (or set `DATABASE_URL`).
2. Backend:
   ```
   cd backend
   python -m venv venv
   venv\Scripts\activate        # Windows  (Linux/Mac: source venv/bin/activate)
   pip install -r requirements.txt
   uvicorn main:app --reload
   ```
3. Frontend: same as step 2 in Option A.

## Environment variables

| Variable | Used by | Default | Purpose |
|---|---|---|---|
| `DATABASE_URL` | backend | `postgresql+psycopg2://app:app@localhost:5432/places` | Database connection |
| `JWT_SECRET` | backend | a development-only value | Signs login tokens. Set your own long random value for any real deployment. |
| `VITE_API` | frontend | `http://localhost:8000` | Backend URL |

No real secrets are committed. The defaults are for local development only.

## Test login

There is no pre-made account. Create one in the app: click **"No account? Sign up"** and use for example:

- Email: `test@example.com`
- Password: `Test@1234` (minimum 6 characters)

## Loading the sample data

1. Log in.
2. Click **Import** in the toolbar and choose `data/sample_places.geojson`.
3. The app reports how many places were imported or rejected, and the markers appear on the map.

`data/sample_places.geojson` is a generated test file with 40 points around Pune (10 per category). The official GeoPulse sample file can be loaded the same way.

Import format:
- **GeoJSON:** Point features with properties `name`, `category`, `description`; coordinates are `[longitude, latitude]`.
- **CSV:** columns `name,category,description,lat,lng`.
- Rows with invalid coordinates, an empty name or an unknown category are rejected and counted in the result message.

## API overview

All place routes require `Authorization: Bearer <token>`.

| Method | Route | Description |
|---|---|---|
| POST | `/auth/signup` | Create account, returns token |
| POST | `/auth/login` | Log in, returns token |
| GET | `/places?category=` | Your places as a GeoJSON FeatureCollection |
| POST | `/places` | Add a place (`name, category, description, lat, lng`) |
| PUT | `/places/{id}` | Update a place |
| DELETE | `/places/{id}` | Delete a place |
| GET | `/places/nearby?lat=&lng=&km=` | Places within X km, sorted by distance (PostGIS `ST_DWithin`) |
| POST | `/places/within` | Places inside a GeoJSON polygon (PostGIS `ST_Covers`) |
| POST | `/places/import` | Bulk import GeoJSON or CSV |

Interactive docs: http://localhost:8000/docs

## What I completed

- All required features: authentication, map view, add/show/edit/delete places, category filter, GeoJSON REST API, validation and error messages
- Spatial features: nearby search, distance from browser location, bulk import with invalid-row rejection, marker clustering
- PostGIS `geography` column with a spatial (GiST) index
- Docker setup for the database and API

## What I skipped

- Polygon search UI (the backend endpoint `/places/within` is implemented; only the map drawing tool is missing)
- Automated tests
- Deployment / live link
- Admin UI (the `users.is_admin` flag and admin-sees-all-places logic exist in the backend, but there is no sign-up or UI path to create an admin)
- 10,000-point benchmark of the spatial query

## What I would improve with more time

- Add `leaflet-draw` so users can draw a polygon and list places inside it
- Add a pytest suite for auth, place ownership and the spatial endpoints
- Benchmark the nearby query with 10,000+ points using `EXPLAIN ANALYZE`
- Replace the `prompt()`-based edit with a proper edit form that can also change the category
- Compute the distance to a place in the database as well, and show clearer messages when location permission is denied
- Restrict CORS and use a strong `JWT_SECRET` for deployment

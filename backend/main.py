import os, io, csv, json
from datetime import datetime, timedelta, timezone
from typing import Optional, List
import bcrypt, jwt
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import create_engine, Column, Integer, String, Text, ForeignKey, func
from sqlalchemy.orm import sessionmaker, declarative_base, Session
from geoalchemy2 import Geography
from geoalchemy2.shape import to_shape

DB_URL = os.getenv("DATABASE_URL", "postgresql+psycopg2://app:app@localhost:5432/places")
SECRET = os.getenv("JWT_SECRET", "dev-secret")
CATEGORIES = {"hospital", "school", "restaurant", "shop"}

engine = create_engine(DB_URL)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    is_admin = Column(Integer, default=0)  # optional admin role

class Place(Base):
    __tablename__ = "places"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False)
    description = Column(Text, default="")
    # Geography => distances in meters; GiST spatial index is created automatically
    geom = Column(Geography("POINT", srid=4326), nullable=False)

def init_db():
    with engine.begin() as c:
        c.exec_driver_sql("CREATE EXTENSION IF NOT EXISTS postgis")
    Base.metadata.create_all(engine)

app = FastAPI(title="Nearby Places Finder")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

@app.on_event("startup")
def startup():
    init_db()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

bearer = HTTPBearer(auto_error=False)

def current_user(cred: Optional[HTTPAuthorizationCredentials] = Depends(bearer), db: Session = Depends(get_db)):
    if not cred:
        raise HTTPException(401, "Not authenticated")
    try:
        uid = int(jwt.decode(cred.credentials, SECRET, algorithms=["HS256"])["sub"])
    except Exception:
        raise HTTPException(401, "Invalid or expired token")
    user = db.get(User, uid)
    if not user:
        raise HTTPException(401, "User not found")
    return user

# ---------- schemas ----------
class Creds(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)

class PlaceIn(BaseModel):
    name: str = Field(min_length=1)
    category: str
    description: str = ""
    lat: float = Field(ge=-90, le=90)
    lng: float = Field(ge=-180, le=180)

class PolygonIn(BaseModel):
    coordinates: List[List[List[float]]]  # GeoJSON polygon coordinates

def feature(p: Place, extra=None):
    pt = to_shape(p.geom)
    props = {"id": p.id, "name": p.name, "category": p.category, "description": p.description}
    if extra: props.update(extra)
    return {"type": "Feature", "geometry": {"type": "Point", "coordinates": [pt.x, pt.y]}, "properties": props}

def collection(feats):
    return {"type": "FeatureCollection", "features": feats}

def point_wkt(lng, lat):
    return func.ST_GeogFromText(f"SRID=4326;POINT({lng} {lat})")

def check_category(c):
    if c not in CATEGORIES:
        raise HTTPException(422, f"Category must be one of {sorted(CATEGORIES)}")

def own(db, user):
    q = db.query(Place)
    return q if user.is_admin else q.filter(Place.user_id == user.id)

# ---------- auth ----------
def make_token(uid):
    return jwt.encode({"sub": str(uid), "exp": datetime.now(timezone.utc) + timedelta(hours=12)}, SECRET, algorithm="HS256")

@app.post("/auth/signup")
def signup(c: Creds, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == c.email.lower()).first():
        raise HTTPException(409, "Email already registered")
    u = User(email=c.email.lower(), password_hash=bcrypt.hashpw(c.password.encode(), bcrypt.gensalt()).decode())
    db.add(u); db.commit()
    return {"token": make_token(u.id)}

@app.post("/auth/login")
def login(c: Creds, db: Session = Depends(get_db)):
    u = db.query(User).filter(User.email == c.email.lower()).first()
    if not u or not bcrypt.checkpw(c.password.encode(), u.password_hash.encode()):
        raise HTTPException(401, "Wrong email or password")
    return {"token": make_token(u.id)}

# ---------- places CRUD ----------
@app.get("/places")
def list_places(category: Optional[str] = None, db: Session = Depends(get_db), user: User = Depends(current_user)):
    q = own(db, user)
    if category:
        q = q.filter(Place.category == category)
    return collection([feature(p) for p in q.all()])

@app.post("/places", status_code=201)
def create_place(p: PlaceIn, db: Session = Depends(get_db), user: User = Depends(current_user)):
    check_category(p.category)
    row = Place(user_id=user.id, name=p.name.strip(), category=p.category, description=p.description, geom=point_wkt(p.lng, p.lat))
    db.add(row); db.commit(); db.refresh(row)
    return feature(row)

@app.put("/places/{pid}")
def update_place(pid: int, p: PlaceIn, db: Session = Depends(get_db), user: User = Depends(current_user)):
    check_category(p.category)
    row = own(db, user).filter(Place.id == pid).first()
    if not row: raise HTTPException(404, "Place not found")
    row.name, row.category, row.description = p.name.strip(), p.category, p.description
    row.geom = point_wkt(p.lng, p.lat)
    db.commit(); db.refresh(row)
    return feature(row)

@app.delete("/places/{pid}", status_code=204)
def delete_place(pid: int, db: Session = Depends(get_db), user: User = Depends(current_user)):
    row = own(db, user).filter(Place.id == pid).first()
    if not row: raise HTTPException(404, "Place not found")
    db.delete(row); db.commit()

# ---------- spatial (all done in PostGIS) ----------
@app.get("/places/nearby")
def nearby(lat: float, lng: float, km: float = 1, db: Session = Depends(get_db), user: User = Depends(current_user)):
    if not (-90 <= lat <= 90 and -180 <= lng <= 180) or km <= 0:
        raise HTTPException(422, "Invalid coordinates or radius")
    center = point_wkt(lng, lat)
    dist = func.ST_Distance(Place.geom, center)
    rows = own(db, user).add_columns(dist.label("d")).filter(func.ST_DWithin(Place.geom, center, km * 1000)).order_by(dist).all()
    return collection([feature(p, {"distance_m": round(d)}) for p, d in rows])

@app.post("/places/within")
def within(poly: PolygonIn, db: Session = Depends(get_db), user: User = Depends(current_user)):
    geojson = json.dumps({"type": "Polygon", "coordinates": poly.coordinates})
    area = func.ST_GeogFromText(func.concat("SRID=4326;", func.ST_AsText(func.ST_GeomFromGeoJSON(geojson))))
    rows = own(db, user).filter(func.ST_Covers(area, Place.geom)).all()
    return collection([feature(p) for p in rows])

@app.post("/places/import")
async def import_places(file: UploadFile = File(...), db: Session = Depends(get_db), user: User = Depends(current_user)):
    text = (await file.read()).decode("utf-8-sig")
    items, errors = [], []
    try:
        if file.filename.lower().endswith(".csv"):
            for i, r in enumerate(csv.DictReader(io.StringIO(text)), 1):
                items.append((i, r.get("name"), r.get("category"), r.get("description", ""), r.get("lat"), r.get("lng")))
        else:
            for i, f in enumerate(json.loads(text).get("features", []), 1):
                pr, g = f.get("properties") or {}, f.get("geometry") or {}
                c = g.get("coordinates") or [None, None]
                items.append((i, pr.get("name"), pr.get("category"), pr.get("description", ""), c[1] if len(c) > 1 else None, c[0]))
    except Exception:
        raise HTTPException(400, "Could not parse file")
    added = 0
    for i, name, cat, desc, lat, lng in items:
        try:
            lat, lng = float(lat), float(lng)
            assert -90 <= lat <= 90 and -180 <= lng <= 180 and name and cat in CATEGORIES
        except Exception:
            errors.append(f"Row {i}: invalid data"); continue
        db.add(Place(user_id=user.id, name=name, category=cat, description=desc or "", geom=point_wkt(lng, lat)))
        added += 1
    db.commit()
    return {"added": added, "rejected": len(errors), "errors": errors[:20]}

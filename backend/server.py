from fastapi import FastAPI, APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
from pathlib import Path
from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Literal
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
from jose import JWTError, jwt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

JWT_SECRET = os.environ.get("JWT_SECRET_KEY", "rangkul-dev-secret-change-me")
JWT_ALGO = "HS256"
JWT_EXPIRE_MIN = 60 * 24 * 7  # 7 days

pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer = HTTPBearer(auto_error=False)

app = FastAPI()
api = APIRouter(prefix="/api")

# ---------- Models ----------
UserRole = Literal["patient", "expert"]

class UserPublic(BaseModel):
    id: str
    email: EmailStr
    role: UserRole
    full_name: str
    avatar_url: Optional[str] = None
    points: int = 0
    balance: int = 0
    is_online: bool = False
    bio: Optional[str] = None
    specialty: Optional[str] = None
    price_per_session: int = 0
    rating: float = 4.8
    city: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None

class RegisterPayload(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: UserRole
    specialty: Optional[str] = None
    price_per_session: Optional[int] = 0
    city: Optional[str] = None

class LoginPayload(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserPublic

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    specialty: Optional[str] = None
    price_per_session: Optional[int] = None
    city: Optional[str] = None

class OnlineToggle(BaseModel):
    is_online: bool

class AppointmentCreate(BaseModel):
    expert_id: str
    category: str
    schedule_date: str  # ISO string
    method: Literal["zoom", "clinic"]
    total_price: int
    payment_method: str

class AppointmentStatus(BaseModel):
    status: Literal["pending", "accepted", "rejected", "completed"]

class Appointment(BaseModel):
    id: str
    patient_id: str
    expert_id: str
    patient_name: str
    expert_name: str
    expert_avatar: Optional[str] = None
    category: str
    schedule_date: str
    status: str
    method: str
    total_price: int
    payment_method: str
    created_at: str

class MessageCreate(BaseModel):
    receiver_id: str
    content: str

class Message(BaseModel):
    id: str
    sender_id: str
    receiver_id: str
    content: str
    created_at: str

class MoodCreate(BaseModel):
    mood: Literal["happy", "neutral", "sad"]
    note: Optional[str] = None

class JournalCreate(BaseModel):
    content: str
    mood: Optional[str] = None

class WorkingHoursUpdate(BaseModel):
    hours: dict  # {monday: {start, end, active}, ...}

class WithdrawCreate(BaseModel):
    amount: int
    bank: str
    account_no: str

# ---------- Helpers ----------
def _now_iso():
    return datetime.now(timezone.utc).isoformat()

def hash_pw(p: str) -> str:
    return pwd_ctx.hash(p)

def verify_pw(p: str, h: str) -> bool:
    return pwd_ctx.verify(p, h)

def create_token(uid: str, role: str) -> str:
    payload = {
        "sub": uid,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=JWT_EXPIRE_MIN),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)

def user_to_public(doc) -> UserPublic:
    return UserPublic(
        id=doc["id"],
        email=doc["email"],
        role=doc["role"],
        full_name=doc.get("full_name", ""),
        avatar_url=doc.get("avatar_url"),
        points=doc.get("points", 0),
        balance=doc.get("balance", 0),
        is_online=doc.get("is_online", False),
        bio=doc.get("bio"),
        specialty=doc.get("specialty"),
        price_per_session=doc.get("price_per_session", 0),
        rating=doc.get("rating", 4.8),
        city=doc.get("city"),
        lat=doc.get("lat"),
        lng=doc.get("lng"),
    )

async def get_current_user(cred: Optional[HTTPAuthorizationCredentials] = Depends(bearer)):
    if cred is None or cred.scheme.lower() != "bearer":
        raise HTTPException(401, "Not authenticated")
    try:
        payload = jwt.decode(cred.credentials, JWT_SECRET, algorithms=[JWT_ALGO])
        uid = payload.get("sub")
    except JWTError:
        raise HTTPException(401, "Invalid token")
    doc = await db.users.find_one({"id": uid}, {"_id": 0})
    if not doc:
        raise HTTPException(401, "User not found")
    return doc

# ---------- Routes ----------
@api.get("/")
async def root():
    return {"message": "Rangkul API"}

@api.post("/auth/register", response_model=TokenResponse)
async def register(p: RegisterPayload):
    existing = await db.users.find_one({"email": p.email})
    if existing:
        raise HTTPException(400, "Email already registered")
    uid = str(uuid.uuid4())
    doc = {
        "id": uid,
        "email": p.email,
        "hashed_password": hash_pw(p.password),
        "full_name": p.full_name,
        "role": p.role,
        "avatar_url": None,
        "points": 250 if p.role == "patient" else 0,
        "balance": 0,
        "is_online": False,
        "bio": "",
        "specialty": p.specialty or ("" if p.role == "patient" else "Psikolog Klinis"),
        "price_per_session": p.price_per_session or (0 if p.role == "patient" else 150000),
        "rating": 4.8,
        "city": p.city or "Jakarta",
        "lat": -6.2 + (hash(uid) % 100) / 1000,
        "lng": 106.8 + (hash(uid) % 100) / 1000,
        "created_at": _now_iso(),
    }
    await db.users.insert_one(doc)
    token = create_token(uid, p.role)
    return TokenResponse(access_token=token, user=user_to_public(doc))

@api.post("/auth/login", response_model=TokenResponse)
async def login(p: LoginPayload):
    doc = await db.users.find_one({"email": p.email}, {"_id": 0})
    if not doc or not verify_pw(p.password, doc["hashed_password"]):
        raise HTTPException(401, "Invalid credentials")
    token = create_token(doc["id"], doc["role"])
    return TokenResponse(access_token=token, user=user_to_public(doc))

@api.get("/auth/me", response_model=UserPublic)
async def me(u=Depends(get_current_user)):
    return user_to_public(u)

@api.patch("/users/me", response_model=UserPublic)
async def update_me(p: ProfileUpdate, u=Depends(get_current_user)):
    upd = {k: v for k, v in p.dict().items() if v is not None}
    if upd:
        await db.users.update_one({"id": u["id"]}, {"$set": upd})
    doc = await db.users.find_one({"id": u["id"]}, {"_id": 0})
    return user_to_public(doc)

@api.patch("/users/me/online", response_model=UserPublic)
async def toggle_online(p: OnlineToggle, u=Depends(get_current_user)):
    await db.users.update_one({"id": u["id"]}, {"$set": {"is_online": p.is_online}})
    doc = await db.users.find_one({"id": u["id"]}, {"_id": 0})
    return user_to_public(doc)

@api.get("/experts", response_model=List[UserPublic])
async def list_experts(category: Optional[str] = None):
    q = {"role": "expert"}
    docs = await db.users.find(q, {"_id": 0}).to_list(200)
    return [user_to_public(d) for d in docs]

@api.get("/experts/{eid}", response_model=UserPublic)
async def get_expert(eid: str):
    doc = await db.users.find_one({"id": eid, "role": "expert"}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Expert not found")
    return user_to_public(doc)

# Appointments
@api.post("/appointments", response_model=Appointment)
async def create_appointment(p: AppointmentCreate, u=Depends(get_current_user)):
    if u["role"] != "patient":
        raise HTTPException(403, "Only patients can book")
    expert = await db.users.find_one({"id": p.expert_id, "role": "expert"}, {"_id": 0})
    if not expert:
        raise HTTPException(404, "Expert not found")
    doc = {
        "id": str(uuid.uuid4()),
        "patient_id": u["id"],
        "expert_id": p.expert_id,
        "patient_name": u["full_name"],
        "expert_name": expert["full_name"],
        "expert_avatar": expert.get("avatar_url"),
        "category": p.category,
        "schedule_date": p.schedule_date,
        "status": "pending",
        "method": p.method,
        "total_price": p.total_price,
        "payment_method": p.payment_method,
        "created_at": _now_iso(),
    }
    await db.appointments.insert_one(doc)
    doc.pop("_id", None)
    return Appointment(**doc)

@api.get("/appointments", response_model=List[Appointment])
async def list_appointments(status_filter: Optional[str] = None, u=Depends(get_current_user)):
    q = {"patient_id" if u["role"] == "patient" else "expert_id": u["id"]}
    if status_filter:
        q["status"] = status_filter
    docs = await db.appointments.find(q, {"_id": 0}).sort("schedule_date", 1).to_list(500)
    return [Appointment(**d) for d in docs]

@api.patch("/appointments/{aid}/status", response_model=Appointment)
async def update_status(aid: str, p: AppointmentStatus, u=Depends(get_current_user)):
    doc = await db.appointments.find_one({"id": aid}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Appointment not found")
    if u["role"] != "expert" or doc["expert_id"] != u["id"]:
        raise HTTPException(403, "Hanya psikolog yang dapat mengubah status janji ini")
    await db.appointments.update_one({"id": aid}, {"$set": {"status": p.status}})
    # On accepted, add expert balance after completed; on completed, increment balance
    if p.status == "completed":
        await db.users.update_one(
            {"id": doc["expert_id"]},
            {"$inc": {"balance": doc["total_price"]}},
        )
    doc = await db.appointments.find_one({"id": aid}, {"_id": 0})
    return Appointment(**doc)

# Messages (polling)
@api.post("/messages", response_model=Message)
async def send_message(p: MessageCreate, u=Depends(get_current_user)):
    doc = {
        "id": str(uuid.uuid4()),
        "sender_id": u["id"],
        "receiver_id": p.receiver_id,
        "content": p.content,
        "created_at": _now_iso(),
    }
    await db.messages.insert_one(doc)
    doc.pop("_id", None)
    return Message(**doc)

@api.get("/messages/{peer_id}", response_model=List[Message])
async def get_thread(peer_id: str, u=Depends(get_current_user)):
    q = {
        "$or": [
            {"sender_id": u["id"], "receiver_id": peer_id},
            {"sender_id": peer_id, "receiver_id": u["id"]},
        ]
    }
    docs = await db.messages.find(q, {"_id": 0}).sort("created_at", 1).to_list(500)
    return [Message(**d) for d in docs]

@api.get("/chats")
async def list_chats(u=Depends(get_current_user)):
    """Return distinct chat peers with last message preview."""
    pipeline = [
        {"$match": {"$or": [{"sender_id": u["id"]}, {"receiver_id": u["id"]}]}},
        {"$sort": {"created_at": -1}},
    ]
    docs = await db.messages.aggregate(pipeline).to_list(1000)
    peers = {}
    for d in docs:
        peer = d["receiver_id"] if d["sender_id"] == u["id"] else d["sender_id"]
        if peer not in peers:
            peers[peer] = d
    result = []
    for peer_id, last in peers.items():
        peer_doc = await db.users.find_one({"id": peer_id}, {"_id": 0})
        if not peer_doc:
            continue
        result.append({
            "peer_id": peer_id,
            "peer_name": peer_doc.get("full_name", ""),
            "peer_avatar": peer_doc.get("avatar_url"),
            "peer_role": peer_doc.get("role"),
            "last_message": last["content"],
            "last_time": last["created_at"],
        })
    return result

# Mood
@api.post("/moods")
async def log_mood(p: MoodCreate, u=Depends(get_current_user)):
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": u["id"],
        "mood": p.mood,
        "note": p.note,
        "created_at": _now_iso(),
    }
    await db.moods.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api.get("/moods")
async def list_moods(u=Depends(get_current_user)):
    docs = await db.moods.find({"user_id": u["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return docs

# Journal
@api.post("/journals")
async def create_journal(p: JournalCreate, u=Depends(get_current_user)):
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": u["id"],
        "content": p.content,
        "mood": p.mood,
        "created_at": _now_iso(),
    }
    await db.journals.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api.get("/journals")
async def list_journals(u=Depends(get_current_user)):
    docs = await db.journals.find({"user_id": u["id"]}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return docs

# Working hours
@api.put("/users/me/hours")
async def set_hours(p: WorkingHoursUpdate, u=Depends(get_current_user)):
    await db.users.update_one({"id": u["id"]}, {"$set": {"working_hours": p.hours}})
    return {"ok": True, "hours": p.hours}

@api.get("/users/me/hours")
async def get_hours(u=Depends(get_current_user)):
    doc = await db.users.find_one({"id": u["id"]}, {"_id": 0})
    return doc.get("working_hours", {})

# Withdraw
@api.post("/withdrawals")
async def create_withdraw(p: WithdrawCreate, u=Depends(get_current_user)):
    if u["role"] != "expert":
        raise HTTPException(403, "Only experts")
    if p.amount > u.get("balance", 0):
        raise HTTPException(400, "Saldo tidak cukup")
    doc = {
        "id": str(uuid.uuid4()),
        "expert_id": u["id"],
        "amount": p.amount,
        "bank": p.bank,
        "account_no": p.account_no,
        "status": "processing",
        "created_at": _now_iso(),
    }
    await db.withdrawals.insert_one(doc)
    await db.users.update_one({"id": u["id"]}, {"$inc": {"balance": -p.amount}})
    doc.pop("_id", None)
    return doc

# Dashboard stats for expert
@api.get("/expert/stats")
async def expert_stats(u=Depends(get_current_user)):
    if u["role"] != "expert":
        raise HTTPException(403, "Experts only")
    completed = await db.appointments.count_documents({"expert_id": u["id"], "status": "completed"})
    pending = await db.appointments.count_documents({"expert_id": u["id"], "status": "pending"})
    accepted = await db.appointments.count_documents({"expert_id": u["id"], "status": "accepted"})
    return {
        "sesi_selesai": completed,
        "balance": u.get("balance", 0),
        "pending": pending,
        "accepted": accepted,
    }

app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

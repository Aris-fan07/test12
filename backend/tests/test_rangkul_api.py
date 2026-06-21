"""Rangkul backend API tests - covers auth, experts, appointments, messages, moods, journals, hours, withdrawals, expert stats."""
import os
import uuid
import time
import pytest
import requests

BASE_URL = os.environ.get("EXPO_BACKEND_URL", "http://localhost:8001").rstrip("/")
API = f"{BASE_URL}/api"

SUFFIX = uuid.uuid4().hex[:8]
PATIENT_EMAIL = f"test_patient_{SUFFIX}@rangkul.com"
EXPERT_EMAIL = f"test_expert_{SUFFIX}@rangkul.com"
PASSWORD = "password123"


@pytest.fixture(scope="module")
def state():
    return {}


# ---------------- Auth ----------------
class TestAuth:
    def test_root(self):
        r = requests.get(f"{API}/")
        assert r.status_code == 200
        assert r.json().get("message") == "Rangkul API"

    def test_register_patient(self, state):
        r = requests.post(f"{API}/auth/register", json={
            "email": PATIENT_EMAIL,
            "password": PASSWORD,
            "full_name": "TEST Patient",
            "role": "patient",
        })
        assert r.status_code == 200, r.text
        d = r.json()
        assert "access_token" in d and d["user"]["role"] == "patient"
        assert d["user"]["points"] == 250  # patient gets 250 starter points
        assert "_id" not in d["user"]
        state["patient_token"] = d["access_token"]
        state["patient_id"] = d["user"]["id"]

    def test_register_expert(self, state):
        r = requests.post(f"{API}/auth/register", json={
            "email": EXPERT_EMAIL,
            "password": PASSWORD,
            "full_name": "TEST Expert",
            "role": "expert",
            "specialty": "Psikolog Klinis",
            "price_per_session": 150000,
            "city": "Jakarta",
        })
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["user"]["role"] == "expert"
        assert d["user"]["price_per_session"] == 150000
        state["expert_token"] = d["access_token"]
        state["expert_id"] = d["user"]["id"]

    def test_register_duplicate(self, state):
        r = requests.post(f"{API}/auth/register", json={
            "email": PATIENT_EMAIL, "password": PASSWORD,
            "full_name": "dup", "role": "patient",
        })
        assert r.status_code == 400

    def test_login_wrong_password(self):
        r = requests.post(f"{API}/auth/login", json={
            "email": PATIENT_EMAIL, "password": "wrongpass"})
        assert r.status_code == 401

    def test_login_success(self, state):
        r = requests.post(f"{API}/auth/login", json={
            "email": PATIENT_EMAIL, "password": PASSWORD})
        assert r.status_code == 200
        assert r.json()["user"]["email"] == PATIENT_EMAIL

    def test_me_no_token(self):
        r = requests.get(f"{API}/auth/me")
        assert r.status_code in (401, 403)

    def test_me_invalid_token(self):
        r = requests.get(f"{API}/auth/me", headers={"Authorization": "Bearer not.a.jwt"})
        assert r.status_code == 401

    def test_me_with_token(self, state):
        h = {"Authorization": f"Bearer {state['patient_token']}"}
        r = requests.get(f"{API}/auth/me", headers=h)
        assert r.status_code == 200
        assert r.json()["id"] == state["patient_id"]


# ---------------- Experts ----------------
class TestExperts:
    def test_list_experts(self, state):
        r = requests.get(f"{API}/experts")
        assert r.status_code == 200
        ids = [e["id"] for e in r.json()]
        assert state["expert_id"] in ids
        for e in r.json():
            assert "_id" not in e

    def test_get_expert(self, state):
        r = requests.get(f"{API}/experts/{state['expert_id']}")
        assert r.status_code == 200
        assert r.json()["role"] == "expert"

    def test_get_expert_not_found(self):
        r = requests.get(f"{API}/experts/does-not-exist")
        assert r.status_code == 404


# ---------------- Appointments ----------------
class TestAppointments:
    def test_create_appointment(self, state):
        h = {"Authorization": f"Bearer {state['patient_token']}"}
        r = requests.post(f"{API}/appointments", headers=h, json={
            "expert_id": state["expert_id"],
            "category": "Konsultasi",
            "schedule_date": "2026-02-10T10:00:00Z",
            "method": "zoom",
            "total_price": 150000,
            "payment_method": "ewallet",
        })
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["status"] == "pending" and d["patient_id"] == state["patient_id"]
        assert "_id" not in d
        state["appt_id"] = d["id"]

    def test_expert_cannot_book(self, state):
        h = {"Authorization": f"Bearer {state['expert_token']}"}
        r = requests.post(f"{API}/appointments", headers=h, json={
            "expert_id": state["expert_id"], "category": "x",
            "schedule_date": "2026-02-10T10:00:00Z", "method": "zoom",
            "total_price": 100, "payment_method": "ewallet"})
        assert r.status_code == 403

    def test_list_appointments_patient(self, state):
        h = {"Authorization": f"Bearer {state['patient_token']}"}
        r = requests.get(f"{API}/appointments", headers=h)
        assert r.status_code == 200
        assert any(a["id"] == state["appt_id"] for a in r.json())

    def test_list_appointments_expert(self, state):
        h = {"Authorization": f"Bearer {state['expert_token']}"}
        r = requests.get(f"{API}/appointments", headers=h)
        assert r.status_code == 200
        assert any(a["id"] == state["appt_id"] for a in r.json())

    def test_expert_accept_appointment(self, state):
        h = {"Authorization": f"Bearer {state['expert_token']}"}
        r = requests.patch(f"{API}/appointments/{state['appt_id']}/status",
                           headers=h, json={"status": "accepted"})
        assert r.status_code == 200
        assert r.json()["status"] == "accepted"

    def test_expert_complete_and_balance(self, state):
        h = {"Authorization": f"Bearer {state['expert_token']}"}
        r = requests.patch(f"{API}/appointments/{state['appt_id']}/status",
                           headers=h, json={"status": "completed"})
        assert r.status_code == 200
        # verify balance incremented
        me = requests.get(f"{API}/auth/me", headers=h).json()
        assert me["balance"] >= 150000
        state["expert_balance"] = me["balance"]


# ---------------- Messages ----------------
class TestMessages:
    def test_send_and_thread(self, state):
        hp = {"Authorization": f"Bearer {state['patient_token']}"}
        he = {"Authorization": f"Bearer {state['expert_token']}"}
        r1 = requests.post(f"{API}/messages", headers=hp, json={
            "receiver_id": state["expert_id"], "content": "Halo Pak"})
        assert r1.status_code == 200
        r2 = requests.post(f"{API}/messages", headers=he, json={
            "receiver_id": state["patient_id"], "content": "Halo, ada yang bisa dibantu?"})
        assert r2.status_code == 200
        r3 = requests.get(f"{API}/messages/{state['expert_id']}", headers=hp)
        assert r3.status_code == 200
        assert len(r3.json()) >= 2

    def test_chats_list(self, state):
        hp = {"Authorization": f"Bearer {state['patient_token']}"}
        r = requests.get(f"{API}/chats", headers=hp)
        assert r.status_code == 200
        peers = [c["peer_id"] for c in r.json()]
        assert state["expert_id"] in peers


# ---------------- Moods & Journals ----------------
class TestMoodJournal:
    def test_mood_post_and_list(self, state):
        h = {"Authorization": f"Bearer {state['patient_token']}"}
        r = requests.post(f"{API}/moods", headers=h, json={"mood": "happy", "note": "good day"})
        assert r.status_code == 200
        r2 = requests.get(f"{API}/moods", headers=h)
        assert r2.status_code == 200 and len(r2.json()) >= 1

    def test_journal_post_and_list(self, state):
        h = {"Authorization": f"Bearer {state['patient_token']}"}
        r = requests.post(f"{API}/journals", headers=h,
                          json={"content": "TEST journal entry", "mood": "neutral"})
        assert r.status_code == 200
        r2 = requests.get(f"{API}/journals", headers=h)
        assert r2.status_code == 200
        assert any(j["content"] == "TEST journal entry" for j in r2.json())


# ---------------- User profile, online, hours ----------------
class TestProfileHours:
    def test_update_profile(self, state):
        h = {"Authorization": f"Bearer {state['patient_token']}"}
        r = requests.patch(f"{API}/users/me", headers=h,
                           json={"bio": "halo dunia", "city": "Bandung"})
        assert r.status_code == 200
        d = r.json()
        assert d["bio"] == "halo dunia" and d["city"] == "Bandung"

    def test_online_toggle(self, state):
        h = {"Authorization": f"Bearer {state['expert_token']}"}
        r = requests.patch(f"{API}/users/me/online", headers=h, json={"is_online": True})
        assert r.status_code == 200 and r.json()["is_online"] is True

    def test_hours_put_get(self, state):
        h = {"Authorization": f"Bearer {state['expert_token']}"}
        hours = {"monday": {"start": "09:00", "end": "17:00", "active": True}}
        r = requests.put(f"{API}/users/me/hours", headers=h, json={"hours": hours})
        assert r.status_code == 200
        r2 = requests.get(f"{API}/users/me/hours", headers=h)
        assert r2.status_code == 200
        assert r2.json().get("monday", {}).get("start") == "09:00"


# ---------------- Withdrawals & stats ----------------
class TestWithdraw:
    def test_patient_cannot_withdraw(self, state):
        h = {"Authorization": f"Bearer {state['patient_token']}"}
        r = requests.post(f"{API}/withdrawals", headers=h,
                          json={"amount": 1000, "bank": "BCA", "account_no": "123"})
        assert r.status_code == 403

    def test_withdraw_exceeds_balance(self, state):
        h = {"Authorization": f"Bearer {state['expert_token']}"}
        r = requests.post(f"{API}/withdrawals", headers=h,
                          json={"amount": 9999999999, "bank": "BCA", "account_no": "123"})
        assert r.status_code == 400

    def test_withdraw_success_decrements_balance(self, state):
        h = {"Authorization": f"Bearer {state['expert_token']}"}
        before = requests.get(f"{API}/auth/me", headers=h).json()["balance"]
        amount = min(50000, before)
        r = requests.post(f"{API}/withdrawals", headers=h,
                          json={"amount": amount, "bank": "BCA", "account_no": "0001"})
        assert r.status_code == 200
        after = requests.get(f"{API}/auth/me", headers=h).json()["balance"]
        assert after == before - amount

    def test_expert_stats(self, state):
        h = {"Authorization": f"Bearer {state['expert_token']}"}
        r = requests.get(f"{API}/expert/stats", headers=h)
        assert r.status_code == 200
        d = r.json()
        for k in ("sesi_selesai", "balance", "pending", "accepted"):
            assert k in d
        assert d["sesi_selesai"] >= 1

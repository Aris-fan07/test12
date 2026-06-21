# Rangkul - PRD

## Tujuan
Aplikasi mobile (React Native / Expo) untuk konsultasi & penjadwalan kesehatan mental yang menghubungkan **Pasien** dengan **Psikolog**.

## Stack
- Frontend: Expo (SDK 54) + Expo Router + TypeScript
- Backend: FastAPI + MongoDB (Motor)
- Auth: Custom JWT (bcrypt password hashing)
- State: React Context (Auth + Theme)
- Storage: AsyncStorage

## Roles
1. **Patient (Klien)** - tabs: Home, Schedule, Chat, Profile
2. **Expert (Psikolog)** - tabs: Home, Schedule, Chat, Profile

## Fitur Pasien
- Mood tracker (Happy/Neutral/Sad) -> POST /api/moods
- Poin Rangkul (default 250 saat register)
- Layanan: Pribadi, Pasangan, Karir, Cari Terdekat (map placeholder)
- Browse psikolog, detail psikolog, booking checkout 4 langkah:
  1. Pilih tanggal + jam
  2. Pilih metode (Zoom/Klinik)
  3. Pilih pembayaran (GoPay, OVO, DANA, ShopeePay, BCA/Mandiri/BNI/BRI VA)
  4. Modal Double Confirmation -> insert /api/appointments
- Jadwal: list booking dengan tombol kondisional Join Zoom / Lihat Rute
- Chat real-time (polling 3.5 detik)
- Profile: Edit, Journal, Assessment, Theme picker (Teal/Rose/Blue/Purple), Help, Logout

## Fitur Psikolog
- Toggle Status Aktif (Online/Offline) -> PATCH /api/users/me/online
- Stats: Sesi Selesai, Total Pendapatan
- Sesi berikutnya + Mulai Zoom / Tandai Tiba / Selesai
- Schedule dengan sub-tab Permintaan (Terima/Tolak) & Kalender
- Chat
- Profile: Withdraw, Atur Jam Praktik, Theme, Help, Logout

## Endpoints (semua prefix /api)
- POST /auth/register, /auth/login | GET /auth/me
- GET/PATCH /users/me, PATCH /users/me/online, GET/PUT /users/me/hours
- GET /experts, GET /experts/{id}
- POST/GET /appointments, PATCH /appointments/{id}/status
- POST/GET /messages, GET /messages/{peer}, GET /chats
- POST/GET /moods, POST/GET /journals
- POST /withdrawals
- GET /expert/stats

## Database (MongoDB)
Collections: users, appointments, messages, moods, journals, withdrawals. Semua menggunakan field `id` (UUID) — `_id` dikecualikan dari semua response.

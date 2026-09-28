# DEPLOYMENT.md — Vercel + Firebase + Apps Script (Blueprint §51/§52)
Framework: Vite (output `dist`). `vercel.json`: rewrites `/(.*)→/index.html`.
Env: lihat `.env.example`. Tanpa env = DEMO lokal (tetap deployable).
PWA: vite-plugin-pwa, Firestore/Apps Script = NetworkOnly (§24).
Keamanan: headers nosniff/DENY/referrer. Secrets hanya di Vercel env + Apps Script Properties.

## Bridge Apps Script (`apps_script/`)
Kontrak POST `doPost`: `{ ticket_id, filename, mime_type, sha256, expires_at, file_base64, idToken? }`.
Server fail-closed: payload wajib lengkap → tiket belum kedaluwarsa → `sha256` (FNV-1a, sama dengan `pseudoSha` klien) cocok dengan isi `file_base64` → tiket belum dipakai → upload Drive (MIME allowlist + maks 10MB) → tiket ditandai terpakai.
Replay dilawan via properti `HSE_USED_TICKETS` (sekali pakai; entri >25 jam dipangkas).
`idToken` Firebase opsional: bila dikirim, diverifikasi `aud` (= `FIREBASE_PROJECT_ID`), `iss`, `exp`, `sub` + cek online `getAccountInfo`.
Deploy: salin 4 file `.gs` ke project Apps Script → set Script Properties `FIREBASE_PROJECT_ID` + `FIREBASE_API_KEY` (wajib hanya bila memakai idToken) → Deploy as Web App (Execute as: Me, Access: Anyone) → isi URL di Admin → Drive. Batas: runtime Apps Script tidak teruji lokal — uji upload 1 foto + 1 retry setelah deploy.

# HSE Safety Patrol — Aplikasi Produksi Siap Pakai (Blueprint v2.0) + Deploy Vercel

## Akun produksi awal (wajib ganti password setelah login pertama!)

| Email | Password awal | Role |
|---|---|---|
| `patrol1@sifang.co.id` | `Patrol#2026` | PATROL |
| `patrol2@sifang.co.id` | `Patrol#2026` | PATROL |
| `supervisor@sifang.co.id` | `Spv#2026!` | SUPERVISOR |
| `hse@sifang.co.id` | `HseAdm#2026!` | HSE_ADMIN |
| `management@sifang.co.id` | `Mgmt#2026!` | VIEWER |
| `auditor@sifang.co.id` | `Audit#2026!` | AUDITOR |

Kelola di **Admin → Pengguna** (HSE_ADMIN): tambah/nonaktifkan (`active=false`, bukan hapus §3), reset password.

## Hak akses (enforcement UI + data, §2/§22)

- **PATROL:** buat & submit inspeksi/temuan. ❌ edit master, close/verify, hapus, ubah role, export penuh.
- **SUPERVISOR:** review, assign PIC + due date, verify, close non-kritis. Kritis → eskalasi HSE_ADMIN.
- **HSE_ADMIN:** master, user, konfigurasi Drive, dual sign-off CRITICAL, export penuh, audit.
- **VIEWER/AUDITOR:** baca dashboard, laporan, audit. Tanpa mutasi.

## Menu produksi

- **Inspeksi:** area/sub-area, shift, tipe (6), cuaca, GPS nyata ±m (threshold 50m §16), 316 checklist C/NC/OBS/NA + nilai aktual + unit alat + **foto per item (kompresi 300–800KB §17)** + critical control + STOP WORK (modal radio-primer §15) + validasi (NC wajib catatan, NC kritis wajib foto, critical wajib immediate action).
- **Harian:** Daily Activity Report per tanggal/shift/area + compliance + temuan + foto + export CSV + cetak/PDF.
- **Monitoring:** status area live (§39), tren 7 hari, produktivitas patrol (§40), overdue & perhatian segera.
- **Temuan:** alur OPEN→…→CLOSED + REOPENED/REJECTED, foto evidence, dual sign-off CRITICAL (RULE-022).
- **Master:** 316 item riil (PS50 LP25 DP25 ETO20 EFO20 LS35 TM55 PC36 BS18 + WM10 CS7 FS10 LT5), 11 critical control, TARP site-specific, baseline jalan, 11 trigger STOP.
- **Admin:** pengguna, password, master hash (§24), kuota (§43), **koneksi Google Drive (tes koneksi + antrean retry §18/§19)**, backup/PDP.

## Foto → Google Drive

Admin → Drive: isi **Apps Script Web App URL** + folder root (default `HSE SAFETY PATROL`, wajib akun fungsional/Shared Drive — bukan personal, RULE-024) → **Tes koneksi** → antrean tiket (QUEUED 24 jam, terikat uid) otomatis didorong + tombol Retry. Tanpa bridge pun foto **tetap aman di antrean lokal** (IndexedDB) + thumbnail di laporan.

## Jalankan & deploy

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # output dist/ (sudah PASS)
```
Vercel: import repo → Framework Vite → Build `npm run build`, Output `dist` (lihat `vercel.json`, `docs/DEPLOYMENT.md`). Env Firebase (`VITE_FIREBASE_*`, `VITE_APPS_SCRIPT_URL`) opsional — tanpa env pun aplikasi produksi lokal penuh (IndexedDB), siap sinkronisasi Firestore/Drive saat dikonfigurasi.

## Go-live gate (§52, AC-026–032)

Kajian geoteknik/hidrologi TARP · cek JDIH ESDM · review legal PDP + DPO + retention · uji token+App Check · restore-drill pertama · training radio-primer. 🛑 Radio/verbal = UTAMA STOP WORK (RULE-021).

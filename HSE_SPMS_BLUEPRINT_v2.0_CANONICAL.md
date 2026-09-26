# HSE SAFETY PATROL MANAGEMENT SYSTEM
## PROJECT BLUEPRINT — VERSI 2.0 (CANONICAL)
### PT. SIFANG MINING INDONESIA — OPEN PIT NICKEL MINING / IUJP

> Bahasa utama: Indonesia | UI opsional: 中文 / English
> Status: **CANONICAL — menggantikan v1.0**
> Target: Zero recurring software cost, offline-first, critical-control oriented

---

## CHANGELOG v1.0 → v2.0

Perubahan berikut ditambahkan berdasarkan gap analysis terhadap v1.0. Setiap perubahan ditandai tingkat kekritisannya (🔴 RED / 🟠 ORANGE / 🟡 YELLOW) agar tim dapat memprioritaskan implementasi.

| # | Perubahan | Level | Bagian Terkait |
|---|-----------|-------|-----------------|
| 1 | Aplikasi ditegaskan sebagai jalur **sekunder**, bukan jalur utama, untuk eskalasi STOP WORK — radio/komunikasi verbal langsung tetap primary channel | 🔴 | §15, §29, §55 (RULE-021) |
| 2 | Ditambahkan section kepatuhan **UU No. 27/2022 (PDP)** — dasar pemrosesan, retensi, hak subjek data, pengendali data | 🔴 | §35 (baru) |
| 3 | Apps Script bridge wajib verifikasi **Firebase ID Token** independen, tidak hanya mengandalkan tiket Firestore; ditambahkan **App Check/reCAPTCHA** | 🔴 | §23, §47 |
| 4 | Ditambahkan monitoring kuota Firestore Spark + contingency upgrade ke Blaze (pay-as-you-go) | 🟠 | §1, §43 |
| 5 | Kepemilikan Google Drive fallback diubah dari akun personal admin menjadi **akun fungsional/organisasi** | 🟠 | §18 |
| 6 | Field `related_tarp_id` ditambahkan ke `critical_controls`; field `equipment_unit_id` ditambahkan ke `responses`; field `closure_approval_level` ditambahkan ke `findings` (dual sign-off untuk CRITICAL) | 🟠 | §2, §6, §20 |
| 7 | Modul checklist baru: **Water Management / Pit Dewatering & Settling Pond (WM)**, **Confined Space Entry (CS)**, **Bulk Fuel Storage (FS)**, **Lightning & Extreme Weather (LT)** | 🟠 | §4, §10 |
| 8 | Service worker wajib cache-busting berbasis version-hash checklist master | 🟡 | §24 |
| 9 | Jadwal restore-drill berkala ditambahkan ke strategi backup | 🟡 | §46 |
| 10 | Struktur i18n (id/zh/en) untuk teks checklist didetailkan sebagai key-value terpisah dari kode checklist | 🟡 | §8, §37 |

**Catatan verifikasi regulasi:** Permen ESDM No. 26/2018, Kepmen ESDM No. 1827 K/30/MEM/2018, dan Kepdirjen Minerba No. 185.K/37.04/DJB/2019 telah dicek dan ditemukan masih dirujuk sebagai dasar SMKP aktif per sumber JDIH ESDM dan agregator hukum pada saat blueprint ini disusun. Ini **bukan** verifikasi hukum final — tim HSE/legal wajib mengecek ulang status terbaru di jdih.esdm.go.id sebelum go-live, dan setiap kali ada revisi regulasi.

---

## DAFTAR ISI

1. Zero-Cost Technology Architecture
2. User Roles (RBAC)
3. Account Lifecycle
4. Application Modules
5. Inspection States
6. Finding States
7. Inspection Type
8. Shift & General Field Data
9. Checklist Result Model
10. Master Checklist Catalog
11. Parameter Standard Engine
12. Critical Control Library
13. TARP Engine
14. Risk Engine
15. Automatic Stop-Work Rules
16. GPS / Location Model
17. Photo / Evidence Engine
18. Google Drive Folder Structure
19. Zero-Cost Drive Upload Flow
20. Firestore Data Model
21. Data Integrity Rule
22. Firestore Security Model
23. Apps Script Server Responsibilities
24. Offline-First Engine
25. Inspection Workflow
26. Dashboard
27. Finding Management
28. PIC / Corrective Action Workflow
29. Notification System
30. Reporting
31. Audit Trail
32. Master Data Revision Control
33. Legal / Technical Reference Mapping
34. SMKP Mapping
35. **Data Privacy & UU PDP Compliance (BARU)**
36. Repository Structure
37. UI Screen Map & Internationalization
38. Quick Actions
39. Area Status Engine
40. Daily Patrol Productivity
41. Quality Control
42. Data Validation
43. Performance / Firestore Cost Control
44. Drive / Apps Script Quota Control
45. Daily Summary Job
46. Backup Strategy
47. Security
48. Firestore Rule Test Cases
49. App Testing
50. Acceptance Criteria
51. Deployment Sequence
52. Go-Live Checklist
53. Future Modules (Phase 2)
54. Non-Negotiable Design Rules
55. Final System Flow

---

## 1. ZERO-COST TECHNOLOGY ARCHITECTURE

```
frontend:
  type: Progressive Web App
  host: Firebase Hosting
  framework: React + TypeScript
  ui: responsive, mobile-first, touch-optimized
  language: default id-ID, optional zh-CN / en-US

authentication:
  service: Firebase Authentication (Email/Password)
  password: never stored in Firestore; owned entirely by Firebase Auth

authorization:
  model: RBAC
  enforcement: Firebase Auth + Firestore Security Rules + server-side check in Apps Script

database:
  service: Cloud Firestore
  plan_target: Spark (free tier)

  # [BARU v2.0 — FIX GAP #4]
  quota_management:
    principle: "Zero-cost adalah target, bukan constraint mutlak yang mengorbankan keandalan"
    daily_quota_monitoring: true
    warning_thresholds: [50%, 75%, 90%]
    contingency:
      - "Jika proyeksi read/write harian mendekati kuota Spark, HSE_ADMIN diberi notifikasi otomatis"
      - "Upgrade ke Blaze (pay-as-you-go) disiapkan sebagai jalur darurat — di bawah kuota gratis tetap Rp0"
      - "Jangan biarkan sistem stop mencatat data safety-critical hanya karena kuota habis"
    pre_production_step: "Hitung estimasi read/write harian berdasarkan jumlah patrol × checklist item × foto sebelum go-live"

evidence_storage:
  primary: Google Drive
  connector: Google Apps Script
  firebase_storage: false

server_bridge:
  service: Google Apps Script
  cloud_functions: false

local_storage:
  service: IndexedDB
  purpose: [offline draft, photo queue, unsynced evidence, form cache]

offline:
  firestore_persistence: true
  indexeddb_queue: true
  initial_login_requires_online: true
  note: "Perubahan role/status ditegakkan setelah sinkronisasi, bukan real-time saat device offline"

no_paid_dependencies:
  - No Firebase Cloud Storage
  - No Firebase Cloud Functions
  - No paid SMS OTP / WhatsApp API
  - No paid hosting / email / analytics
```

---

## 2. USER ROLES (RBAC)

Struktur role sama seperti v1.0: **PATROL / SUPERVISOR / HSE_ADMIN / MANAGEMENT_VIEWER / HSE_AUDITOR_OPTIONAL**, dengan matriks izin sebagaimana v1.0, ditambah:

```
# [BARU v2.0 — FIX GAP #7]
CLOSURE_APPROVAL_ESCALATION:
  finding_risk_level: HIGH/MEDIUM/LOW/OBS
    close_by: [SUPERVISOR, HSE_ADMIN]
  finding_risk_level: CRITICAL
    close_by: HSE_ADMIN ONLY  # tidak boleh Supervisor sendirian
    dual_sign_off_required: true
    second_approver: "Supervisor area ATAU HSE Admin lain, berbeda dari yang set PENDING_VERIFICATION"
    reason: "Temuan CRITICAL berdampak stop-work/keselamatan jiwa — closure butuh mata kedua"
```

PATROL tetap tidak bisa: edit master, close/verify finding, delete record, ubah role, export database penuh.

---

## 3. ACCOUNT LIFECYCLE

Sama seperti v1.0 — pembuatan via Firebase Console, disable dengan `active=false` (bukan delete), delete akun hanya via Firebase Console oleh HSE_ADMIN untuk menjaga audit history.

---

## 4. APPLICATION MODULES

```
AUTH: Login, Forgot password, First login, Logout, Offline session handling

HOME: Daily inspection, Quick critical finding, My drafts, My open findings, Sync status

DAILY_INSPECTION: Start, Shift, Area, Sub-area, GPS, Weather, Checklist, Measurement,
  Photo, Finding, Immediate action, Submit

AREA_MODULES:
  - Pit Stop / Temporary Workshop
  - Mine Area (Loading Point, Disposal/Dumping Point, ETO, EFO)
  - Mine Slope
  - Haul Road / Traffic Management
  - Personnel / PPE
  - Behavioral Safety
  - Water Management / Pit Dewatering & Settling Pond   # [BARU v2.0]
  - Confined Space Entry                                 # [BARU v2.0]
  - Bulk Fuel Storage                                     # [BARU v2.0]
  - Lightning & Extreme Weather                           # [BARU v2.0]

FINDING_MANAGEMENT: Open, Critical, Assign PIC, Due date, Corrective action, Evidence,
  Verification, Close (dual sign-off jika CRITICAL), Reopen, Repeat finding

CRITICAL_CONTROL: Status, Failure trigger, Stop work, Escalation, TARP

GEO: GPS, Geofence warning, Map, Inspection/Finding location

DASHBOARD: Completion, Compliance, Critical/High/Open/Overdue/Repeat findings,
  Area risk, Patrol productivity, Closure trend

MASTER_DATA: Users, Areas, Sub-areas, Checklist, Parameters, Risk matrix,
  Critical controls, TARP, PIC, Regulatory references, SOP references

REPORTING: Daily/Shift Report, Finding Register, Critical Control Report,
  Overdue Report, Repeat Finding Report, Monthly Trend, Patrol Activity,
  Evidence Index (CSV/XLSX/PDF)

ADMIN: User profile, Role assignment, Area config, Master revision,
  System parameters, Drive configuration, Audit trail, Export
```

---

## 5. INSPECTION STATES

`DRAFT → SUBMITTED → REVIEWED → VERIFIED → ARCHIVED` (tidak berubah dari v1.0). Submitted tidak bisa diedit patrol; archived tidak bisa dihapus.

---

## 6. FINDING STATES

```
OPEN → IMMEDIATE_ACTION → ASSIGNED → IN_PROGRESS → PENDING_VERIFICATION → VERIFIED → CLOSED
REOPENED  (jika koreksi tidak efektif / kondisi berulang)
REJECTED  (invalid/duplikat, dengan alasan terdokumentasi)

PATROL_CANNOT: set CLOSED, set VERIFIED, delete finding

# [BARU v2.0]
CRITICAL_CLOSURE_RULE:
  requires: [HSE_ADMIN approval, dual sign-off — lihat §2]
```

---

## 7. INSPECTION TYPE

`DAILY_PATROL / POST_RAIN / FOLLOW_UP / SPECIAL_INSPECTION / INCIDENT_RELATED / PRE_OPERATION` — tidak berubah.

---

## 8. SHIFT & GENERAL FIELD DATA

Field header sama seperti v1.0 (`inspection_id, date, shift, inspector_uid, area_id, gps, weather, overall_status, critical_control_failure, stop_work_triggered`, dst).

```
# [BARU v2.0 — FIX GAP #10]
i18n_structure:
  principle: "Kode checklist (mis. TM-001) adalah identitas permanen, bukan teks tampilan"
  storage:
    checklist_label:
      id-ID: "Lebar jalan dua arah"
      zh-CN: "双向道路宽度"
      en-US: "Two-way road width"
  rule: "Semua teks user-facing (label checklist, parameter, pesan error) disimpan sebagai map bahasa
         terpisah dari checklist_id, tidak di-hardcode dalam satu bahasa"
```

---

## 9. CHECKLIST RESULT MODEL

Status: `C (Comply) / NC (Non-Conformity) / OBS (Observation) / N/A`.
Tipe parameter: `BOOLEAN / MIN / MAX / RANGE / ENUM / TEXT / PHOTO / COUNT / FORMULA / REFERENCE` — tidak berubah dari v1.0.

---

## 10. MASTER CHECKLIST CATALOG

Modul-modul dari v1.0 dipertahankan penuh: **PIT_STOP_TEMP_WORKSHOP (PS-001–050)**, **LOADING_POINT (LP-001–025)**, **DISPOSAL_DUMPING (DP-001–025)**, **ETO (ETO-001–020)**, **EFO (EFO-001–020)**, **MINE_SLOPE (LS-001–035)**, **TRAFFIC_MANAGEMENT (TM-001–055)**, **PERSONNEL_PPE (PC-001–036)**, **BEHAVIORAL_SAFETY (BS-001–018)**.

### Modul baru v2.0:

```
WATER_MANAGEMENT:  # kolam pengendapan / pit dewatering — critical control lingkungan+geoteknik
  WM-001: "Kapasitas sump/pit sump"
  WM-002: "Kondisi pompa dewatering"
  WM-003: "Kapasitas kolam pengendapan (settling pond)"
  WM-004: "Kepatuhan kualitas air buangan (baku mutu)"
  WM-005: "Indikasi overflow/jebol tanggul kolam"
  WM-006: "Kontrol erosi di area kolam"
  WM-007: "Kebocoran pipa/selang dewatering"
  WM-008: "Keamanan kelistrikan pompa"
  WM-009: "Stabilitas tanggul kolam"
  WM-010: "Inspeksi pasca-hujan terhadap kolam/sump"

CONFINED_SPACE:  # entry ke tangki, sump, ruang tertutup
  CS-001: "Izin kerja ruang terbatas (permit)"
  CS-002: "Uji atmosfer (O2, gas mudah terbakar/toksik) sebelum masuk"
  CS-003: "Ventilasi memadai"
  CS-004: "Petugas standby/attendant di luar"
  CS-005: "Rencana rescue tersedia"
  CS-006: "Komunikasi dengan entrant terjaga"
  CS-007: "Log entry/exit terisi"

BULK_FUEL_STORAGE:  # tangki timbun BBM — terpisah dari PS-040 yang bersifat umum
  FS-001: "Secondary containment/bunding tangki"
  FS-002: "Grounding tangki"
  FS-003: "Kondisi vent pipe"
  FS-004: "Overfill protection berfungsi"
  FS-005: "Tidak ada indikasi kebocoran"
  FS-006: "Jarak aman dari sumber api/ignition"
  FS-007: "Spill kit tersedia"
  FS-008: "Signage & larangan merokok terpasang"
  FS-009: "Akses dikendalikan (tidak sembarang orang)"
  FS-010: "Prosedur delivery/offloading dipatuhi"

LIGHTNING_WEATHER:  # protokol petir & cuaca ekstrem
  LT-001: "Status sistem deteksi petir (jika tersedia)"
  LT-002: "Protokol jarak aman/stop-work petir dipahami dan diikuti"
  LT-003: "Tempat berlindung tersedia dan diketahui pekerja"
  LT-004: "Operator/pekerja mengetahui prosedur saat sinyal petir aktif"
  LT-005: "Aktivitas pada alat logam/terbuka dihentikan sesuai trigger site"
```

```
# [BARU v2.0 — FIX GAP #6]
equipment_linkage:
  applies_to: [TM-023 s/d TM-032 (kondisi kendaraan), LP checklist unit-spesifik]
  field: equipment_unit_id
  purpose: "Menghubungkan temuan checklist ke unit alat berat spesifik untuk analisis tren per-unit,
            walau modul Equipment penuh baru di Phase 2"
```

---

## 11. PARAMETER STANDARD ENGINE

Prinsip tidak berubah: standar disimpan di `master_parameters`, bukan hardcode; setiap parameter punya revisi dan sumber; inspeksi historis menyimpan snapshot standar yang berlaku saat itu.

Contoh baseline regulasi (perlu verifikasi ulang ke JDIH ESDM sebelum produksi):

| Parameter | Baseline | Sumber |
|---|---|---|
| Jalan 2 arah | ≥ 3,5 × lebar kendaraan terbesar | Kepmen 1827 / Kepdirjen 185 (site override lebih ketat diperbolehkan) |
| Jalan 1 arah | ≥ 2 × lebar kendaraan terbesar | idem |
| Safety berm jalan | ≥ 0,75 × diameter roda terbesar | idem |
| Cross fall | ≥ 2% | idem |
| Grade | ≤ 12% kecuali site lebih ketat | idem |
| Floor opening guard (workshop) | ≥ 90 cm | idem |

Geometri lereng, displacement TARP, trigger hujan, dan jarak aman dumping **wajib** site-specific dari kajian geoteknik/hidrologi — **tidak boleh** di-hardcode sebagai angka universal.

---

## 12. CRITICAL CONTROL LIBRARY

```
CC-001 Slope Stability
CC-002 Dump Edge Safety
CC-003 Heavy Equipment Interaction
CC-004 Vehicle Braking / Control
CC-005 Traffic Management
CC-006 LOTO / Energy Isolation
CC-007 Fire / Fuel

# [BARU v2.0]
CC-008 Water Management / Pond Integrity
  automatic_stop_examples: [Tanggul kolam jebol, Overflow tidak terkendali, Pompa dewatering gagal total]
CC-009 Confined Space Entry
  automatic_stop_examples: [Atmosfer tidak aman, Attendant tidak ada, Entry tanpa permit]
CC-010 Fuel/Tank Integrity
  automatic_stop_examples: [Kebocoran tangki aktif, Overfill, Bunding gagal]
CC-011 Lightning / Extreme Weather
  automatic_stop_examples: [Petir dalam radius trigger site, Aktivitas alat logam terbuka berlanjut]

# [BARU v2.0 — FIX GAP #6]
data_model_field: related_tarp_id (REFERENCE, opsional)
  purpose: "Menghubungkan critical control ke aturan TARP terkait agar dashboard menampilkan status gabungan"
```

---

## 13. TARP ENGINE

```
GREEN (Normal) → YELLOW (Watch) → ORANGE (Restrict) → RED (Stop)
```
Trigger wajib site-specific dari kajian geoteknik/hidrologi/SOP — jangan gunakan angka generik sebagai trigger final site.

---

## 14. RISK ENGINE

```
inspection_status ≠ finding_priority ≠ critical_control_failure  # dipisahkan, tidak dicampur
risk_score = severity(1-5) × likelihood(1-5)
risk_level = LOOKUP dari risk matrix yang disahkan (bukan placeholder default)
override_rule: critical_control_failure dapat override skor numerik → area_status = CRITICAL
```

---

## 15. AUTOMATIC STOP-WORK RULES

```
trigger:
  - Slope instability kritis / ground failure aktif
  - Kegagalan rem/steering kendaraan
  - Interaksi alat berat tak terkendali
  - Personel dalam line of fire kritis
  - Dump edge tidak aman
  - Kebakaran/tumpahan BBM mayor
  - Maintenance tanpa isolasi energi yang memadai
  - Operator tanpa otorisasi pada alat kritis
  - Tanggul kolam pengendapan jebol / overflow tak terkendali      # [BARU v2.0]
  - Confined space entry tanpa permit/atmosfer tidak aman           # [BARU v2.0]
  - Petir dalam radius trigger site pada area terbuka/alat logam    # [BARU v2.0]

# [BARU v2.0 — FIX GAP #1, PALING KRITIS]
escalation_channel_priority:
  principle: >
    Aplikasi adalah alat DOKUMENTASI dan BACKUP, BUKAN jalur eskalasi utama
    untuk kondisi life-safety. Ini karena network_condition di lokasi tambang
    bersifat intermittent/remote — notifikasi digital baru terkirim setelah sinkron,
    yang bisa terlambat untuk kondisi STOP WORK.
  primary_channel: "Komunikasi radio/verbal langsung ke supervisor/KTT di lapangan — SEGERA, sebelum submit aplikasi"
  secondary_channel: "Aplikasi (foto, GPS, deskripsi, notifikasi email) — untuk dokumentasi, tindak lanjut, dan audit trail"
  training_requirement: "Semua patrol dilatih bahwa submit aplikasi TIDAK menggantikan panggilan radio langsung"
  ui_reminder: "Modal CRITICAL menampilkan pengingat: 'Sudah menghubungi supervisor via radio?' sebelum submit"

application_behavior:
  status: CRITICAL
  notification: [Supervisor, HSE Admin]
  mandatory_fields: [Immediate action, Photo, GPS, Description]
  closure: [Tidak bisa ditutup Patrol, Wajib dual sign-off HSE_ADMIN — lihat §2]
```

---

## 16. GPS / LOCATION MODEL

Tidak berubah dari v1.0: capture di start/submit inspeksi dan pembuatan finding; field `latitude, longitude, accuracy_m, altitude_m, captured_at`; geofence untuk warning area (bukan bukti identitas mutlak); threshold akurasi default 50m (configurable).

---

## 17. PHOTO / EVIDENCE ENGINE

Tidak berubah dari v1.0: penyimpanan di Google Drive (bukan Firebase Storage), kompresi client-side (target 300–800 KB), metadata lengkap (`drive_file_id, sha256, upload_status`, dst), evidence tidak bisa dihapus/diubah setelah submit.

---

## 18. GOOGLE DRIVE FOLDER STRUCTURE

```
root: "HSE SAFETY PATROL"
hierarchy: YEAR/MONTH/DATE/SHIFT/INSPECTION_ID/AREA
file_name_pattern: "{inspectionId}_{checklistId}_{timestamp}_{sequence}.jpg"

# [BARU v2.0 — FIX GAP #5]
ownership:
  v1.0_design: "My Drive fallback pada akun personal admin"
  v2.0_fix: "WAJIB menggunakan akun fungsional/organisasi (mis. hse.sifang@domain.com),
             BUKAN akun personal individu"
  reason: "Akun personal menciptakan bus-factor risk — jika pemilik akun resign,
           kepemilikan/akses folder bisa terputus atau butuh proses transfer rumit"
  preferred: "Google Workspace Shared Drive dengan kepemilikan organisasi"
  fallback_if_no_shared_drive: "My Drive pada akun fungsional khusus HSE, dikelola bersama oleh ≥2 admin"

permissions:
  patrol: "Tidak ada akses langsung ke Drive"
  supervisor: "Read evidence sesuai kebutuhan"
  hse_admin: "Full access"
  management: "Read only"
```

---

## 19. ZERO-COST DRIVE UPLOAD FLOW

```
1. PATROL: capture foto → compress → buat upload ticket di Firestore
2. Ticket: {ticket_id, uid, inspection_id, filename, mime_type, sha256, status=QUEUED, expires_at}
3. Browser: POST ke Apps Script Web App (ticket_id, file_base64, filename, mime_type, sha256)
4. Apps Script:
   a. [BARU v2.0 — FIX GAP #3] Verifikasi Firebase ID Token pengirim secara independen
      (via Google Identity Toolkit endpoint atau tokeninfo), JANGAN hanya percaya
      uid yang dikirim client atau keberadaan tiket saja
   b. Cek tiket exists, belum expired, status=QUEUED, ticket.uid == token.uid
   c. Validasi filename, MIME type, ukuran file, hash
   d. Resolve folder tujuan → buat file di Drive → update ticket ke UPLOADED
5. Frontend: monitor status ticket, retry jika FAILED

security:
  - Ticket random & expired singkat
  - Ticket terikat ke user & inspeksi terautentikasi
  - [BARU v2.0] Apps Script memverifikasi ID Token, bukan hanya mempercayai tiket Firestore
  - Password mentah tidak pernah menyentuh Apps Script
```

---

## 20. FIRESTORE DATA MODEL

Struktur collection utama tidak berubah dari v1.0 (`users, areas, sub_areas, checklist_master, parameters, risk_matrix, critical_controls, tarp_rules, inspections, findings, corrective_actions, attachments, upload_tickets, audit_logs, system_config`), dengan penambahan field berikut:

```
critical_controls:
  + related_tarp_id: REFERENCE_OPTIONAL   # [BARU v2.0]

inspections.responses (subcollection):
  + equipment_unit_id: REFERENCE_OPTIONAL  # [BARU v2.0] — untuk checklist terkait unit alat berat

findings:
  + closure_approval_level: ENUM [STANDARD, DUAL_SIGN_OFF]  # [BARU v2.0]
  + second_approver_uid: UID_OPTIONAL                        # [BARU v2.0] — wajib diisi jika CRITICAL
  + second_approver_at: TIMESTAMP_OPTIONAL                   # [BARU v2.0]
```

Snapshot immutable historis tetap mencakup: judul checklist, standar parameter, unit, revisi, sumber referensi.

---

## 21. DATA INTEGRITY RULE

Tidak berubah: submitted inspection tidak bisa dihapus/diedit patrol; master revision tidak pernah menimpa standar historis; koreksi via amendment, bukan overwrite diam-diam; setiap perubahan role/active status wajib audit.

---

## 22. FIRESTORE SECURITY MODEL

Struktur rules per-collection sama seperti v1.0 (helper functions `signedIn, activeUser, isPatrol, isSupervisor, isAdmin, isViewer`), ditambah:

```
# [BARU v2.0 — FIX GAP #3]
app_check:
  enabled: true
  purpose: "Mencegah bot/script otomatis mengakses Firestore/Apps Script endpoint publik
            tanpa melalui aplikasi resmi"
  enforcement: "Firebase App Check + reCAPTCHA v3 pada web app"

critical_security:
  - Tidak pernah mengandalkan UI button hiding sebagai keamanan
  - Semua akses ditegakkan di Firestore Rules
  - Role field tidak boleh user-editable
  - Tidak ada rule allow-all
  - Tidak ada admin secret di client-side
  - [BARU v2.0] App Check aktif di semua endpoint publik
```

---

## 23. APPS SCRIPT SERVER RESPONSIBILITIES

```
doPost:
  - [BARU v2.0] verifyFirebaseIdToken(token) — validasi independen sebelum proses apapun
  - Validasi tiket exists, belum expired, status QUEUED, ticket.uid == token.uid
  - Validasi file size, MIME, hash
createDriveFolder / uploadEvidence / updateUploadStatus
generateDailyReport / generateXlsx / generatePdf
sendCriticalNotification: hanya untuk critical findings (hemat kuota email)
exportLogicalBackup: JSON/CSV ke Drive

secrets: disimpan di Apps Script Properties, TIDAK PERNAH di frontend/Firestore/Git
allowed_mime: [image/jpeg, image/png, application/pdf]

# [BARU v2.0]
quota_awareness:
  note: "Akun Gmail konsumen memiliki kuota email (~100/hari) dan concurrent execution
         lebih rendah dibanding Google Workspace (~1500/hari). Gunakan akun Workspace
         jika volume notifikasi tinggi, atau batasi ke critical + daily digest saja."
```

---

## 24. OFFLINE-FIRST ENGINE

```
firestore.persistence: true
indexeddb.stores: [inspectionDrafts, photoQueue, uploadQueue, syncMetadata]
synchronization order: metadata → responses → findings → upload tickets → evidence → attachment metadata

conflict_strategy:
  draft: last-write-wins (selama masih DRAFT)
  submitted: immutable
  administrative: server/master revision menang

# [BARU v2.0 — FIX GAP #8]
cache_versioning:
  problem: "Device offline bisa 'nyangkut' pakai checklist master versi lama setelah revisi disahkan"
  fix:
    - "Setiap checklist_master punya field revision + content_hash"
    - "Service worker menyimpan content_hash yang sedang di-cache"
    - "Saat online, app membandingkan content_hash lokal vs server; jika beda, sync ulang
       master data SEBELUM inspeksi baru dimulai (bukan menunggu app restart)"
    - "Inspeksi yang sudah DRAFT dengan checklist versi lama tetap memakai snapshot versi
       tersebut (konsisten dengan data integrity rule), bukan otomatis pindah versi"

safeguards:
  - Jangan hilangkan draft jika browser tertutup
  - Warning sebelum clear local cache
  - Tampilkan jumlah pending upload
  - Critical finding tetap bisa dicatat offline
```

---

## 25. INSPECTION WORKFLOW

Alur tidak berubah dari v1.0: Login → Start → Inspect (per item: hazard, standard, source, actual, C/NC/OBS/NA, evidence) → NC handling → **Critical handling (dengan pengingat radio — lihat §15)** → Submit (dengan pre-submit validation) → End (ringkasan, compliance, critical controls, open findings, pending sync).

---

## 26. DASHBOARD

Kartu, chart, dan filter sama seperti v1.0, dengan area_list ditambah: **Water Management, Confined Space, Fuel Storage**. Aturan manajemen tetap: **compliance percentage tidak boleh mewakili keamanan tunggal — critical control failure selalu override.**

---

## 27. FINDING MANAGEMENT

Field otomatis, mandatory fields untuk HIGH/CRITICAL, repeat detection (dengan human confirmation), overdue formula — tidak berubah dari v1.0. Ditambah aturan closure dual sign-off untuk CRITICAL (lihat §2, §6).

---

## 28. PIC / CORRECTIVE ACTION WORKFLOW

Tidak berubah: assignment fields, status flow, closure tidak boleh self-verified, reopening diperbolehkan jika koreksi tidak efektif, setiap perubahan status diaudit.

---

## 29. NOTIFICATION SYSTEM

```
browser: sync, assignment, overdue
email (Apps Script MailApp): critical=enabled, daily_digest=enabled, normal_finding=default false
no_paid_notification: [WhatsApp API, SMS gateway, paid push]

# [BARU v2.0 — konsisten dengan §15]
critical_notification_caveat: >
  Email/notifikasi in-app untuk CRITICAL adalah channel SEKUNDER untuk dokumentasi dan
  tindak lanjut manajemen — BUKAN pengganti komunikasi radio langsung yang harus
  terjadi lebih dulu di lapangan. Ini terutama penting karena kondisi offline
  menunda pengiriman notifikasi sampai device sinkron kembali.
```

---

## 30. REPORTING

Format dan isi laporan (Daily Safety Patrol Report, Finding Register, Management Report) tidak berubah dari v1.0. Export permission per role tetap sama.

---

## 31. AUDIT TRAIL

Event list tidak berubah, ditambah: `SECOND_APPROVAL_CRITICAL_CLOSURE` untuk mencatat dual sign-off.

---

## 32. MASTER DATA REVISION CONTROL

Workflow `Draft → Review → Approve → Publish → Retire` tidak berubah. Hanya record APPROVED yang dipakai live.

---

## 33. LEGAL / TECHNICAL REFERENCE MAPPING

```
regulatory:
  - UU No. 1 Tahun 1970 (Keselamatan Kerja)
  - UU No. 3 Tahun 2020 (Perubahan UU Minerba)
  - PP No. 50 Tahun 2012 (SMK3)
  - Permen ESDM No. 26 Tahun 2018
  - Kepmen ESDM No. 1827 K/30/MEM/2018
  - Kepdirjen Minerba No. 185.K/37.04/DJB/2019
  - UU No. 27 Tahun 2022 (Pelindungan Data Pribadi)   # [BARU v2.0]

legal_control:
  - Matriks legal wajib direview sebelum production release
  - Sumber JDIH terbaru wajib dicek sebelum update regulasi
  - Baseline regulasi tidak boleh menggantikan kriteria teknik site-specific yang disahkan
```

---

## 34. SMKP MAPPING

Tidak berubah dari v1.0: setiap item inspeksi dapat dipetakan ke elemen SMKP untuk kebutuhan evidence audit.

---

## 35. DATA PRIVACY & UU PDP COMPLIANCE — 🔴 BARU v2.0

```
regulatory_basis: "UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP)"

data_collected_classified_as_personal_data:
  - Nama, employee_id, jabatan
  - Lokasi GPS individu (dikumpulkan berulang sepanjang shift)
  - Foto yang berpotensi mengandung wajah pekerja

legal_basis_for_processing:
  primary: "Pelaksanaan kontrak kerja / kewajiban hukum K3 (UU No.1/1970, PP 50/2012, Permen ESDM 26/2018)"
  note: "Bukan 'consent' semata — pemrosesan berbasis kewajiban hukum & kepentingan sah pemberi kerja
         untuk keselamatan kerja, tapi tetap wajib transparansi ke pekerja"

data_controller:
  role: "PT. Sifang Mining Indonesia (sebagai pemberi kerja/kontraktor IUJP)"
  action_required: "Tunjuk penanggung jawab pelindungan data (bisa merangkap HSE_ADMIN atau
                     fungsi legal/HR terpisah) sebelum go-live"

data_subject_rights_to_support:
  - Hak mengetahui data apa yang dikumpulkan (transparansi saat onboarding/induction)
  - Hak akses ke data pribadinya sendiri (mis. riwayat lokasi/temuan yang melibatkan dirinya)
  - Hak koreksi jika ada kesalahan data profil
  - Catatan: hak "penghapusan" dibatasi oleh kewajiban retensi dokumen HSE (lihat retention di bawah)

retention_policy:
  operational_data: "Mengikuti kebijakan retensi dokumen HSE perusahaan (biasanya bertahun-tahun
                      untuk keperluan audit K3/regulasi)"
  gps_raw_tracking: "Pertimbangkan agregasi/anonimisasi setelah periode tertentu jika tidak lagi
                      relevan untuk investigasi/audit aktif"
  action_required: "Definisikan retention_period eksplisit per jenis data, dicatat di system_config"

transparency_requirement:
  - Pekerja/patrol diberi tahu saat induction: data apa yang dikumpulkan, untuk apa, disimpan
    berapa lama, dan siapa yang bisa akses
  - Sertakan dalam materi onboarding (bukan hanya di dalam ToS aplikasi yang jarang dibaca)

security_measures_supporting_pdp:
  - Enkripsi in-transit (HTTPS) — sudah ada di §47
  - Kontrol akses berbasis role — sudah ada di §22
  - Audit log setiap akses data sensitif oleh admin — sudah ada di §31
  - Minimisasi data (§ sensitive_data di v1.0, dipertahankan)

pre_production_action:
  - Review oleh legal/compliance internal perusahaan sebelum go-live
  - Ini BUKAN nasihat hukum — konsultasikan ke penasihat hukum berlisensi untuk kepastian kepatuhan
```

---

## 36. REPOSITORY STRUCTURE

```
hse-safety-patrol/
├── src/ (auth, components, pages, features/*, services/*, store, types, utils)
├── public/ (icons, manifest.webmanifest, service-worker.js)
├── firebase/ (firebase.json, firestore.rules, firestore.indexes.json)
├── apps_script/ (Code.gs, DriveService.gs, FirestoreService.gs, ReportService.gs,
│                 NotificationService.gs, BackupService.gs, ValidationService.gs,
│                 TokenVerificationService.gs)   # [BARU v2.0]
└── docs/
    ├── ARCHITECTURE.md
    ├── SECURITY.md
    ├── DEPLOYMENT.md
    ├── DATA_DICTIONARY.md
    ├── CHECKLIST_LIBRARY.md
    ├── TARP_MATRIX.md
    ├── TEST_PLAN.md
    ├── DATA_PRIVACY.md      # [BARU v2.0]
    └── GAP_ANALYSIS.md      # [BARU v2.0]
```

---

## 37. UI SCREEN MAP & INTERNATIONALIZATION

Screen map (login, patrol home, inspection screen, critical modal, finding screen, supervisor/admin/management dashboard) tidak berubah dari v1.0. Critical modal ditambah pengingat radio (§15).

```
# [BARU v2.0 — detail dari §8]
i18n_implementation:
  - Semua label UI & checklist disimpan sebagai translation map, key = checklist_id/ui_key
  - Fallback ke id-ID jika terjemahan zh-CN/en-US belum tersedia untuk item tertentu
  - Terjemahan dikelola HSE_ADMIN via Master Data, bukan hardcode di source code
```

---

## 38. QUICK ACTIONS

Tidak berubah dari v1.0 per role (Patrol: start inspection, critical finding, hazard report, upload pending; Supervisor: review critical, assign PIC, verify; HSE_ADMIN: edit master, dashboard, user, report, audit; Management: critical, area status, trend, report).

---

## 39. AREA STATUS ENGINE

```
priority: 1. Critical control failure  2. TARP RED  3. Critical finding
          4. High-risk finding  5. General compliance
rule: Status CRITICAL tidak bisa dibatalkan oleh compliance percentage tinggi
```

---

## 40. DAILY PATROL PRODUCTIVITY

Metrik tidak berubah. Warning tetap berlaku: jangan reward patrol semata dari jumlah temuan; kombinasikan dengan indikator kualitas.

---

## 41. QUALITY CONTROL

Anti-gaming controls (immutable submission, server timestamp, GPS, photo, random verification, repeat detection, audit trail) dan suspicious pattern flags tidak berubah dari v1.0.

---

## 42. DATA VALIDATION

Required fields, validasi numerik, validasi teks, validasi foto — tidak berubah dari v1.0.

---

## 43. PERFORMANCE / FIRESTORE COST CONTROL

Prinsip desain (pagination, cache master lokal, hindari repeated reads, satu summary document, dst) tidak berubah, ditambah:

```
# [BARU v2.0 — FIX GAP #4, lihat juga §1]
scaling_contingency:
  - Monitoring kuota harian wajib aktif sejak hari pertama produksi, bukan reaktif setelah insiden
  - Threshold 75% kuota Spark → notifikasi HSE_ADMIN + evaluasi upgrade Blaze
  - Dokumentasikan estimasi kebutuhan read/write berdasarkan jumlah patrol aktual di site
    sebelum pilot, bukan asumsi
```

---

## 44. DRIVE / APPS SCRIPT QUOTA CONTROL

Tidak berubah dari v1.0: satu foto per transaksi, kompresi sebelum upload, retry dengan backoff, idempotency berbasis `attachment_id`, jangan diam-diam buang foto yang gagal.

---

## 45. DAILY SUMMARY JOB

Tidak berubah: Apps Script Trigger terjadwal untuk daily report, overdue summary, critical summary, logical backup export, management digest.

---

## 46. BACKUP STRATEGY

```
native_firestore_pitr: false (butuh billing)
logical_backup: true, destinasi Google Drive, frekuensi daily/weekly/monthly
formats: [JSON, CSV]

# [BARU v2.0 — FIX GAP #9]
restore_drill:
  schedule: "Minimal setiap kuartal (3 bulan)"
  process: "Restore ke environment staging terpisah, validasi integritas data, dokumentasikan hasil"
  owner: "HSE_ADMIN + system owner yang ditunjuk (lihat §52)"
  reason: "Backup yang belum pernah diuji restore-nya bukan backup yang bisa diandalkan"
```

---

## 47. SECURITY

```
transport: HTTPS only
authentication: Firebase Auth
password: tidak pernah disimpan/dicatat/dikirim ke Drive
roles: ditegakkan Firestore Rules
admin: tidak ada secret di frontend; kredensial Drive tidak pernah di frontend

# [BARU v2.0 — FIX GAP #3]
app_check_recaptcha: "Aktif di semua endpoint publik (Firestore client + Apps Script Web App)"
apps_script_token_verification: "Setiap request ke Apps Script memverifikasi Firebase ID Token
                                  secara independen, bukan hanya mempercayai tiket Firestore
                                  atau uid yang dikirim client"

sensitive_data:
  collect_minimum: [Nama, Employee ID, Role, Inspection records, GPS terkait inspeksi/finding]
  avoid: [Password, Detail medis tidak perlu, PII sensitif yang tidak dibutuhkan HSE]
  # Lihat §35 untuk kepatuhan UU PDP secara detail
```

---

## 48. FIRESTORE RULE TEST CASES

Test case per role (PATROL, SUPERVISOR, ADMIN, VIEWER) tidak berubah dari v1.0, ditambah:

```
PATROL: "Tidak bisa mengakses endpoint Apps Script tanpa ID Token valid"   # [BARU v2.0]
ADMIN:  "Hanya HSE_ADMIN yang bisa melakukan closure dual sign-off untuk CRITICAL"  # [BARU v2.0]
```

---

## 49. APP TESTING

Test plan (functional, offline, safety, security, integrity, performance) tidak berubah dari v1.0, ditambah test case verifikasi token Apps Script dan test restore-drill.

---

## 50. ACCEPTANCE CRITERIA

AC-001 s/d AC-025 dari v1.0 dipertahankan penuh. Ditambah:

```
AC-026: "Notifikasi CRITICAL disertai pengingat eksplisit bahwa radio/komunikasi verbal
         adalah jalur utama, aplikasi adalah jalur sekunder"
AC-027: "Closure finding CRITICAL memerlukan dual sign-off HSE_ADMIN"
AC-028: "Apps Script memverifikasi Firebase ID Token pada setiap request upload evidence"
AC-029: "Kepatuhan UU PDP telah direview oleh legal/compliance internal sebelum go-live"
AC-030: "Kepemilikan Google Drive menggunakan akun fungsional/organisasi, bukan akun personal"
AC-031: "Monitoring kuota Firestore aktif dengan threshold notifikasi 50/75/90%"
AC-032: "Restore drill backup telah dilakukan minimal sekali sebelum go-live"
```

---

## 51. DEPLOYMENT SEQUENCE

Fase 1–7 tidak berubah dari v1.0 (setup Firebase/Firestore/Hosting → setup Apps Script/Drive → deploy frontend/rules → import master data → security/offline/Drive test → pilot → formalisasi sebagai HSE digital record).

---

## 52. GO-LIVE CHECKLIST

Checklist regulatory, system, operational dari v1.0 dipertahankan, ditambah:

```
regulatory:
  + "Status terbaru Permen ESDM 26/2018, Kepmen 1827/2018, Kepdirjen 185/2019 dicek ulang di JDIH ESDM"
  + "Review kepatuhan UU PDP oleh legal internal selesai"          # [BARU v2.0]

system:
  + "App Check/reCAPTCHA aktif"                                     # [BARU v2.0]
  + "Verifikasi ID Token Apps Script diuji"                         # [BARU v2.0]
  + "Restore drill backup pertama telah dilakukan"                  # [BARU v2.0]

governance:
  + "Penanggung jawab pelindungan data pribadi ditunjuk"            # [BARU v2.0]
  + "Kepemilikan Google Drive dikonfirmasi pada akun fungsional"    # [BARU v2.0]
```

---

## 53. FUTURE MODULES (PHASE 2 — OPSIONAL)

Tidak berubah dari v1.0: Equipment (pre-start, PM monitoring, defect register), Environment (dust, water quality, spill, waste), Fuel, Emergency (ERP activation), Competency, Contractor (CSMS), Analytics (leading indicators, critical control health), Advanced (QR check-in, heatmap, anomaly detection).

---

## 54. NON-NEGOTIABLE DESIGN RULES

```
RULE-001: No password disimpan di Firestore
RULE-002: Patrol tidak bisa edit master checklist
RULE-003: Patrol tidak bisa close temuannya sendiri
RULE-004: Submitted inspection tidak dihapus
RULE-005: Historical inspection menyimpan standard snapshot saat itu
RULE-006: Critical control failure override compliance percentage
RULE-007: Parameter geoteknik bersifat site-specific
RULE-008: Threshold TARP bersifat site-specific
RULE-009: Parameter jalan boleh pakai baseline regulasi, site boleh lebih ketat
RULE-010: Dump safety berm TIDAK otomatis mewarisi formula berm jalan
RULE-011: Tidak ada admin secret di client-side
RULE-012: Evidence disimpan di Drive repository terkontrol
RULE-013: Setiap critical finding wajib evidence + escalation
RULE-014: Setiap perubahan master data material wajib punya revisi
RULE-015: Tidak ada skor yang menyatakan area aman saat critical control gagal
RULE-016: Mode offline tidak boleh diam-diam membuang data
RULE-017: Semua event workflow kritis wajib auditable
RULE-018: Aplikasi adalah alat manajemen keselamatan, BUKAN pengganti keputusan
          kompeten geoteknik/operasional/mekanik/elektrik/emergency
RULE-019: Referensi regulasi adalah data konfigurasi, wajib direview sebelum production
RULE-020: Tidak boleh menambah dependency berbayar tanpa persetujuan HSE_ADMIN

# [BARU v2.0]
RULE-021: Aplikasi TIDAK PERNAH menjadi satu-satunya jalur eskalasi STOP WORK —
          komunikasi radio/verbal langsung wajib jadi jalur pertama
RULE-022: Closure finding CRITICAL wajib dual sign-off HSE_ADMIN, tidak cukup satu Supervisor
RULE-023: Apps Script wajib memverifikasi Firebase ID Token secara independen pada
          setiap request, tidak hanya mempercayai tiket Firestore
RULE-024: Kepemilikan Google Drive wajib akun fungsional/organisasi, bukan akun personal individu
RULE-025: Kepatuhan UU PDP direview legal internal sebelum go-live, bukan opsional
RULE-026: Kuota Firestore dimonitor aktif dengan contingency upgrade — sistem tidak
          boleh berhenti mencatat data safety-critical karena kuota habis
RULE-027: Backup wajib diuji restore-nya secara berkala, bukan hanya dibuat
```

---

## 55. FINAL SYSTEM FLOW

```
PATROL:
  LOGIN → START INSPECTION → SELECT AREA → GPS → CHECKLIST → MEASUREMENT
  → C/NC/OBS/NA → PHOTO → FINDING → RISK → CRITICAL CONTROL
  → [jika CRITICAL: RADIO KE SUPERVISOR DULU]     # [BARU v2.0]
  → IMMEDIATE ACTION → SUBMIT → OFFLINE QUEUE JIKA PERLU → AUTO SYNC → DRIVE EVIDENCE

SUPERVISOR:
  REVIEW → ASSIGN PIC → SET DUE DATE → MONITOR → VERIFY
  → CLOSE (non-critical) / ESKALASI KE HSE_ADMIN (jika critical)   # [BARU v2.0]

HSE_ADMIN:
  MASTER DATA → CHECKLIST → PARAMETERS → TARP → CRITICAL CONTROL → USERS
  → DASHBOARD → REPORT → AUDIT → DUAL SIGN-OFF CRITICAL CLOSURE     # [BARU v2.0]

MANAGEMENT:
  DASHBOARD → AREA STATUS → CRITICAL FINDINGS → OVERDUE → TREND → REPORT → EVIDENCE
```

---

# END OF BLUEPRINT — v2.0 CANONICAL

# DEPLOYMENT.md — Vercel + Firebase + Apps Script (Blueprint §51/§52)
Framework: Vite (output `dist`). `vercel.json`: rewrites `/(.*)→/index.html`.
Env: lihat `.env.example`. Tanpa env = DEMO lokal (tetap deployable).
PWA: vite-plugin-pwa, Firestore/Apps Script = NetworkOnly (§24).
Keamanan: headers nosniff/DENY/referrer. Secrets hanya di Vercel env + Apps Script Properties.

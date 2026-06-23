# V Move You — Hostinger Backend (Node.js + MySQL, MVC)

```
backend/
├─ package.json
├─ server.js          ← Express app bootstrap
├─ schema.sql         ← MySQL tables
├─ .env               ← Hostinger config (DB, JWT, paths) — DO NOT commit
├─ config/
│   ├─ db.js          ← MySQL pool
│   └─ storage.js     ← Upload dir paths
├─ middleware/
│   ├─ auth.js        ← JWT sign + requireAdmin
│   ├─ cors.js        ← CORS allow-list
│   ├─ upload.js      ← Multer (transfers + ads)
│   └─ errorHandler.js
├─ models/            ← All SQL queries live here
│   ├─ Admin.js
│   ├─ Transfer.js
│   ├─ Ad.js
│   └─ Visitor.js
├─ controllers/       ← Request handlers (business logic)
│   ├─ adminController.js
│   ├─ transferController.js   ← includes download w/ Range support
│   ├─ adController.js
│   └─ visitorController.js
├─ routes/            ← Thin Express routers
│   ├─ admin.js
│   ├─ transfers.js
│   ├─ ads.js
│   └─ visitors.js
└─ scripts/
    ├─ init-db.js
    └─ create-admin.js
```

## Download fix (kya badla)

`controllers/transferController.js → download()` mein:

1. **HTTP Range support (resume)** — agar browser/IDM `Range: bytes=...` bhejta hai
   to ab `206 Partial Content` return hota hai. Pehle yeh nahi tha, isliye
   download paused ya resume nahi hota tha aur browser "site wasn't available"
   dikhata tha.
2. **HEAD method** — browser pehle HEAD call karta hai size + resume check ke liye.
3. **Proper `Content-Length`** har response pe (full + partial dono).
4. **`Accept-Ranges: bytes`** header — bina iske browser resume disable kar deta hai.
5. **RFC 5987 `Content-Disposition`** — Unicode file names ab sahi se save hote
   hain (pehle `%20` jaisa literal naam mil raha tha).
6. CORS middleware mein `Content-Disposition`, `Content-Length`, `Content-Range`,
   `Accept-Ranges` ab cross-origin expose hote hain.

## Hostinger pe deploy / update steps

1. hPanel → **File Manager** → apne app folder (e.g. `~/vmoveyou-backend`)
   mein purani files ko backup karein ya rename karein.
2. Is `backend/` folder ka pura content upload karein
   (skip karein: `node_modules`, real `.env`, `uploads`).
3. hPanel → **Node.js** → **Run NPM Install**.
4. apna `.env` Hostinger pe likhein (template `.env` file ke andar pehle se hai —
   `REPLACE_WITH_...` values fill karein).
5. hPanel → Node.js → **Restart**.
6. Test:
   - `https://api.vmoveyou.com/health` → `{ok:true,...}`
   - `https://api.vmoveyou.com/api/transfers/by-code/<SHARE_CODE>` → JSON
   - `https://api.vmoveyou.com/api/transfers/by-code/<SHARE_CODE>/file/<FILE_ID>` → file download

## API endpoints

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/api/admin/login` | — | `{email,password}` → `{token}` |
| GET  | `/api/admin/me` | Bearer | |
| GET  | `/api/ads/active` | — | Public ads |
| GET  | `/api/ads` | Bearer | |
| POST | `/api/ads` | Bearer | |
| PUT  | `/api/ads/:id` | Bearer | |
| DELETE | `/api/ads/:id` | Bearer | |
| POST | `/api/ads/upload` | Bearer | multipart `file` |
| POST | `/api/transfers` | — | Create transfer |
| POST | `/api/transfers/:id/files` | — | multipart `files` |
| GET  | `/api/transfers/by-code/:code` | — | Lookup |
| GET/HEAD | `/api/transfers/by-code/:code/file/:fileId` | — | Download (Range/resume supported) |
| POST | `/api/visitors/heartbeat` | — | |
| GET  | `/api/visitors/live` | Bearer | |

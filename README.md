# ClearPath – Financial Tracker

A full-stack financial tracking web app for managing income, expenses, and debts.

## Tech Stack

* **Frontend:** React + TypeScript + Vite + Bootstrap
* **Backend:** Node.js + Express
* **Database:** MongoDB (Mongoose)

---

## Project Structure

```
financial-tracker
│
├── client        # React + Vite frontend
│   ├── src
│   ├── public
│   └── package.json
│
├── server        # Express backend API
│   ├── src
│   │   ├── routes
│   │   ├── controllers
│   │   ├── models
│   │   └── config
│   └── package.json
│
└── README.md
```

---

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher recommended)
- **npm** (comes with Node.js)
- **MongoDB** (local installation or MongoDB Atlas account)
- **Git**

---

## Setup Guide

Follow these steps to run the app locally and test login, registration, and logout.

### 1. Clone the Repository

```bash
git clone https://github.com/grauconejo13/financial-tracker.git
cd financial-tracker
```

---

### 2. Database Setup (MongoDB)

The app uses MongoDB. Choose one option:

#### Option A: Local MongoDB

1. Install MongoDB Community Server from [mongodb.com](https://www.mongodb.com/try/download/community)
2. Start MongoDB:
   - **Windows:** MongoDB usually runs as a Windows service. Or run `mongod` in a terminal.
   - **macOS/Linux:** Run `mongod` or `sudo systemctl start mongod`
3. Default connection: `mongodb://localhost:27017/clearpath`

#### Option B: MongoDB Atlas (Cloud)

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster and get your connection string (e.g. `mongodb+srv://user:password@cluster.mongodb.net/clearpath`)
3. You will use this in the server `.env` file (see step 5)

---

### 3. Server Setup (Backend)

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file (optional – defaults work for local dev):
   ```bash
   cp .env.example .env
   ```
   Edit `.env` if needed:
   ```
   PORT=4000
   MONGO_URI=mongodb://localhost:27017/clearpath
   JWT_SECRET=your-secret-key-change-in-production
   ```

4. Start the server:
   ```bash
   npm run dev
   ```

5. You should see:
   ```
   MongoDB connected
   Server running on http://localhost:4000
   ```

6. Keep this terminal open. The backend runs at **http://localhost:4000**

---

### 4. Client Setup (Frontend)

Open a **new terminal** and:

1. Navigate to the client directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   cp .env.example .env
   ```
   The `.env` should point at your API (server on port 4000):
   ```
   VITE_API_URL=http://localhost:4000
   ```

4. Start the client:
   ```bash
   npm run dev
   ```

5. You should see:
   ```
   VITE v7.x.x ready
   Local: http://localhost:5173/
   ```

6. The frontend runs at **http://localhost:5173**

---

### 5. Test Login, Registration & Logout

1. Open **http://localhost:5173** in your browser

2. **Register a new account:**
   - Click **Register**
   - Enter an email and password (min 6 characters)
   - Submit – you should be logged in automatically

3. **Logout:**
   - Click **Logout** in the header

4. **Login:**
   - Click **Login**
   - Enter the same email and password
   - Submit – you should be logged in

---

## Transactions, filters & accountability (CP-22 / CP-24 / CP-25)

| Area | What |
|------|------|
| **Accountability history** | Sidebar → **Accountability**. Lists reasons you gave for **creating**, **editing**, and **deleting** transactions (with change snapshots where applicable). |
| **Add transaction** | **Transactions** → **Add transaction** — requires a **reason** (min 5 chars) for the audit log. |
| **Filters** | Same page: **category** (with datalist from your data), **date range** (`YYYY-MM-DD` via date pickers), **Apply filters** / **Clear**. |
| **API** | `GET /api/transactions?category=&dateFrom=&dateTo=` · `GET /api/transactions/categories` · `POST /api/transactions` · `GET /api/accountability` |

**Backend tests:** from `server/`, run `npm test` (Vitest helpers for transaction list query parsing).

### Help chat (in-app)

- A **chat bubble** (bottom-right) opens **ClearPath help**: FAQ-style answers for everyone; **logged-in** users get **OpenAI** replies when the server has `OPENAI_API_KEY` set (never put that key in the frontend).
- **API:** `POST /api/chat` with JSON `{ "message": "…", "history": [{ "role": "user"|"assistant", "content": "…" }] }` — `Authorization: Bearer` optional.

---

## Quick Reference

| Component | URL | Port |
|-----------|-----|------|
| Frontend | http://localhost:5173 | 5173 |
| Backend API | http://localhost:4000 | 4000 |
| Health check | http://localhost:4000/health | - |

---

## Environment Variables

Copy `client/.env.example` → `client/.env` and `server/.env.example` → `server/.env`.

### Client (`client/.env`)

| Variable | Description | Example (local) |
|----------|-------------|-----------------|
| `VITE_API_URL` | Backend origin only — no `/api`, no trailing slash. **On Vercel use `https://…` (same as your API’s public URL).** Using `http://` while the site is HTTPS will cause blocked requests. | `http://localhost:4000` |

**Vercel:** set `VITE_API_URL` to your **deployed API** URL, then **redeploy**.

### Server (`server/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `4000` |
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/clearpath` |
| `JWT_SECRET` | Secret for JWT tokens | `dev-secret-change-me` |
| `CORS_ORIGINS` | Optional comma-separated frontend URLs (Vercel previews, custom domains). `localhost:5173` is always allowed. | _(empty)_ |
| `OPENAI_API_KEY` | Optional. If set, **logged-in** users get AI help from `POST /api/chat`; otherwise FAQ-only. | _(empty)_ |

---

## Troubleshooting

**"MongoDB connection error"**
- Ensure MongoDB is running (`mongod` or Windows service)
- Check `MONGO_URI` in `server/.env`
- For Atlas: ensure your IP is allowed in the Network Access settings

**"Failed to fetch" or login/register not working**
- Verify the server is running on port 4000
- Ensure `client/.env` has `VITE_API_URL=http://localhost:4000`
- Restart the client after changing `.env`

**Works locally but not on Vercel**
- Set `VITE_API_URL` on Vercel to your **hosted** API (not `localhost`) and redeploy
- On Render (API host): set `CORS_ORIGINS` if your Vercel URL is not the default one in code

**API returns 404 for `/api/transactions`, `/api/semester`, etc.**

- Your **Render (or other) service must run the Express app in `server/`**, not the Vite/React `client/`.
- In Render: **Settings → Root Directory** = `server`; **Build** = `npm install && npm run build`; **Start** = `npm start` (`node dist/server.js`). Or connect the repo using the root **`render.yaml`** Blueprint.
- Open `https://YOUR-SERVICE.onrender.com/health` — you should see `{"status":"ok"}`. If that URL 404s, the wrong app or start command is deployed.

**Vercel shows a blank page or nothing loads**
1. **Redeploy after env vars** — Vite reads `VITE_API_URL` at **build** time. In Vercel → Project → Settings → Environment Variables, set `VITE_API_URL` for **Production** (and **Preview** if you use previews), then **Redeploy**.
2. **Root directory** — If the repo contains `client` and `server`, set Vercel **Root Directory** to `client`, Build `npm run build`, Output `dist`.
3. **Browser DevTools → Console** — If you see `[ClearPath] API URL points to localhost…`, fix `VITE_API_URL` and redeploy.
4. **CORS** — The API allows `https://*.vercel.app` by default. For a **custom domain**, add it to server `CORS_ORIGINS` (comma-separated) and restart the API.

**Port already in use**
- Change `PORT` in `server/.env` and `VITE_API_URL` in `client/.env` accordingly

---

## Contributors

ClearPath Team

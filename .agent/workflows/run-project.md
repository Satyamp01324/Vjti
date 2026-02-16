---
description: How to run the NeuroPilot project (frontend + backend)
---

# Running NeuroPilot Project

This workflow runs both the frontend (Vite + React) and backend (FastAPI + Python) servers simultaneously.

## Prerequisites
- Python 3.12+ installed
- Node.js installed
- Backend dependencies installed (`pip install -r requirements.txt` in backend/)
- Frontend dependencies installed (`npm install` in frontend/)

## Quick Start (Recommended)

// turbo-all

### Option 1: Run using the root npm script
```bash
npm run dev
```
This starts both frontend (port 5174) and backend (port 8000) simultaneously using `concurrently`.

### Option 2: Run using the batch file (Windows)
```bash
start.bat
```

## Manual Start (Two Terminals)

If you prefer to run servers separately:

### Terminal 1 - Backend
```bash
cd backend
uvicorn main:app --reload --port 8000
```

### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```

## Access Points
- **Frontend**: http://localhost:5174
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/api/health

## Key Features Available
1. **Text Analysis** - `/api/analyze/text` - Analyze text for mental health insights
2. **Voice Input** - `/api/analyze/voice` - Speech-to-text with cognitive analysis
3. **Energy Tracking** - `/api/energy-history` - Track cognitive energy over time
4. **Smart Scheduler** - `/api/scheduler/*` - AI-powered task scheduling
5. **Auth System** - `/api/auth/*` - User registration and login

## Environment Variables
- Backend `.env`: SUPABASE_URL, SUPABASE_KEY, GROQ_API_KEY
- Frontend `.env`: VITE_API_URL, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY

## Troubleshooting
- **Port 5174 in use**: Change port in `vite.config.js`
- **Port 8000 in use**: Add `--port 8001` to uvicorn command
- **CORS errors**: Verify backend origins include your frontend URL
- **Module not found**: Run `pip install -r requirements.txt` or `npm install`

## PWA Features
- Service Worker registered at `/sw.js`
- Offline support with cache-first for assets
- Network-first for API calls
- Install prompt available for mobile/desktop

## Notes
- Backend auto-reloads on file changes (dev mode)
- Frontend HMR (Hot Module Replacement) enabled
- All API calls automatically persist to Supabase
- Service worker caches static assets for offline use

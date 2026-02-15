# Let Go 3.0 - Quick Start Guide

## ✅ Setup Complete!

All dependencies have been installed successfully.

## 🚀 Running the Application

### Option 1: Run Both Servers Together (Recommended)
```bash
npm run dev
```

This will start:
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:8000

### Option 2: Run Servers Separately

**Terminal 1 - Backend:**
```bash
cd backend
uvicorn main:app --reload
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

## 📍 Access Points

- **Frontend Application**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/api/health

## 🔧 Configuration

### Backend (.env)
Located at: `backend/.env`
- ✅ Supabase URL configured
- ✅ Supabase Key configured
- ✅ Groq API Key configured

### Frontend (.env)
Located at: `frontend/.env`
- ✅ API URL: http://localhost:8000
- ✅ Supabase credentials configured

## 📦 What's Installed

### Backend Dependencies
- FastAPI & Uvicorn (API server)
- Supabase (Database & Auth)
- Transformers & PyTorch (ML models)
- OpenAI Whisper (Speech-to-text)
- Groq (Fast transcription)
- Google Calendar API (Scheduling)

### Frontend Dependencies
- React 19 & Vite
- React Router (Navigation)
- Tailwind CSS (Styling)
- Framer Motion (Animations)
- Three.js (3D graphics)
- Recharts (Data visualization)
- Supabase Client

## 🎯 Key Features

1. **Text Analysis** - Mental health classification
2. **Voice Input** - Speech-to-text with analysis
3. **Energy Flow** - Cognitive energy tracking
4. **Smart Scheduler** - AI-powered task scheduling
5. **Deep Work Mode** - Focus optimization
6. **Recovery Cycles** - Mental health insights

## 🔍 Testing the Setup

1. Start the servers: `npm run dev`
2. Open http://localhost:5173
3. Check backend health: http://localhost:8000/api/health
4. View API docs: http://localhost:8000/docs

## 📝 Notes

- Backend runs on port 8000
- Frontend runs on port 5173
- Both servers auto-reload on file changes
- Supabase connection is pre-configured

## 🆘 Troubleshooting

**Port already in use:**
- Kill the process using the port or change ports in config

**Backend not starting:**
- Ensure Python 3.12+ is installed
- Check backend/.env file exists

**Frontend not starting:**
- Ensure Node.js is installed
- Run `npm install` in frontend folder

**Database errors:**
- Verify Supabase credentials in backend/.env
- Check internet connection

## 🎉 You're Ready!

Run `npm run dev` and start building!

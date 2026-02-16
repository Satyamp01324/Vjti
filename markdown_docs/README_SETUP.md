# 🚀 Let Go 3.0 - Complete Setup & Running Guide

## ✅ SETUP COMPLETE - SERVERS ARE RUNNING!

Your application is fully configured and running. Here's everything you need to know:

---

## 🌐 Access Your Application

### **Frontend (Main App)**
🔗 **http://localhost:5174**

### **Backend API**
🔗 **http://localhost:8000**
📚 **API Docs**: http://localhost:8000/docs
💚 **Health Check**: http://localhost:8000/api/health

---

## 📊 Current Status

| Component | Status | Port | Details |
|-----------|--------|------|---------|
| Frontend | ✅ Running | 5174 | React + Vite |
| Backend | ✅ Running | 8000 | FastAPI + Uvicorn |
| Database | ✅ Connected | - | Supabase |
| ML Models | ✅ Loaded | - | Whisper + Transformers |
| Groq API | ✅ Active | - | Fast transcription |

---

## 🎯 What You Can Do Now

### 1. Open the Application
Visit **http://localhost:5174** in your browser

### 2. Test the API
```bash
# Health check
curl http://localhost:8000/api/health

# Test text analysis
curl -X POST http://localhost:8000/api/analyze/text \
  -H "Content-Type: application/json" \
  -d '{"text": "I feel stressed today"}'
```

### 3. Explore API Documentation
Visit **http://localhost:8000/docs** for interactive API testing

---

## 🛠️ Project Structure

```
Let_Go_3.0/
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── pages/         # Page components
│   │   └── api.js         # API client
│   ├── .env               # Frontend config
│   └── package.json
│
├── backend/               # FastAPI backend
│   ├── core/             # Core modules
│   │   ├── pipeline.py   # Data pipeline
│   │   ├── auth.py       # Authentication
│   │   └── cognitive_scheduler.py
│   ├── models/           # ML models
│   ├── .env              # Backend config
│   └── main.py           # API entry point
│
├── start.bat             # Quick start script
└── package.json          # Root config
```

---

## 🔧 Configuration Files

### Backend Environment (backend/.env)
```env
SUPABASE_URL=https://cjdfadtrbddoclodxtjh.supabase.co
SUPABASE_KEY=eyJhbGc...
GROQ_API_KEY=gsk_kSd...
```

### Frontend Environment (frontend/.env)
```env
VITE_API_URL=http://localhost:8000
VITE_SUPABASE_URL=https://cjdfadtrbddoclodxtjh.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

---

## 🎨 Key Features Available

### 1. Text Analysis
- Mental health classification
- Stress, anxiety, depression detection
- Energy score calculation

### 2. Voice Input
- Speech-to-text transcription
- Voice tone analysis
- Automatic text analysis

### 3. Energy Flow System
- Real-time energy tracking
- Task recommendations
- Energy history visualization

### 4. Cognitive Scheduler
- AI-powered task scheduling
- Google Calendar integration
- Mental energy optimization

### 5. Authentication
- User registration
- Login/logout
- Profile management

### 6. Dashboard
- Cognitive insights
- Recovery cycles
- Deep work mode

---

## 🔄 Managing the Servers

### View Running Processes
Both servers are running in background processes with auto-reload enabled.

### Stop Servers
Close this Kiro session or manually terminate the processes.

### Restart Servers

**Option 1: Together (Recommended)**
```bash
npm run dev
```

**Option 2: Separately**

Terminal 1 - Backend:
```bash
cd backend
python -m uvicorn main:app --reload
```

Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

---

## 📚 API Endpoints

### Health & Info
- `GET /` - Welcome message
- `GET /api/health` - Health check
- `GET /api/model-info` - ML model information

### Analysis
- `POST /api/analyze/text` - Text analysis (full pipeline)
- `POST /api/analyze/voice` - Voice analysis (full pipeline)
- `POST /api/text-analysis` - Text only (no persistence)
- `POST /api/voice-analysis` - Voice only (no persistence)

### Data Queries
- `GET /api/sessions` - Recent analysis sessions
- `GET /api/sessions/{id}` - Single session details
- `GET /api/energy-history` - Energy score history
- `GET /api/energy-daily` - Daily energy averages

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile/{id}` - Get user profile
- `PUT /api/auth/profile` - Update profile

### Cognitive Scheduler
- `POST /api/scheduler/parse-task` - Parse task description
- `POST /api/scheduler/schedule` - Schedule single task
- `POST /api/scheduler/schedule-multiple` - Schedule multiple tasks
- `POST /api/scheduler/complete-task` - Mark task complete
- `GET /api/scheduler/stats` - Cognitive statistics
- `GET /api/scheduler/energy` - Current mental energy

---

## 🧪 Testing the Setup

### 1. Backend Health Check
```bash
curl http://localhost:8000/api/health
```
Expected: `{"status":"healthy","version":"2.0.0"}`

### 2. Frontend Access
Open http://localhost:5174 - should see the landing page

### 3. API Documentation
Visit http://localhost:8000/docs - interactive API explorer

### 4. Test Text Analysis
```bash
curl -X POST http://localhost:8000/api/analyze/text \
  -H "Content-Type: application/json" \
  -d '{"text": "I am feeling great today!"}'
```

---

## 🐛 Troubleshooting

### Frontend Issues

**Port 5174 not accessible?**
- Check if frontend process is running
- Look for errors in terminal output
- Try restarting: `cd frontend && npm run dev`

**Blank page or errors?**
- Open browser console (F12)
- Check for CORS errors
- Verify backend is running

### Backend Issues

**Port 8000 not responding?**
- Check if backend process is running
- Verify Python is installed: `python --version`
- Check backend/.env file exists

**Import errors?**
- Reinstall dependencies: `pip install -r backend/requirements.txt`
- Check Python version (requires 3.12+)

**Database errors?**
- Verify Supabase credentials in backend/.env
- Check internet connection
- Test Supabase connection: http://localhost:8000/api/test-supabase

### General Issues

**CORS errors?**
- Backend CORS is configured for localhost:5173 and 5174
- Check frontend/.env has correct API URL

**ML model loading slow?**
- First load downloads models (can take time)
- Subsequent loads are faster
- Check internet connection for downloads

---

## 💡 Development Tips

### Hot Reload
Both servers support hot reload:
- Frontend: Vite HMR (instant updates)
- Backend: Uvicorn --reload (auto-restart on changes)

### Debugging
- Frontend: Browser DevTools (F12)
- Backend: Check terminal output for logs
- API: Use http://localhost:8000/docs for testing

### Making Changes
1. Edit files in `frontend/src/` or `backend/`
2. Save the file
3. Server auto-reloads
4. Refresh browser (frontend) or re-test API (backend)

---

## 📦 Dependencies Installed

### Backend (Python)
- fastapi, uvicorn - Web framework
- supabase - Database client
- transformers, torch - ML models
- openai-whisper - Speech-to-text
- groq - Fast transcription API
- google-genai, google-api-python-client - Calendar integration
- scikit-learn, numpy - Data processing

### Frontend (Node.js)
- react, react-dom - UI framework
- vite - Build tool
- react-router-dom - Routing
- @supabase/supabase-js - Database client
- axios - HTTP client
- framer-motion - Animations
- three, @react-three/fiber - 3D graphics
- recharts - Data visualization
- tailwindcss - Styling

---

## 🎉 You're All Set!

Your Let Go 3.0 application is fully configured and running!

**Next Steps:**
1. Open http://localhost:5174
2. Create an account
3. Try text or voice analysis
4. Explore the cognitive scheduler
5. Check out the dashboard features

**Need Help?**
- API Docs: http://localhost:8000/docs
- Check terminal output for errors
- Review this guide for troubleshooting

---

**Happy Coding! 🚀**

# 🚀 NeuroPilot Deployment Guide

## PWA Installation Features

Your app is now a Progressive Web App (PWA) that can be installed on:
- ✅ Desktop (Windows, Mac, Linux)
- ✅ Mobile (iOS, Android)
- ✅ Tablets
- ✅ Works offline
- ✅ Fast loading
- ✅ Native app experience

## Testing PWA Locally

1. **Start the servers**:
   ```bash
   npm run dev
   ```

2. **Open Chrome** at http://localhost:5174

3. **Install the app**:
   - Look for install prompt at bottom of screen
   - OR click the install icon in address bar
   - OR go to Chrome menu → Install NeuroPilot

4. **Test on mobile**:
   - Open http://your-ip:5174 on phone
   - Tap "Add to Home Screen"
   - App installs like native app

## Deployment Options

### Option 1: Vercel (Frontend) + Railway (Backend)

#### Deploy Frontend to Vercel
```bash
cd frontend
npm install -g vercel
vercel login
vercel
```

Follow prompts:
- Project name: neuropilot
- Framework: Vite
- Build command: `npm run build`
- Output directory: `dist`

#### Deploy Backend to Railway
1. Go to https://railway.app
2. Click "New Project" → "Deploy from GitHub"
3. Select your repository
4. Add environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
   - `GROQ_API_KEY`
5. Railway auto-deploys backend

#### Update Frontend .env
```env
VITE_API_URL=https://your-backend.railway.app
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
```

### Option 2: Netlify (Frontend) + Render (Backend)

#### Deploy Frontend to Netlify
```bash
cd frontend
npm install -g netlify-cli
netlify login
netlify deploy --prod
```

#### Deploy Backend to Render
1. Go to https://render.com
2. New → Web Service
3. Connect GitHub repository
4. Settings:
   - Build Command: `pip install -r backend/requirements.txt`
   - Start Command: `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables

### Option 3: Docker (Full Stack)

```bash
# Build and run
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

Access:
- Frontend: http://localhost:5174
- Backend: http://localhost:8000

### Option 4: VPS (DigitalOcean, AWS, etc.)

#### Setup Script
```bash
# Install dependencies
sudo apt update
sudo apt install -y python3-pip nodejs npm nginx

# Clone repository
git clone your-repo-url
cd your-repo

# Setup backend
cd backend
pip3 install -r requirements.txt
nohup python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 &

# Setup frontend
cd ../frontend
npm install
npm run build

# Configure Nginx
sudo nano /etc/nginx/sites-available/neuropilot
```

Nginx config:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        root /path/to/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## PWA Requirements for Production

### 1. HTTPS Required
PWA requires HTTPS. All deployment platforms provide free SSL:
- Vercel: Automatic HTTPS
- Netlify: Automatic HTTPS
- Railway: Automatic HTTPS
- Custom domain: Use Let's Encrypt

### 2. Service Worker
Already configured in `/public/sw.js`

### 3. Manifest File
Already configured in `/public/manifest.json`

### 4. Icons
Generate icons using `/frontend/generate-icons.html`:
1. Open in browser
2. Icons download automatically
3. Place in `/frontend/public/`

Required sizes:
- 72x72, 96x96, 128x128, 144x144
- 152x152, 192x192, 384x384, 512x512

## Environment Variables

### Frontend (.env)
```env
VITE_API_URL=https://your-backend-url.com
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### Backend (.env)
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_anon_key
GROQ_API_KEY=your_groq_key
```

## Post-Deployment Checklist

- [ ] Frontend loads correctly
- [ ] Backend API responds
- [ ] Supabase connection works
- [ ] PWA install prompt appears
- [ ] App installs on desktop
- [ ] App installs on mobile
- [ ] Service worker registers
- [ ] Offline mode works
- [ ] Text analysis works
- [ ] Voice recording works
- [ ] Task scheduling works
- [ ] Real-time updates work

## Testing PWA Installation

### Desktop (Chrome/Edge)
1. Visit your deployed URL
2. Look for install icon in address bar
3. Click to install
4. App opens in standalone window

### Mobile (Android)
1. Open in Chrome
2. Tap menu → "Add to Home Screen"
3. App installs with icon
4. Opens fullscreen

### Mobile (iOS)
1. Open in Safari
2. Tap Share button
3. Tap "Add to Home Screen"
4. App installs with icon

## Monitoring & Analytics

### Add Google Analytics (Optional)
```javascript
// In frontend/index.html
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

### Error Tracking (Optional)
Consider adding:
- Sentry for error tracking
- LogRocket for session replay
- Mixpanel for user analytics

## Performance Optimization

Already implemented:
- ✅ Code splitting
- ✅ Lazy loading
- ✅ Service worker caching
- ✅ Gzip compression
- ✅ Image optimization
- ✅ Bundle optimization

## Troubleshooting

### PWA not installing
- Check HTTPS is enabled
- Verify manifest.json is accessible
- Check service worker registration
- Clear browser cache

### Service worker not updating
```javascript
// Force update
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(reg => reg.update());
});
```

### Icons not showing
- Verify icon files exist in /public/
- Check manifest.json paths
- Clear browser cache
- Regenerate icons if needed

## Support

For issues:
1. Check browser console for errors
2. Verify all environment variables
3. Test API endpoints directly
4. Check service worker status in DevTools

Your app is now production-ready and installable on all devices! 🎉

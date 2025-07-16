# 🚀 Digital Catalog AI Agent - Deployment Guide

## 📋 Quick Deploy Options

### Option 1: Vercel (Frontend) + Railway (Backend)

**Frontend Deployment (Vercel):**
1. Connect your GitHub repo to Vercel
2. Set environment variables in Vercel dashboard:
   ```
   REACT_APP_API_BASE_URL=https://your-backend-url.railway.app/api
   REACT_APP_FIREBASE_CONFIG={"apiKey":"your-key","authDomain":"your-domain"}
   ```
3. Deploy automatically on push to main branch

**Backend Deployment (Railway):**
1. Connect your GitHub repo to Railway
2. Set environment variables in Railway dashboard:
   ```
   GEMINI_API_KEY=AIzaSyCFcKQKkrTMSN8IXDgrt2fow25JJJKFKCQ
   FLASK_ENV=production
   PORT=5000
   ```
3. Deploy automatically on push to main branch

### Option 2: Netlify (Frontend) + Heroku (Backend)

**Frontend (Netlify):**
1. Connect GitHub repository
2. Build settings:
   - Build command: `cd TECHY-CRACKS && npm run build`
   - Publish directory: `TECHY-CRACKS/build`
3. Environment variables in Netlify dashboard

**Backend (Heroku):**
1. Create new Heroku app
2. Connect GitHub repository
3. Add Procfile: `web: python start_backend_with_api.py`
4. Set environment variables in Heroku dashboard

### Option 3: GitHub Pages (Frontend) + Railway (Backend)

**Frontend (GitHub Pages):**
1. Enable GitHub Pages in repository settings
2. Use GitHub Actions for automatic deployment
3. Create `.github/workflows/deploy.yml`

**Backend (Railway):**
Same as Option 1

### Option 4: Full Docker Deployment

**Docker Compose Setup:**
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    environment:
      - GEMINI_API_KEY=AIzaSyCFcKQKkrTMSN8IXDgrt2fow25JJJKFKCQ
    ports:
      - "5000:5000"
  
  frontend:
    build: ./TECHY-CRACKS
    environment:
      - REACT_APP_API_BASE_URL=http://localhost:5000/api
    ports:
      - "3000:3000"
```

## 🔧 Environment Variables Required

### Backend (.env)
```
GEMINI_API_KEY=AIzaSyCFcKQKkrTMSN8IXDgrt2fow25JJJKFKCQ
DATABASE_PATH=catalog_agent.db
FLASK_ENV=production
FLASK_DEBUG=False
```

### Frontend (.env)
```
REACT_APP_API_BASE_URL=https://your-backend-url.com/api
REACT_APP_FIREBASE_CONFIG={"apiKey":"your-key","authDomain":"your-domain"}
REACT_APP_ENABLE_VOICE_COMMANDS=true
REACT_APP_ENABLE_PRICE_SUGGESTIONS=true
REACT_APP_ENABLE_AUTO_CATEGORIZATION=true
```

## 📱 Production URLs

Once deployed, your application will be available at:
- **Frontend**: https://your-username.github.io/TECHY-CRACKS/
- **Backend**: https://your-app.railway.app/
- **API Docs**: https://your-app.railway.app/api/health

## 🛠️ Local Development

```bash
# Backend
cd backend
pip install -r requirements.txt
python start_backend_with_api.py

# Frontend
cd TECHY-CRACKS
npm install
npm run dev
```

## 🎯 Features Available in Production

✅ **AI-Powered Categorization** with Gemini API  
✅ **Voice Commands** in 11+ Indian languages  
✅ **Market-based Price Suggestions**  
✅ **Multilingual Descriptions**  
✅ **Real-time Database** with SQLite  
✅ **Responsive Design** for all devices  
✅ **Firebase Integration** for cloud sync  

## 🚀 Ready for Production!

Your Digital Catalog AI Agent is now production-ready and will help thousands of Indian farmers, artisans, and small business owners manage their inventory efficiently!
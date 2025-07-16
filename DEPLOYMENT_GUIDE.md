# 🚀 Digital Catalog AI Agent - Deployment Guide

This guide will help you deploy and test your enhanced Digital Catalog Creation & Maintenance Agent.

## 📋 Pre-Deployment Checklist

### ✅ System Requirements
- [x] Python 3.8+ installed
- [x] Node.js 14+ installed  
- [x] Modern web browser with speech recognition support
- [x] Gemini AI API key (optional but recommended)
- [x] Firebase project setup (for frontend features)

### ✅ Dependencies Installed
- [x] Backend: Flask, Flask-CORS, requests, google-generativeai
- [x] Frontend: React, Vite, Tailwind CSS, Firebase

## 🔧 Configuration Setup

### 1. Backend Configuration
Create `backend/.env` file:
```env
# Gemini AI API Key (Get from https://makersuite.google.com/app/apikey)
GEMINI_API_KEY=your_gemini_api_key_here

# Database Configuration
DATABASE_PATH=catalog_agent.db

# Flask Configuration
FLASK_ENV=development
FLASK_DEBUG=True

# Supported Languages
SUPPORTED_LANGUAGES=en,hi,ta,te,kn,ml,gu,mr,bn,or,pa
```

### 2. Frontend Configuration  
Create `TECHY-CRACKS/.env` file:
```env
# Backend API URL
REACT_APP_API_BASE_URL=http://localhost:5000/api

# Firebase Configuration (Replace with your config)
REACT_APP_FIREBASE_CONFIG={"apiKey":"your-api-key","authDomain":"your-project.firebaseapp.com","projectId":"your-project-id","storageBucket":"your-project.appspot.com","messagingSenderId":"123456789","appId":"your-app-id"}

# Feature Flags
REACT_APP_ENABLE_VOICE_COMMANDS=true
REACT_APP_ENABLE_PRICE_SUGGESTIONS=true
REACT_APP_ENABLE_AUTO_CATEGORIZATION=true
REACT_APP_ENABLE_MULTILINGUAL=true

# Default Language
REACT_APP_DEFAULT_LANGUAGE=en
REACT_APP_SPEECH_LANGUAGE=en-US
```

## 🚀 Deployment Steps

### Step 1: Start Backend Server
```bash
# Navigate to project root
cd "c:/Users/s2025/Downloads/techy cracks/TECHY-CRACKS/TECHY-CRACKS"

# Start the enhanced backend
python start_backend.py
```

Expected output:
```
🛒 Digital Catalog AI Agent Backend
==================================================
Starting enhanced backend server...
Features:
  ✅ Advanced NLP Processing
  ✅ Auto Product Categorization  
  ✅ Market-based Price Suggestions
  ✅ Multilingual Description Generation
  ✅ Voice Command Processing
  ✅ SQLite Database with History
==================================================
🌐 Server will be available at: http://localhost:5000
```

### Step 2: Start Frontend Application
```bash
# Open new terminal
cd "c:/Users/s2025/Downloads/techy cracks/TECHY-CRACKS/TECHY-CRACKS/TECHY-CRACKS"

# Install dependencies (if not done)
npm install

# Start development server
npm run dev
```

Expected output:
```
  ➜  Local:   http://localhost:3000/
  ➜  Network: http://192.168.x.x:3000/
```

## 🧪 Testing the Enhanced Features

### 1. Health Check
Visit: `http://localhost:5000/api/health`

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "ai_available": true
}
```

### 2. Test Voice Processing
```bash
curl -X POST http://localhost:5000/api/process-voice \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Add 1kg tomatoes for ₹30",
    "language": "en",
    "user_id": "test_user"
  }'
```

### 3. Test Price Suggestions
```bash
curl -X POST http://localhost:5000/api/get-price-suggestion \
  -H "Content-Type: application/json" \
  -d '{
    "product_name": "tomatoes",
    "quantity": "1kg"
  }'
```

### 4. Test Auto-Categorization
```bash
curl -X POST http://localhost:5000/api/categorize-product \
  -H "Content-Type: application/json" \
  -d '{
    "product_name": "basmati rice"
  }'
```

### 5. Test Multilingual Descriptions
```bash
curl -X POST http://localhost:5000/api/generate-description \
  -H "Content-Type: application/json" \
  -d '{
    "product_name": "tomatoes",
    "category": "Vegetables",
    "price": 30,
    "quantity": "1kg",
    "language": "hi"
  }'
```

## 🔍 Frontend Testing

### 1. Voice Commands
1. Open `http://localhost:3000`
2. Click "Start Voice Input" button
3. Speak: "Add 1kg tomatoes for ₹30"
4. Verify product is added with AI enhancements

### 2. Enhanced Features
- **Price Suggestions**: Should appear automatically when adding products
- **Auto-Categorization**: Products should be categorized automatically
- **Multilingual**: Switch languages and test descriptions
- **Voice Recognition**: Test with different Indian languages

## 📊 Performance Monitoring

### Backend Logs
Monitor backend console for:
- API request processing times
- AI response times
- Database operations
- Error handling

### Frontend Performance
Check browser console for:
- React component rendering
- Firebase sync status
- Voice recognition accuracy
- API response times

## 🐛 Troubleshooting

### Common Issues

#### Backend Not Starting
```bash
# Check Python version
python --version  # Should be 3.8+

# Install missing dependencies
pip install flask flask-cors requests google-generativeai
```

#### Frontend Build Errors
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check Node.js version
node --version  # Should be 14+
```

#### Voice Recognition Not Working
- Ensure HTTPS or localhost
- Check browser permissions for microphone
- Verify Web Speech API support

#### AI Features Limited
- Verify Gemini API key is set
- Check API key permissions
- Review backend logs for API errors

### Debug Mode
Enable detailed logging by setting:
```env
# Backend .env
FLASK_DEBUG=True
LOG_LEVEL=DEBUG

# Frontend .env
REACT_APP_DEBUG=true
```

## 📈 Production Deployment

### Backend (Google Cloud Run)
```bash
# Build Docker image
docker build -t catalog-ai-backend .

# Deploy to Cloud Run
gcloud run deploy catalog-ai-backend \
  --image catalog-ai-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### Frontend (Firebase Hosting)
```bash
# Build production version
npm run build

# Deploy to Firebase
firebase deploy
```

### Environment Variables (Production)
```env
# Backend
GEMINI_API_KEY=prod_api_key
DATABASE_PATH=/app/data/catalog_agent.db
FLASK_ENV=production

# Frontend  
REACT_APP_API_BASE_URL=https://your-backend-url.com/api
REACT_APP_FIREBASE_CONFIG={"your":"production_config"}
```

## 🔒 Security Considerations

### API Security
- Implement rate limiting
- Add authentication for sensitive endpoints
- Validate all input data
- Use HTTPS in production

### Data Protection
- Encrypt sensitive data
- Implement user data isolation
- Regular security audits
- Backup strategies

## 📞 Support

### Documentation
- **API Reference**: Check `docs/API.md`
- **User Guide**: See main `README.md`
- **Video Tutorials**: Coming soon

### Getting Help
- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-repo/discussions)
- **Email**: support@your-domain.com

---

## ✅ Deployment Success Checklist

- [ ] Backend server running on port 5000
- [ ] Frontend application running on port 3000
- [ ] Health check endpoint responding
- [ ] Voice command processing working
- [ ] Price suggestions functioning
- [ ] Auto-categorization active
- [ ] Multilingual descriptions generating
- [ ] Firebase sync operational
- [ ] All test cases passing

**🎉 Congratulations! Your Digital Catalog AI Agent is now deployed and ready for use!**

---

*Built with ❤️ for Indian farmers, artisans, and kirana store owners*
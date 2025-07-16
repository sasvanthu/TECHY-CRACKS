# 🚀 Complete Setup Guide - Digital Catalog AI Agent

## 🎯 Step-by-Step Instructions to Get Your Website Running

### Step 1: Environment Setup

**1.1 Create Backend Environment File**
```bash
# Navigate to backend folder
cd backend

# Create .env file with these contents:
```

Create `backend/.env` file with:
```env
# Get your Gemini API key from https://makersuite.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key_here

# Database configuration
DATABASE_PATH=catalog_agent.db

# Flask settings
FLASK_ENV=development
FLASK_DEBUG=True
FLASK_HOST=0.0.0.0
FLASK_PORT=5000

# Supported languages
SUPPORTED_LANGUAGES=en,hi,ta,te,kn,ml,gu,mr,bn,or,pa
```

**1.2 Create Frontend Environment File**
```bash
# Navigate to frontend folder
cd TECHY-CRACKS

# Create .env file with these contents:
```

Create `TECHY-CRACKS/.env` file with:
```env
# Backend API URL
REACT_APP_API_BASE_URL=http://localhost:5000/api

# Firebase configuration - Replace with your Firebase project config
REACT_APP_FIREBASE_CONFIG={"apiKey":"your-api-key","authDomain":"your-project.firebaseapp.com","projectId":"your-project-id","storageBucket":"your-project.appspot.com","messagingSenderId":"123456789","appId":"your-app-id"}

# Feature flags
REACT_APP_ENABLE_VOICE_COMMANDS=true
REACT_APP_ENABLE_PRICE_SUGGESTIONS=true
REACT_APP_ENABLE_AUTO_CATEGORIZATION=true
REACT_APP_ENABLE_MULTILINGUAL=true

# Default language
REACT_APP_DEFAULT_LANGUAGE=en
REACT_APP_SPEECH_LANGUAGE=en-US
```

### Step 2: Install Dependencies

**2.1 Backend Dependencies**
```bash
# Navigate to project root
cd "c:/Users/s2025/Downloads/techy cracks/TECHY-CRACKS/TECHY-CRACKS"

# Install Python dependencies
cd backend
pip install flask flask-cors requests google-generativeai

# Verify installation
python -c "import flask, flask_cors, requests, google.generativeai; print('✅ All Python dependencies installed!')"
```

**2.2 Frontend Dependencies**
```bash
# Navigate to frontend folder
cd ../TECHY-CRACKS

# Install Node.js dependencies
npm install

# Verify installation
npm list --depth=0
```

### Step 3: Start the Application

**3.1 Start Backend Server**
```bash
# Open Terminal 1
cd "c:/Users/s2025/Downloads/techy cracks/TECHY-CRACKS/TECHY-CRACKS"

# Start the backend
python start_backend.py

# You should see:
# 🛒 Digital Catalog AI Agent Backend
# ==================================================
# Starting enhanced backend server...
# 🌐 Server will be available at: http://localhost:5000
```

**3.2 Start Frontend Server**
```bash
# Open Terminal 2 (new terminal window)
cd "c:/Users/s2025/Downloads/techy cracks/TECHY-CRACKS/TECHY-CRACKS/TECHY-CRACKS"

# Start the frontend
npm run dev

# You should see:
# ➜  Local:   http://localhost:3000/
# ➜  Network: http://192.168.x.x:3000/
```

### Step 4: Access Your Website

**4.1 Open Your Browser**
- Navigate to: `http://localhost:3000`
- You should see the Digital Catalog AI Agent interface

**4.2 Test Backend API**
- Navigate to: `http://localhost:5000/api/health`
- You should see: `{"status": "healthy", "ai_available": true}`

### Step 5: Test Features

**5.1 Test Voice Commands**
1. Click "Start Voice Input" button
2. Speak: "Add 1kg tomatoes for ₹30"
3. Product should be added with AI enhancements

**5.2 Test Text Input**
1. Type: "Add 2kg onions for ₹25"
2. Press Enter or click Submit
3. Check for auto-categorization and price suggestions

**5.3 Test Enhanced Features**
1. Click "🚀 AI Enhanced Form" button
2. Enter product name: "basmati rice"
3. Watch AI suggestions appear automatically

### Step 6: Troubleshooting

**6.1 Backend Issues**
```bash
# Check if backend is running
curl http://localhost:5000/api/health

# If not working, check:
# - Python dependencies installed
# - Port 5000 not blocked
# - .env file configured correctly
```

**6.2 Frontend Issues**
```bash
# Check if frontend is running
curl http://localhost:3000

# If not working, check:
# - Node.js dependencies installed
# - Port 3000 not blocked
# - .env file configured correctly
```

**6.3 Common Solutions**
- **Port Already in Use**: Change ports in .env files
- **Dependencies Missing**: Re-run installation commands
- **API Key Issues**: Verify Gemini API key is correct
- **Firebase Issues**: Check Firebase configuration

### Step 7: Advanced Setup (Optional)

**7.1 Setup Gemini AI API**
1. Go to: https://makersuite.google.com/app/apikey
2. Create a new API key
3. Add it to `backend/.env` file
4. Restart backend server

**7.2 Setup Firebase**
1. Go to: https://console.firebase.google.com/
2. Create a new project
3. Enable Firestore and Authentication
4. Copy config to `TECHY-CRACKS/.env` file
5. Restart frontend

**7.3 Test Complete System**
```bash
# Run comprehensive demo
python demo_agent.py

# Run automated tests
python backend/test_agent.py
```

## 🎉 Your Website is Ready!

Once both servers are running:
- **Frontend**: http://localhost:3000 (Main Website)
- **Backend API**: http://localhost:5000/api (API Endpoints)
- **Health Check**: http://localhost:5000/api/health

## 🚀 Features Available

### ✅ Core Features
- Voice command processing in 11+ Indian languages
- Intelligent product categorization
- Market-based price suggestions
- Multilingual description generation
- Firebase integration for data sync
- Responsive design for all devices

### ✅ AI Features
- Natural language understanding
- Auto-categorization with confidence scores
- Price suggestions based on market data
- AI-generated product descriptions
- Voice recognition in multiple languages

### ✅ User Interface
- Modern, responsive design
- Real-time suggestions and feedback
- Enhanced forms with AI assistance
- Voice command guide
- Multi-language support

## 🎯 Perfect for:
- 👨‍🌾 **Farmers**: Voice-enabled catalog in local languages
- 🎨 **Artisans**: Smart categorization of handcrafts
- 🏪 **Kirana Owners**: Quick inventory with price intelligence

## 🆘 Need Help?
- Check `DEPLOYMENT_GUIDE.md` for detailed setup
- Review `ENHANCED_FEATURES_SUMMARY.md` for feature documentation
- Run `python demo_agent.py` for live demonstration

**Your Digital Catalog AI Agent is now ready to empower small businesses! 🚀**
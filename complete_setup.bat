@echo off
echo =========================================
echo 🛒 Digital Catalog AI Agent Setup
echo =========================================
echo 🚀 Starting your AI-powered catalog system...
echo.

REM Check if directories exist
if not exist "TECHY-CRACKS" (
    echo ERROR: TECHY-CRACKS directory not found
    pause
    exit /b 1
)

echo ✅ Setting up environment...
echo.

REM Set environment variables
set GEMINI_API_KEY=AIzaSyCFcKQKkrTMSN8IXDgrt2fow25JJJKFKCQ
set REACT_APP_API_BASE_URL=http://localhost:5000/api
set REACT_APP_FIREBASE_CONFIG={"apiKey":"demo","authDomain":"demo.firebaseapp.com","projectId":"demo","storageBucket":"demo.appspot.com","messagingSenderId":"123456789","appId":"demo"}

echo ✅ Environment variables set
echo.

REM Start backend in background
echo 🔧 Starting backend server...
start /min "Backend Server" cmd /c "venv\Scripts\activate && python start_backend_with_api.py"

REM Wait for backend to start
echo ⏳ Waiting for backend to start...
timeout /t 5 /nobreak > nul

REM Start frontend
echo 🌐 Starting frontend server...
cd TECHY-CRACKS
start "Frontend Server" cmd /c "npm run dev"

echo.
echo =========================================
echo 🎉 SUCCESS! Your website is starting!
echo =========================================
echo.
echo 🌐 Frontend: http://localhost:3000
echo 🔌 Backend: http://localhost:5000
echo ❤️  Health: http://localhost:5000/api/health
echo.
echo 🎯 Features available:
echo   🎤 Voice commands in 11+ languages
echo   🧠 AI categorization and pricing
echo   🌍 Multilingual descriptions
echo   📱 Responsive design
echo.
echo Press any key to open the website...
pause > nul

start http://localhost:3000

echo.
echo 🚀 Your AI-powered catalog is ready!
echo Press any key to close this window...
pause > nul
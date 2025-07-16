#!/usr/bin/env python3
"""
Quick Start Script for Digital Catalog AI Agent
Automates the setup and launch process
"""

import os
import subprocess
import sys
import time
import threading
from pathlib import Path

def print_banner():
    """Print startup banner"""
    print("\n" + "="*60)
    print("🛒 Digital Catalog AI Agent - Quick Start")
    print("="*60)
    print("🚀 Setting up your AI-powered catalog system...")
    print("🎯 Perfect for farmers, artisans, and kirana owners")
    print("="*60)

def check_prerequisites():
    """Check if required tools are installed"""
    print("\n🔍 Checking prerequisites...")
    
    # Check Python
    try:
        result = subprocess.run([sys.executable, "--version"], 
                              capture_output=True, text=True, check=True)
        print(f"✅ Python: {result.stdout.strip()}")
    except:
        print("❌ Python not found. Please install Python 3.8+")
        return False
    
    # Check Node.js
    try:
        result = subprocess.run(["node", "--version"], 
                              capture_output=True, text=True, check=True)
        print(f"✅ Node.js: {result.stdout.strip()}")
    except:
        print("❌ Node.js not found. Please install Node.js 14+")
        return False
    
    # Check npm
    try:
        result = subprocess.run(["npm", "--version"], 
                              capture_output=True, text=True, check=True)
        print(f"✅ npm: {result.stdout.strip()}")
    except:
        print("❌ npm not found. Please install npm")
        return False
    
    return True

def setup_environment():
    """Setup environment files"""
    print("\n🔧 Setting up environment files...")
    
    # Backend .env
    backend_env = """# Digital Catalog AI Agent - Backend Configuration
GEMINI_API_KEY=your_gemini_api_key_here
DATABASE_PATH=catalog_agent.db
FLASK_ENV=development
FLASK_DEBUG=True
FLASK_HOST=0.0.0.0
FLASK_PORT=5000
SUPPORTED_LANGUAGES=en,hi,ta,te,kn,ml,gu,mr,bn,or,pa
"""
    
    backend_env_path = Path("backend/.env")
    if not backend_env_path.exists():
        with open(backend_env_path, "w") as f:
            f.write(backend_env)
        print("✅ Created backend/.env")
    else:
        print("ℹ️  backend/.env already exists")
    
    # Frontend .env
    frontend_env = """# Digital Catalog AI Agent - Frontend Configuration
REACT_APP_API_BASE_URL=http://localhost:5000/api
REACT_APP_FIREBASE_CONFIG={"apiKey":"demo-key","authDomain":"demo.firebaseapp.com","projectId":"demo-project","storageBucket":"demo.appspot.com","messagingSenderId":"123456789","appId":"demo-app-id"}
REACT_APP_ENABLE_VOICE_COMMANDS=true
REACT_APP_ENABLE_PRICE_SUGGESTIONS=true
REACT_APP_ENABLE_AUTO_CATEGORIZATION=true
REACT_APP_ENABLE_MULTILINGUAL=true
REACT_APP_DEFAULT_LANGUAGE=en
REACT_APP_SPEECH_LANGUAGE=en-US
"""
    
    frontend_env_path = Path("TECHY-CRACKS/.env")
    if not frontend_env_path.exists():
        with open(frontend_env_path, "w") as f:
            f.write(frontend_env)
        print("✅ Created TECHY-CRACKS/.env")
    else:
        print("ℹ️  TECHY-CRACKS/.env already exists")

def install_dependencies():
    """Install required dependencies"""
    print("\n📦 Installing dependencies...")
    
    # Backend dependencies
    print("🐍 Installing Python dependencies...")
    try:
        subprocess.run([sys.executable, "-m", "pip", "install", 
                       "flask", "flask-cors", "requests", "google-generativeai"], 
                      check=True, cwd="backend")
        print("✅ Python dependencies installed")
    except subprocess.CalledProcessError:
        print("❌ Failed to install Python dependencies")
        return False
    
    # Frontend dependencies
    print("📦 Installing Node.js dependencies...")
    try:
        subprocess.run(["npm", "install"], check=True, cwd="TECHY-CRACKS")
        print("✅ Node.js dependencies installed")
    except subprocess.CalledProcessError:
        print("❌ Failed to install Node.js dependencies")
        return False
    
    return True

def start_backend():
    """Start the backend server"""
    print("\n🔧 Starting backend server...")
    try:
        process = subprocess.Popen([sys.executable, "start_backend.py"])
        print("✅ Backend server started on http://localhost:5000")
        return process
    except Exception as e:
        print(f"❌ Failed to start backend: {e}")
        return None

def start_frontend():
    """Start the frontend server"""
    print("\n🌐 Starting frontend server...")
    try:
        process = subprocess.Popen(["npm", "run", "dev"], cwd="TECHY-CRACKS")
        print("✅ Frontend server started on http://localhost:3000")
        return process
    except Exception as e:
        print(f"❌ Failed to start frontend: {e}")
        return None

def wait_for_servers():
    """Wait for servers to be ready"""
    print("\n⏳ Waiting for servers to start...")
    
    # Wait for backend
    backend_ready = False
    for i in range(30):
        try:
            import requests
            response = requests.get("http://localhost:5000/api/health", timeout=2)
            if response.status_code == 200:
                backend_ready = True
                break
        except:
            pass
        time.sleep(1)
        print(f"⏳ Backend starting... ({i+1}/30)")
    
    if backend_ready:
        print("✅ Backend is ready!")
    else:
        print("⚠️  Backend might still be starting...")
    
    # Wait a bit more for frontend
    print("⏳ Frontend starting...")
    time.sleep(5)
    print("✅ Frontend should be ready!")

def show_success_message():
    """Show final success message"""
    print("\n" + "="*60)
    print("🎉 SUCCESS! Your Digital Catalog AI Agent is running!")
    print("="*60)
    print("\n🌐 Access your website at:")
    print("   📱 Frontend: http://localhost:3000")
    print("   🔌 Backend API: http://localhost:5000/api")
    print("   ❤️  Health Check: http://localhost:5000/api/health")
    
    print("\n🚀 Features available:")
    print("   🎤 Voice commands in 11+ Indian languages")
    print("   🧠 AI-powered product categorization")
    print("   💰 Market-based price suggestions")
    print("   🌍 Multilingual description generation")
    print("   📱 Responsive design for all devices")
    
    print("\n🎯 Perfect for:")
    print("   👨‍🌾 Farmers - Voice-enabled catalog in local languages")
    print("   🎨 Artisans - Smart categorization of handcrafts")
    print("   🏪 Kirana Owners - Quick inventory with price intelligence")
    
    print("\n📝 Next steps:")
    print("   1. Open http://localhost:3000 in your browser")
    print("   2. Try voice commands: 'Add 1kg tomatoes for ₹30'")
    print("   3. Test AI features with the Enhanced Form")
    print("   4. Check SETUP_COMPLETE.md for detailed guide")
    
    print("\n🔧 Configuration:")
    print("   - Add your Gemini API key to backend/.env")
    print("   - Configure Firebase in TECHY-CRACKS/.env")
    print("   - Run 'python demo_agent.py' for live demo")
    
    print("\n" + "="*60)
    print("🚀 Your AI-powered catalog system is ready to use!")
    print("="*60)

def main():
    """Main setup function"""
    print_banner()
    
    # Check prerequisites
    if not check_prerequisites():
        print("\n❌ Prerequisites not met. Please install required tools.")
        return
    
    # Setup environment
    setup_environment()
    
    # Install dependencies
    if not install_dependencies():
        print("\n❌ Failed to install dependencies.")
        return
    
    # Start servers
    backend_process = start_backend()
    time.sleep(3)  # Give backend time to start
    
    frontend_process = start_frontend()
    
    # Wait for servers to be ready
    wait_for_servers()
    
    # Show success message
    show_success_message()
    
    # Keep running
    try:
        print("\n⚡ Press Ctrl+C to stop the servers")
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n\n🛑 Stopping servers...")
        if backend_process:
            backend_process.terminate()
        if frontend_process:
            frontend_process.terminate()
        print("✅ Servers stopped. Thank you for using Digital Catalog AI Agent!")

if __name__ == "__main__":
    main()
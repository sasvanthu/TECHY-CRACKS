#!/usr/bin/env python3
"""
Digital Catalog Creation & Maintenance Agent Setup Script
This script sets up the complete AI agent system with all dependencies
"""

import os
import sys
import subprocess
import json
from pathlib import Path

def run_command(command, description=""):
    """Run a command and handle errors"""
    print(f"\n{'='*50}")
    print(f"📋 {description}")
    print(f"Running: {command}")
    print('='*50)
    
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print("✅ Success!")
        if result.stdout:
            print(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error: {e}")
        if e.stderr:
            print(f"Error details: {e.stderr}")
        return False

def create_directory_structure():
    """Create the project directory structure"""
    print("\n🏗️  Creating directory structure...")
    
    directories = [
        "backend",
        "backend/models",
        "backend/utils",
        "backend/tests",
        "TECHY-CRACKS/src/components",
        "TECHY-CRACKS/src/utils",
        "data",
        "logs",
        "docs"
    ]
    
    for directory in directories:
        Path(directory).mkdir(parents=True, exist_ok=True)
        print(f"✅ Created: {directory}")

def setup_backend():
    """Set up the Python backend"""
    print("\n🐍 Setting up Python backend...")
    
    # Check Python version
    python_version = sys.version_info
    if python_version.major < 3 or (python_version.major == 3 and python_version.minor < 8):
        print("❌ Python 3.8+ is required")
        return False
    
    print(f"✅ Python version: {python_version.major}.{python_version.minor}.{python_version.micro}")
    
    # Create virtual environment
    if not run_command("python -m venv backend/venv", "Creating virtual environment"):
        return False
    
    # Activate virtual environment and install dependencies
    activate_script = "backend/venv/Scripts/activate" if os.name == 'nt' else "backend/venv/bin/activate"
    
    commands = [
        f"backend/venv/Scripts/pip install -r backend/requirements.txt" if os.name == 'nt' else f"backend/venv/bin/pip install -r backend/requirements.txt",
    ]
    
    for cmd in commands:
        if not run_command(cmd, "Installing Python dependencies"):
            return False
    
    return True

def setup_frontend():
    """Set up the React frontend"""
    print("\n⚛️  Setting up React frontend...")
    
    # Check if Node.js is installed
    try:
        result = subprocess.run("node --version", shell=True, capture_output=True, text=True)
        print(f"✅ Node.js version: {result.stdout.strip()}")
    except:
        print("❌ Node.js is not installed. Please install Node.js from https://nodejs.org/")
        return False
    
    # Install dependencies
    os.chdir("TECHY-CRACKS")
    
    commands = [
        "npm install",
        "npm install @vitejs/plugin-react",
        "npm install tailwindcss postcss autoprefixer",
        "npm install firebase",
        "npm install react-speech-recognition"
    ]
    
    for cmd in commands:
        if not run_command(cmd, f"Running: {cmd}"):
            return False
    
    os.chdir("..")
    return True

def create_configuration_files():
    """Create necessary configuration files"""
    print("\n⚙️  Creating configuration files...")
    
    # Create backend configuration
    backend_config = {
        "database": {
            "path": "data/catalog_agent.db",
            "backup_interval": 3600
        },
        "ai": {
            "model": "gemini-pro",
            "max_tokens": 1000,
            "temperature": 0.7
        },
        "rate_limiting": {
            "max_requests_per_minute": 60,
            "burst_limit": 10
        },
        "supported_languages": [
            "en", "hi", "ta", "te", "kn", "ml", "gu", "mr", "bn", "or", "pa"
        ],
        "categories": {
            "auto_categorize": True,
            "confidence_threshold": 0.7,
            "max_categories": 50
        }
    }
    
    with open("backend/config.json", "w") as f:
        json.dump(backend_config, f, indent=2)
    print("✅ Created backend configuration")
    
    # Create frontend environment template
    frontend_env = """# Digital Catalog Frontend Configuration

# Backend API URL
REACT_APP_API_BASE_URL=http://localhost:5000/api

# Firebase Configuration (Replace with your config)
REACT_APP_FIREBASE_CONFIG={"apiKey":"your-api-key","authDomain":"your-project.firebaseapp.com","projectId":"your-project-id","storageBucket":"your-project.appspot.com","messagingSenderId":"123456789","appId":"your-app-id"}

# Gemini AI API Key (Optional - can use backend instead)
REACT_APP_GEMINI_API_KEY=your_gemini_api_key_here

# Feature Flags
REACT_APP_ENABLE_VOICE_COMMANDS=true
REACT_APP_ENABLE_PRICE_SUGGESTIONS=true
REACT_APP_ENABLE_AUTO_CATEGORIZATION=true
REACT_APP_ENABLE_MULTILINGUAL=true

# Default Language
REACT_APP_DEFAULT_LANGUAGE=en

# Speech Recognition Language
REACT_APP_SPEECH_LANGUAGE=en-US
"""
    
    with open("TECHY-CRACKS/.env.example", "w") as f:
        f.write(frontend_env)
    print("✅ Created frontend environment template")

def create_startup_scripts():
    """Create startup scripts for easy development"""
    print("\n🚀 Creating startup scripts...")
    
    # Backend startup script
    backend_script = """#!/bin/bash
# Digital Catalog Backend Startup Script

echo "🐍 Starting Digital Catalog AI Agent Backend..."
echo "========================================"

# Activate virtual environment
source backend/venv/bin/activate

# Set environment variables
export FLASK_APP=backend/app.py
export FLASK_ENV=development

# Start the backend server
cd backend
python app.py

echo "Backend started on http://localhost:5000"
"""
    
    with open("start_backend.sh", "w") as f:
        f.write(backend_script)
    
    # Windows batch file
    backend_bat = """@echo off
REM Digital Catalog Backend Startup Script for Windows

echo 🐍 Starting Digital Catalog AI Agent Backend...
echo ========================================

REM Activate virtual environment
call backend\\venv\\Scripts\\activate.bat

REM Set environment variables
set FLASK_APP=backend\\app.py
set FLASK_ENV=development

REM Start the backend server
cd backend
python app.py

echo Backend started on http://localhost:5000
pause
"""
    
    with open("start_backend.bat", "w") as f:
        f.write(backend_bat)
    
    # Frontend startup script
    frontend_script = """#!/bin/bash
# Digital Catalog Frontend Startup Script

echo "⚛️  Starting Digital Catalog Frontend..."
echo "====================================="

cd TECHY-CRACKS
npm run dev

echo "Frontend started on http://localhost:3000"
"""
    
    with open("start_frontend.sh", "w") as f:
        f.write(frontend_script)
    
    # Windows batch file
    frontend_bat = """@echo off
REM Digital Catalog Frontend Startup Script for Windows

echo ⚛️  Starting Digital Catalog Frontend...
echo =====================================

cd TECHY-CRACKS
npm run dev

echo Frontend started on http://localhost:3000
pause
"""
    
    with open("start_frontend.bat", "w") as f:
        f.write(frontend_bat)
    
    # Make scripts executable on Unix systems
    if os.name != 'nt':
        os.chmod("start_backend.sh", 0o755)
        os.chmod("start_frontend.sh", 0o755)
    
    print("✅ Created startup scripts")

def create_documentation():
    """Create comprehensive documentation"""
    print("\n📚 Creating documentation...")
    
    readme_content = """# 🛒 Digital Catalog Creation & Maintenance Agent

An advanced AI-powered voice-enabled system designed to help farmers, artisans, and kirana store owners effortlessly create and manage digital product catalogs.

## 🌟 Enhanced Features

### 🧠 Advanced AI Capabilities
- **Smart NLP Processing**: Enhanced natural language understanding for voice commands
- **Auto-Categorization**: Intelligent product categorization with confidence scoring
- **Price Suggestions**: Market-based price recommendations
- **Multilingual Descriptions**: AI-generated product descriptions in 11+ Indian languages

### 🎤 Voice Intelligence
- **Advanced Voice Commands**: Natural language processing for complex commands
- **Multi-language Support**: Voice input in Hindi, Tamil, Telugu, and more
- **Intent Recognition**: Understands add, update, delete, and search commands
- **Context Awareness**: Maintains conversation context for better understanding

### 💰 Smart Pricing
- **Market Analysis**: Real-time price suggestions based on market data
- **Historical Trends**: Price history tracking and analysis
- **Confidence Scoring**: Reliability indicators for price suggestions
- **Dynamic Pricing**: Adjusts recommendations based on quantity and location

### 🏷️ Intelligent Categorization
- **Auto-Tagging**: Generates relevant tags for products
- **Category Confidence**: Shows categorization confidence levels
- **Custom Categories**: Supports custom category creation
- **Keyword Matching**: Advanced keyword-based categorization

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 14+
- Gemini AI API Key

### Installation

1. **Clone and Setup**
   ```bash
   git clone <repository-url>
   cd digital-catalog-agent
   python setup_agent.py
   ```

2. **Configure Environment**
   ```bash
   cp backend/.env.example backend/.env
   cp TECHY-CRACKS/.env.example TECHY-CRACKS/.env
   # Edit the .env files with your API keys
   ```

3. **Start the Application**
   ```bash
   # Terminal 1: Backend
   ./start_backend.sh  # or start_backend.bat on Windows
   
   # Terminal 2: Frontend
   ./start_frontend.sh  # or start_frontend.bat on Windows
   ```

## 🎯 Usage Examples

### Voice Commands
- **Add Products**: "Add 1kg tomatoes for ₹30"
- **Price Inquiry**: "What's the market price of onions?"
- **Search**: "Show me all vegetables under ₹50"
- **Update**: "Update rice price to ₹45 per kg"

### Text Input
- Natural language text input with same intelligence as voice
- Automatic entity extraction (product, quantity, price)
- Smart categorization and tagging

## 🛠️ Technical Architecture

### Backend (Python Flask)
- **NLP Engine**: Advanced text processing with Gemini AI
- **Database**: SQLite with optimization for catalog data
- **API Layer**: RESTful endpoints for all features
- **Price Engine**: Market analysis and suggestion algorithms

### Frontend (React)
- **Modern UI**: Responsive design with Tailwind CSS
- **Real-time Updates**: Firebase integration for live data
- **Voice Interface**: Web Speech API integration
- **Multilingual**: Support for 11+ Indian languages

## 📖 API Documentation

### Core Endpoints
- `POST /api/process-voice` - Process voice commands
- `POST /api/add-product` - Add products with AI enhancement
- `POST /api/get-price-suggestion` - Get market-based price suggestions
- `POST /api/categorize-product` - Auto-categorize products
- `POST /api/generate-description` - Generate multilingual descriptions

### Voice Command API
```javascript
// Process voice command
fetch('/api/process-voice', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: "Add 1kg tomatoes for ₹30",
    language: "hi",
    user_id: "user123"
  })
})
```

## 🌍 Language Support

### Supported Languages
- English (en)
- Hindi (hi) - हिंदी
- Tamil (ta) - தமிழ்
- Telugu (te) - తెలుగు
- Kannada (kn) - ಕನ್ನಡ
- Malayalam (ml) - മലയാളം
- Gujarati (gu) - ગુજરાતી
- Marathi (mr) - मराठी
- Bengali (bn) - বাংলা
- Odia (or) - ଓଡ଼ିଆ
- Punjabi (pa) - ਪੰਜਾਬੀ

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines for details.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Google Gemini AI for natural language processing
- Firebase for real-time database
- React and Node.js communities
- Open source speech recognition libraries
"""
    
    with open("README.md", "w", encoding="utf-8") as f:
        f.write(readme_content)
    
    # Create API documentation
    api_docs = """# API Documentation

## Authentication
All API endpoints require a valid user_id parameter.

## Endpoints

### Voice Processing
**POST** `/api/process-voice`

Process natural language voice commands with advanced NLP.

**Request Body:**
```json
{
  "text": "Add 1kg tomatoes for ₹30",
  "language": "en",
  "user_id": "user123"
}
```

**Response:**
```json
{
  "success": true,
  "intent": "add_product",
  "entities": {
    "product_name": "tomatoes",
    "quantity": "1kg",
    "price": 30,
    "confidence": 0.95
  },
  "product": {
    "id": 123,
    "name": "tomatoes",
    "category": "Vegetables",
    "tags": ["fresh", "local"],
    "description": "Fresh and crisp tomatoes..."
  }
}
```

### Price Suggestions
**POST** `/api/get-price-suggestion`

Get market-based price suggestions for products.

**Request Body:**
```json
{
  "product_name": "tomatoes",
  "category": "Vegetables",
  "quantity": "1kg"
}
```

**Response:**
```json
{
  "success": true,
  "price_suggestions": {
    "min_price": 25.0,
    "max_price": 40.0,
    "suggested_price": 30.0,
    "confidence": 0.85
  }
}
```

### Product Categorization
**POST** `/api/categorize-product`

Automatically categorize products and generate tags.

**Request Body:**
```json
{
  "product_name": "basmati rice"
}
```

**Response:**
```json
{
  "success": true,
  "category": "Grains & Cereals",
  "tags": ["premium", "aromatic", "long-grain"],
  "confidence": 0.92
}
```

### Description Generation
**POST** `/api/generate-description`

Generate multilingual product descriptions.

**Request Body:**
```json
{
  "product_name": "tomatoes",
  "category": "Vegetables",
  "price": 30,
  "quantity": "1kg",
  "language": "hi"
}
```

**Response:**
```json
{
  "success": true,
  "description": "ताज़े और कुरकुरे टमाटर, सीधे खेत से! आपकी रोज़ाना खाना पकाने की ज़रूरतों के लिए बिल्कुल सही।"
}
```
"""
    
    with open("docs/API.md", "w", encoding="utf-8") as f:
        f.write(api_docs)
    
    print("✅ Created comprehensive documentation")

def main():
    """Main setup function"""
    print("🛒 Digital Catalog Creation & Maintenance Agent Setup")
    print("=" * 60)
    print("This script will set up the complete AI agent system.")
    print("Please ensure you have Python 3.8+ and Node.js 14+ installed.")
    
    # Confirm setup
    confirm = input("\nDo you want to proceed with the setup? (y/N): ")
    if confirm.lower() != 'y':
        print("Setup cancelled.")
        return
    
    try:
        # Step 1: Create directory structure
        create_directory_structure()
        
        # Step 2: Setup backend
        if not setup_backend():
            print("❌ Backend setup failed!")
            return
        
        # Step 3: Setup frontend
        if not setup_frontend():
            print("❌ Frontend setup failed!")
            return
        
        # Step 4: Create configuration files
        create_configuration_files()
        
        # Step 5: Create startup scripts
        create_startup_scripts()
        
        # Step 6: Create documentation
        create_documentation()
        
        print("\n" + "=" * 60)
        print("🎉 SETUP COMPLETE!")
        print("=" * 60)
        print("\nNext Steps:")
        print("1. Copy backend/.env.example to backend/.env and add your API keys")
        print("2. Copy TECHY-CRACKS/.env.example to TECHY-CRACKS/.env and configure")
        print("3. Get a Gemini AI API key from https://makersuite.google.com/app/apikey")
        print("4. Start the backend: ./start_backend.sh (or .bat on Windows)")
        print("5. Start the frontend: ./start_frontend.sh (or .bat on Windows)")
        print("\n📖 Check README.md for detailed usage instructions")
        print("🚀 Your Digital Catalog AI Agent is ready!")
        
    except Exception as e:
        print(f"\n❌ Setup failed with error: {e}")
        print("Please check the error messages above and try again.")

if __name__ == "__main__":
    main()
#!/usr/bin/env python3
"""
Simple startup script for the Digital Catalog AI Agent Backend
"""

import os
import sys
from backend.app import app

def main():
    print("🛒 Digital Catalog AI Agent Backend")
    print("=" * 50)
    print("Starting enhanced backend server...")
    print("Features:")
    print("  ✅ Advanced NLP Processing")
    print("  ✅ Auto Product Categorization")
    print("  ✅ Market-based Price Suggestions")
    print("  ✅ Multilingual Description Generation")
    print("  ✅ Voice Command Processing")
    print("  ✅ SQLite Database with History")
    print("=" * 50)
    
    # Check for API key
    api_key = os.getenv('GEMINI_API_KEY', '')
    if api_key:
        print(f"🔑 Gemini API Key: {api_key[:10]}...")
    else:
        print("⚠️  No Gemini API key found. AI features will use fallback mode.")
        print("   To enable full AI features, set GEMINI_API_KEY environment variable.")
    
    print("\n🌐 Server will be available at: http://localhost:5000")
    print("📖 API Documentation: http://localhost:5000/api/health")
    print("\nPress Ctrl+C to stop the server")
    print("=" * 50)
    
    try:
        app.run(debug=True, host='0.0.0.0', port=5000)
    except KeyboardInterrupt:
        print("\n\n👋 Server stopped. Thank you for using Digital Catalog AI Agent!")

if __name__ == "__main__":
    main()
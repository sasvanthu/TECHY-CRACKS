#!/usr/bin/env python3
"""
Start backend server with API key
"""

import os
import sys

# Set the API key
os.environ['GEMINI_API_KEY'] = 'AIzaSyCFcKQKkrTMSN8IXDgrt2fow25JJJKFKCQ'

# Import and run the Flask app
from backend.app import app

if __name__ == '__main__':
    print("🛒 Digital Catalog AI Agent Backend")
    print("="*60)
    print("🚀 Starting with Gemini AI enabled...")
    print("🔑 API Key configured successfully!")
    print("🌐 Server will be available at: http://localhost:5000")
    print("📖 API Health Check: http://localhost:5000/api/health")
    print("="*60)
    print("Press Ctrl+C to stop the server")
    print("="*60)
    
    try:
        port = int(os.environ.get('PORT', 5000))
        app.run(debug=False, host='0.0.0.0', port=port, use_reloader=False)
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
        sys.exit(0)
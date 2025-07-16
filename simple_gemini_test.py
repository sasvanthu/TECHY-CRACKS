#!/usr/bin/env python3
"""
Simple test for Gemini API using the older version
"""

import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv("backend/.env")

def test_gemini_api():
    """Test if Gemini API key is working with old version"""
    api_key = os.getenv('GEMINI_API_KEY')
    
    print("🧪 Testing Gemini API Connection...")
    print(f"🔑 API Key: {api_key[:20]}...{api_key[-10:]}")
    
    try:
        # Use the old API format
        import google.generativeai as genai
        import google.ai.generativelanguage as glm
        
        # Create a client
        client = glm.GenerativeServiceClient()
        
        # Test basic connection
        model = "models/text-bison-001"
        
        # Create a request
        request = glm.GenerateTextRequest(
            model=model,
            prompt=glm.TextPrompt(text="Say hello from Gemini AI"),
            temperature=0.7,
            candidate_count=1,
            max_output_tokens=100
        )
        
        # Make the request
        response = client.generate_text(request)
        
        print("✅ API Connection Successful!")
        print(f"🤖 Response: {response.candidates[0].output}")
        
        return True
        
    except Exception as e:
        print(f"❌ API Connection Failed: {e}")
        
        # Try alternative approach
        try:
            import requests
            
            url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"
            headers = {
                "Content-Type": "application/json",
                "x-goog-api-key": api_key
            }
            
            data = {
                "contents": [
                    {
                        "parts": [
                            {
                                "text": "Say hello from Gemini AI"
                            }
                        ]
                    }
                ]
            }
            
            response = requests.post(url, headers=headers, json=data)
            
            if response.status_code == 200:
                result = response.json()
                print("✅ API Connection Successful (Direct HTTP)!")
                print(f"🤖 Response: {result['candidates'][0]['content']['parts'][0]['text']}")
                return True
            else:
                print(f"❌ HTTP API Failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e2:
            print(f"❌ HTTP API also failed: {e2}")
            return False

if __name__ == "__main__":
    success = test_gemini_api()
    if success:
        print("\n🎉 Your Gemini API key is working!")
        print("🚀 AI features will be available in your catalog!")
    else:
        print("\n⚠️ API test failed. The app will use fallback mode.")
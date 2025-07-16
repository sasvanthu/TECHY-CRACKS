#!/usr/bin/env python3
"""
Test script to verify Gemini API key is working
"""

import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv("backend/.env")

def test_gemini_api():
    """Test if Gemini API key is working"""
    api_key = os.getenv('GEMINI_API_KEY')
    
    print("🧪 Testing Gemini API Connection...")
    print(f"🔑 API Key: {api_key[:20]}...{api_key[-10:]}")
    
    try:
        import google.generativeai as genai
        
        # Configure the API
        genai.configure(api_key=api_key)
        
        # Test with a simple prompt
        model = genai.GenerativeModel('gemini-pro')
        response = model.generate_content("Say 'Hello from Gemini AI!'")
        
        print("✅ API Connection Successful!")
        print(f"🤖 Response: {response.text}")
        
        # Test with a product categorization example
        print("\n🏷️ Testing Product Categorization...")
        categorization_prompt = """
        Categorize this product: "basmati rice"
        Provide: category, subcategory, tags, description
        Format as JSON.
        """
        
        cat_response = model.generate_content(categorization_prompt)
        print(f"📦 Categorization: {cat_response.text}")
        
        return True
        
    except Exception as e:
        print(f"❌ API Connection Failed: {e}")
        return False

if __name__ == "__main__":
    success = test_gemini_api()
    if success:
        print("\n🎉 Your Gemini API key is working perfectly!")
        print("🚀 All AI features are now enabled in your Digital Catalog!")
    else:
        print("\n⚠️ API key test failed. Please check your configuration.")
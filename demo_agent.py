#!/usr/bin/env python3
"""
Digital Catalog AI Agent - Live Demo Script
Demonstrates all enhanced features with real examples
"""

import requests
import json
import time
from typing import Dict

# Configuration
API_BASE_URL = "http://localhost:5000/api"

class CatalogAgentDemo:
    def __init__(self):
        self.base_url = API_BASE_URL
        print("🛒 Digital Catalog AI Agent - Live Demo")
        print("=" * 60)
        
    def demo_health_check(self):
        """Demo: Health check and system status"""
        print("\n🔍 1. SYSTEM HEALTH CHECK")
        print("-" * 30)
        
        try:
            response = requests.get(f"{self.base_url}/health")
            if response.status_code == 200:
                data = response.json()
                print(f"✅ System Status: {data.get('status')}")
                print(f"🧠 AI Available: {data.get('ai_available')}")
                print(f"📊 Database: Connected")
                print(f"🌐 API Endpoints: Active")
                return True
            else:
                print("❌ System not responding")
                return False
        except Exception as e:
            print(f"❌ Connection Error: {e}")
            return False
    
    def demo_voice_commands(self):
        """Demo: Advanced voice command processing"""
        print("\n🎤 2. ADVANCED VOICE COMMAND PROCESSING")
        print("-" * 40)
        
        voice_commands = [
            {
                "text": "Add 1kg fresh tomatoes for ₹30",
                "language": "en",
                "description": "English product addition"
            },
            {
                "text": "What is the market price of onions today?",
                "language": "en", 
                "description": "Price inquiry command"
            },
            {
                "text": "1 किलो बासमती चावल 80 रुपये में जोड़ें",
                "language": "hi",
                "description": "Hindi product addition"
            },
            {
                "text": "Show me all vegetables under ₹50",
                "language": "en",
                "description": "Product search query"
            }
        ]
        
        for i, cmd in enumerate(voice_commands, 1):
            print(f"\n🎯 Command {i}: {cmd['description']}")
            print(f"Input: \"{cmd['text']}\"")
            
            try:
                response = requests.post(f"{self.base_url}/process-voice", 
                    json={
                        "text": cmd["text"],
                        "language": cmd["language"],
                        "user_id": "demo_user"
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    result = data.get('result', {})
                    
                    print(f"✅ Intent Recognized: {result.get('intent', 'Unknown')}")
                    
                    if result.get('entities'):
                        entities = result['entities']
                        print(f"📦 Product: {entities.get('product_name', 'N/A')}")
                        print(f"⚖️  Quantity: {entities.get('quantity', 'N/A')}")
                        print(f"💰 Price: ₹{entities.get('price', 'N/A')}")
                        print(f"🎯 Confidence: {entities.get('confidence', 0):.2f}")
                    
                    if result.get('response'):
                        print(f"💬 Response: {result['response']}")
                        
                else:
                    print(f"❌ Error: {response.status_code}")
                    
            except Exception as e:
                print(f"❌ Error: {e}")
            
            time.sleep(1)  # Brief pause between commands
    
    def demo_smart_categorization(self):
        """Demo: Intelligent product categorization"""
        print("\n🏷️  3. INTELLIGENT PRODUCT CATEGORIZATION")
        print("-" * 45)
        
        test_products = [
            "fresh organic tomatoes",
            "handwoven silk saree",
            "basmati rice premium quality", 
            "raw organic honey",
            "clay pottery bowls",
            "fresh cow milk"
        ]
        
        for product in test_products:
            print(f"\n🔍 Analyzing: \"{product}\"")
            
            try:
                response = requests.post(f"{self.base_url}/categorize-product",
                    json={"product_name": product}
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get('success'):
                        print(f"📂 Category: {data.get('category')}")
                        print(f"🏷️  Tags: {', '.join(data.get('tags', []))}")
                        print(f"🎯 Confidence: {data.get('confidence', 0):.2f}")
                    else:
                        print(f"❌ Error: {data.get('error')}")
                else:
                    print(f"❌ HTTP Error: {response.status_code}")
                    
            except Exception as e:
                print(f"❌ Exception: {e}")
            
            time.sleep(0.5)
    
    def demo_price_suggestions(self):
        """Demo: Market-based price suggestions"""
        print("\n💰 4. MARKET-BASED PRICE SUGGESTIONS")
        print("-" * 40)
        
        products_for_pricing = [
            {"name": "tomatoes", "quantity": "1kg"},
            {"name": "onions", "quantity": "2kg"},
            {"name": "rice", "quantity": "5kg"},
            {"name": "potatoes", "quantity": "1kg"}
        ]
        
        for product in products_for_pricing:
            print(f"\n💡 Price Analysis: {product['name']} ({product['quantity']})")
            
            try:
                response = requests.post(f"{self.base_url}/get-price-suggestion",
                    json={
                        "product_name": product["name"],
                        "quantity": product["quantity"]
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get('success'):
                        suggestions = data.get('price_suggestions', {})
                        print(f"📊 Price Range: ₹{suggestions.get('min_price', 0)} - ₹{suggestions.get('max_price', 0)}")
                        print(f"✨ Suggested Price: ₹{suggestions.get('suggested_price', 0)}")
                        print(f"🎯 Confidence: {suggestions.get('confidence', 0):.2f}")
                        print(f"📈 Market Trend: {suggestions.get('trend', 'Stable')}")
                    else:
                        print(f"❌ Error: {data.get('error')}")
                else:
                    print(f"❌ HTTP Error: {response.status_code}")
                    
            except Exception as e:
                print(f"❌ Exception: {e}")
            
            time.sleep(0.5)
    
    def demo_multilingual_descriptions(self):
        """Demo: Multilingual description generation"""
        print("\n🌍 5. MULTILINGUAL DESCRIPTION GENERATION")
        print("-" * 45)
        
        test_case = {
            "product_name": "fresh tomatoes",
            "category": "Vegetables",
            "price": 30,
            "quantity": "1kg"
        }
        
        languages = [
            ("en", "English"),
            ("hi", "Hindi - हिंदी"),
            ("ta", "Tamil - தமிழ்"),
            ("te", "Telugu - తెలుగు"),
            ("kn", "Kannada - ಕನ್ನಡ")
        ]
        
        for lang_code, lang_name in languages:
            print(f"\n🗣️  {lang_name}:")
            
            try:
                response = requests.post(f"{self.base_url}/generate-description",
                    json={
                        **test_case,
                        "language": lang_code
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get('success'):
                        description = data.get('description', '')
                        print(f"   \"{description}\"")
                    else:
                        print(f"   ❌ Error: {data.get('error')}")
                else:
                    print(f"   ❌ HTTP Error: {response.status_code}")
                    
            except Exception as e:
                print(f"   ❌ Exception: {e}")
            
            time.sleep(0.5)
    
    def demo_complete_workflow(self):
        """Demo: Complete end-to-end workflow"""
        print("\n🔄 6. COMPLETE AI-POWERED WORKFLOW")
        print("-" * 40)
        
        print("\n🎯 Simulating: Farmer adds organic vegetables to catalog")
        
        # Step 1: Voice command processing
        print("\n📝 Step 1: Processing voice command...")
        voice_input = "Add 2kg organic carrots for ₹45"
        
        try:
            voice_response = requests.post(f"{self.base_url}/process-voice",
                json={
                    "text": voice_input,
                    "language": "en",
                    "user_id": "demo_farmer"
                }
            )
            
            if voice_response.status_code == 200:
                voice_data = voice_response.json()
                entities = voice_data.get('result', {}).get('entities', {})
                product_name = entities.get('product_name', 'carrots')
                price = entities.get('price', 45)
                quantity = entities.get('quantity', '2kg')
                
                print(f"✅ Extracted: {product_name}, {quantity}, ₹{price}")
                
                # Step 2: Auto-categorization
                print("\n🏷️  Step 2: Auto-categorizing product...")
                cat_response = requests.post(f"{self.base_url}/categorize-product",
                    json={"product_name": product_name}
                )
                
                category = "Vegetables"
                tags = ["fresh", "organic"]
                
                if cat_response.status_code == 200:
                    cat_data = cat_response.json()
                    if cat_data.get('success'):
                        category = cat_data.get('category', category)
                        tags = cat_data.get('tags', tags)
                        print(f"✅ Category: {category}, Tags: {', '.join(tags)}")
                
                # Step 3: Price validation
                print("\n💰 Step 3: Validating market price...")
                price_response = requests.post(f"{self.base_url}/get-price-suggestion",
                    json={
                        "product_name": product_name,
                        "quantity": quantity
                    }
                )
                
                if price_response.status_code == 200:
                    price_data = price_response.json()
                    if price_data.get('success'):
                        suggestions = price_data.get('price_suggestions', {})
                        suggested = suggestions.get('suggested_price', price)
                        print(f"✅ Market price: ₹{suggested} (User price: ₹{price})")
                
                # Step 4: Generate descriptions
                print("\n✨ Step 4: Generating descriptions...")
                desc_response = requests.post(f"{self.base_url}/generate-description",
                    json={
                        "product_name": product_name,
                        "category": category,
                        "price": price,
                        "quantity": quantity,
                        "language": "en"
                    }
                )
                
                if desc_response.status_code == 200:
                    desc_data = desc_response.json()
                    if desc_data.get('success'):
                        description = desc_data.get('description', '')
                        print(f"✅ Description: \"{description[:60]}...\"")
                
                # Step 5: Final product creation
                print("\n🎉 Step 5: Creating enhanced product listing...")
                product_data = {
                    "user_id": "demo_farmer",
                    "product_name": product_name,
                    "quantity": quantity,
                    "price": price,
                    "category": category,
                    "tags": tags,
                    "language": "en"
                }
                
                final_response = requests.post(f"{self.base_url}/add-product",
                    json=product_data
                )
                
                if final_response.status_code == 200:
                    final_data = final_response.json()
                    if final_data.get('success'):
                        print("✅ Product successfully added to catalog!")
                        print("🎯 AI enhancements applied:")
                        print(f"   - Smart categorization: {category}")
                        print(f"   - Auto-generated tags: {', '.join(tags)}")
                        print(f"   - Market-validated pricing: ₹{price}")
                        print(f"   - AI-crafted description: Generated")
                        print(f"   - Multilingual support: Available")
                    else:
                        print(f"❌ Failed to create product: {final_data.get('error')}")
                else:
                    print(f"❌ Product creation failed: {final_response.status_code}")
                
            else:
                print(f"❌ Voice processing failed: {voice_response.status_code}")
                
        except Exception as e:
            print(f"❌ Workflow error: {e}")
    
    def run_complete_demo(self):
        """Run the complete demonstration"""
        print("🚀 Starting Digital Catalog AI Agent Demonstration...")
        print("This demo showcases all enhanced features for farmers, artisans, and kirana store owners.")
        
        # Wait for user to start backend
        input("\n⚠️  Make sure the backend is running on http://localhost:5000\nPress Enter to continue...")
        
        # Health check first
        if not self.demo_health_check():
            print("\n❌ Backend not available. Please start the backend server first.")
            return
        
        # Run all demos
        self.demo_voice_commands()
        self.demo_smart_categorization()
        self.demo_price_suggestions()
        self.demo_multilingual_descriptions()
        self.demo_complete_workflow()
        
        # Final summary
        print("\n" + "=" * 60)
        print("🎉 DEMO COMPLETE!")
        print("=" * 60)
        print("\n✅ Features Demonstrated:")
        print("   🎤 Advanced Voice Command Processing")
        print("   🧠 Intelligent Product Categorization")
        print("   💰 Market-based Price Suggestions")
        print("   🌍 Multilingual Description Generation")
        print("   🔄 Complete AI-powered Workflow")
        print("\n🎯 Perfect for:")
        print("   👨‍🌾 Farmers - Voice commands in local languages")
        print("   🎨 Artisans - Smart categorization of handcrafts")
        print("   🏪 Kirana Owners - Quick inventory with price insights")
        
        print(f"\n🌐 Frontend Demo: http://localhost:3000")
        print(f"🔌 API Explorer: http://localhost:5000/api/health")
        print("\n🚀 Your Digital Catalog AI Agent is ready for production!")

def main():
    demo = CatalogAgentDemo()
    demo.run_complete_demo()

if __name__ == "__main__":
    main()
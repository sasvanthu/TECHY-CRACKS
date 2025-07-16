#!/usr/bin/env python3
"""
Test script for Digital Catalog AI Agent
Validates all core functionalities including NLP, categorization, and price suggestions
"""

import requests
import json
import time
from typing import Dict, List

# Configuration
API_BASE_URL = "http://localhost:5000/api"
TEST_USER_ID = "test_user_123"

class CatalogAgentTester:
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.session = requests.Session()
        self.test_results = []
    
    def log_test(self, test_name: str, passed: bool, details: str = ""):
        """Log test results"""
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status} - {test_name}")
        if details:
            print(f"    Details: {details}")
        
        self.test_results.append({
            'test': test_name,
            'passed': passed,
            'details': details
        })
    
    def test_health_check(self):
        """Test API health endpoint"""
        try:
            response = self.session.get(f"{self.base_url}/health")
            if response.status_code == 200:
                data = response.json()
                self.log_test("Health Check", True, f"Status: {data.get('status')}, AI Available: {data.get('ai_available')}")
                return True
            else:
                self.log_test("Health Check", False, f"Status code: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Health Check", False, f"Connection error: {str(e)}")
            return False
    
    def test_voice_processing(self):
        """Test voice command processing"""
        test_commands = [
            {
                "text": "Add 1kg tomatoes for ₹30",
                "language": "en",
                "expected_intent": "add_product"
            },
            {
                "text": "What is the price of onions?",
                "language": "en", 
                "expected_intent": "price_inquiry"
            },
            {
                "text": "1 किलो आलू 25 रुपये में जोड़ें",
                "language": "hi",
                "expected_intent": "add_product"
            }
        ]
        
        for i, command in enumerate(test_commands):
            try:
                response = self.session.post(f"{self.base_url}/process-voice", 
                    json={
                        "text": command["text"],
                        "language": command["language"],
                        "user_id": TEST_USER_ID
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    intent_correct = data.get('result', {}).get('intent') == command["expected_intent"]
                    self.log_test(f"Voice Processing {i+1}", intent_correct, 
                                f"Command: '{command['text']}', Intent: {data.get('result', {}).get('intent')}")
                else:
                    self.log_test(f"Voice Processing {i+1}", False, 
                                f"Status code: {response.status_code}")
            except Exception as e:
                self.log_test(f"Voice Processing {i+1}", False, f"Error: {str(e)}")
    
    def test_product_categorization(self):
        """Test product categorization"""
        test_products = [
            {"name": "tomatoes", "expected_category": "Vegetables"},
            {"name": "basmati rice", "expected_category": "Grains & Cereals"},
            {"name": "handwoven saree", "expected_category": "Clothing & Textiles"},
            {"name": "fresh milk", "expected_category": "Dairy Products"}
        ]
        
        for product in test_products:
            try:
                response = self.session.post(f"{self.base_url}/categorize-product",
                    json={"product_name": product["name"]}
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get('success'):
                        category = data.get('category', '')
                        tags = data.get('tags', [])
                        confidence = data.get('confidence', 0)
                        
                        # Check if category is reasonable (not just "General")
                        category_ok = category != "General" or product["name"] in ["unknown_product"]
                        
                        self.log_test(f"Categorization: {product['name']}", category_ok,
                                    f"Category: {category}, Tags: {tags}, Confidence: {confidence:.2f}")
                    else:
                        self.log_test(f"Categorization: {product['name']}", False, 
                                    f"API returned error: {data.get('error')}")
                else:
                    self.log_test(f"Categorization: {product['name']}", False,
                                f"Status code: {response.status_code}")
            except Exception as e:
                self.log_test(f"Categorization: {product['name']}", False, f"Error: {str(e)}")
    
    def test_price_suggestions(self):
        """Test price suggestion engine"""
        test_products = [
            {"name": "tomatoes", "quantity": "1kg"},
            {"name": "rice", "quantity": "5kg"},
            {"name": "onions", "quantity": "2kg"},
            {"name": "potato", "quantity": "1kg"}
        ]
        
        for product in test_products:
            try:
                response = self.session.post(f"{self.base_url}/get-price-suggestion",
                    json={
                        "product_name": product["name"],
                        "quantity": product["quantity"]
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get('success'):
                        suggestions = data.get('price_suggestions', {})
                        min_price = suggestions.get('min_price', 0)
                        max_price = suggestions.get('max_price', 0)
                        suggested_price = suggestions.get('suggested_price', 0)
                        confidence = suggestions.get('confidence', 0)
                        
                        # Basic validation
                        prices_valid = min_price <= suggested_price <= max_price and min_price > 0
                        
                        self.log_test(f"Price Suggestion: {product['name']}", prices_valid,
                                    f"Range: ₹{min_price}-₹{max_price}, Suggested: ₹{suggested_price}, Confidence: {confidence:.2f}")
                    else:
                        self.log_test(f"Price Suggestion: {product['name']}", False,
                                    f"API returned error: {data.get('error')}")
                else:
                    self.log_test(f"Price Suggestion: {product['name']}", False,
                                f"Status code: {response.status_code}")
            except Exception as e:
                self.log_test(f"Price Suggestion: {product['name']}", False, f"Error: {str(e)}")
    
    def test_description_generation(self):
        """Test multilingual description generation"""
        test_cases = [
            {
                "product_name": "tomatoes",
                "category": "Vegetables",
                "price": 30,
                "quantity": "1kg",
                "language": "en"
            },
            {
                "product_name": "tomatoes",
                "category": "Vegetables", 
                "price": 30,
                "quantity": "1kg",
                "language": "hi"
            },
            {
                "product_name": "basmati rice",
                "category": "Grains & Cereals",
                "price": 80,
                "quantity": "1kg",
                "language": "ta"
            }
        ]
        
        for case in test_cases:
            try:
                response = self.session.post(f"{self.base_url}/generate-description",
                    json=case
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get('success'):
                        description = data.get('description', '')
                        # Check if description is reasonable (not empty, contains product name or price)
                        desc_valid = len(description) > 20 and (
                            case['product_name'].lower() in description.lower() or
                            str(case['price']) in description
                        )
                        
                        self.log_test(f"Description ({case['language']}): {case['product_name']}", 
                                    desc_valid, f"Generated: {description[:60]}...")
                    else:
                        self.log_test(f"Description ({case['language']}): {case['product_name']}", 
                                    False, f"API returned error: {data.get('error')}")
                else:
                    self.log_test(f"Description ({case['language']}): {case['product_name']}", 
                                False, f"Status code: {response.status_code}")
            except Exception as e:
                self.log_test(f"Description ({case['language']}): {case['product_name']}", 
                            False, f"Error: {str(e)}")
    
    def test_product_addition(self):
        """Test adding products through API"""
        test_product = {
            "user_id": TEST_USER_ID,
            "product_name": "test_tomatoes",
            "quantity": "1kg",
            "price": 35,
            "language": "en"
        }
        
        try:
            response = self.session.post(f"{self.base_url}/add-product", json=test_product)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    product = data.get('product', {})
                    product_id = data.get('product_id')
                    
                    # Validate product data
                    data_valid = (
                        product.get('name') == test_product['product_name'] and
                        product.get('price') == test_product['price'] and
                        product_id is not None
                    )
                    
                    self.log_test("Product Addition", data_valid,
                                f"Product ID: {product_id}, Category: {product.get('category')}")
                else:
                    self.log_test("Product Addition", False, f"API error: {data.get('error')}")
            else:
                self.log_test("Product Addition", False, f"Status code: {response.status_code}")
        except Exception as e:
            self.log_test("Product Addition", False, f"Error: {str(e)}")
    
    def test_categories_endpoint(self):
        """Test categories endpoint"""
        try:
            response = self.session.get(f"{self.base_url}/get-categories")
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    categories = data.get('categories', [])
                    categories_valid = len(categories) > 5  # Should have at least some default categories
                    
                    self.log_test("Get Categories", categories_valid, 
                                f"Found {len(categories)} categories")
                else:
                    self.log_test("Get Categories", False, f"API error: {data.get('error')}")
            else:
                self.log_test("Get Categories", False, f"Status code: {response.status_code}")
        except Exception as e:
            self.log_test("Get Categories", False, f"Error: {str(e)}")
    
    def run_all_tests(self):
        """Run all test suites"""
        print("🧪 Digital Catalog AI Agent - Comprehensive Testing")
        print("=" * 60)
        
        # Basic connectivity
        if not self.test_health_check():
            print("\n❌ Cannot connect to backend. Make sure it's running on http://localhost:5000")
            return
        
        print("\n🔍 Testing Core Functionalities...")
        print("-" * 40)
        
        # Core functionality tests
        self.test_voice_processing()
        self.test_product_categorization() 
        self.test_price_suggestions()
        self.test_description_generation()
        self.test_product_addition()
        self.test_categories_endpoint()
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result['passed'])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print(f"\n❌ Failed Tests:")
            for result in self.test_results:
                if not result['passed']:
                    print(f"  - {result['test']}: {result['details']}")
        
        print(f"\n{'🎉 ALL TESTS PASSED!' if failed_tests == 0 else '⚠️  Some tests failed. Check the backend logs.'}")
        return failed_tests == 0

def main():
    """Main testing function"""
    print("Starting Digital Catalog AI Agent Tests...")
    
    # Wait a moment for user to start backend if needed
    print("Make sure the backend is running on http://localhost:5000")
    input("Press Enter to continue with testing...")
    
    tester = CatalogAgentTester(API_BASE_URL)
    success = tester.run_all_tests()
    
    if success:
        print("\n🚀 Your Digital Catalog AI Agent is working perfectly!")
    else:
        print("\n🔧 Some issues found. Please check the backend implementation.")
    
    return 0 if success else 1

if __name__ == "__main__":
    exit(main())
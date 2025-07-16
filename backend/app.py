"""
Digital Catalog AI Agent Backend
Enhanced with advanced NLP, categorization, and multilingual capabilities
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
import re
from datetime import datetime, timedelta
import logging
from typing import Dict, List, Any, Optional, Tuple
import requests
# Google Generative AI will be conditionally imported
try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    logger.warning("Google Generative AI not available")
from dataclasses import dataclass
import sqlite3
import threading
from functools import lru_cache

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Configuration
class Config:
    GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', '')
    RAPIDAPI_KEY = os.getenv('RAPIDAPI_KEY', '')  # For price data
    DATABASE_PATH = 'catalog_agent.db'
    SUPPORTED_LANGUAGES = {
        'en': 'English',
        'hi': 'Hindi',
        'ta': 'Tamil',
        'te': 'Telugu',
        'kn': 'Kannada',
        'ml': 'Malayalam',
        'gu': 'Gujarati',
        'mr': 'Marathi',
        'bn': 'Bengali',
        'or': 'Odia',
        'pa': 'Punjabi'
    }

@dataclass
class ProductData:
    name: str
    quantity: str
    price: float
    description: str
    category: str
    tags: List[str]
    language: str
    suggested_price_range: Dict[str, float]
    confidence_score: float

class DatabaseManager:
    """Manages SQLite database operations"""
    
    def __init__(self, db_path: str):
        self.db_path = db_path
        self.init_database()
    
    def init_database(self):
        """Initialize database tables"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Products table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                name TEXT NOT NULL,
                quantity TEXT,
                price REAL,
                description TEXT,
                category TEXT,
                tags TEXT, -- JSON array
                language TEXT,
                suggested_price_min REAL,
                suggested_price_max REAL,
                confidence_score REAL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Categories table for better organization
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                parent_category TEXT,
                keywords TEXT, -- JSON array
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Price history for market analysis
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS price_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                product_name TEXT NOT NULL,
                category TEXT,
                price REAL,
                location TEXT,
                source TEXT,
                recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        conn.commit()
        conn.close()
        
        # Initialize default categories
        self._initialize_default_categories()
    
    def _initialize_default_categories(self):
        """Initialize default product categories"""
        default_categories = [
            ('Vegetables', None, ['tomato', 'onion', 'potato', 'carrot', 'cabbage', 'beans', 'peas']),
            ('Fruits', None, ['apple', 'banana', 'orange', 'mango', 'grapes', 'pomegranate']),
            ('Grains & Cereals', None, ['rice', 'wheat', 'corn', 'barley', 'millet', 'quinoa']),
            ('Dairy Products', None, ['milk', 'cheese', 'butter', 'yogurt', 'cream', 'ghee']),
            ('Spices & Herbs', None, ['turmeric', 'chili', 'coriander', 'cumin', 'garam masala']),
            ('Handicrafts', None, ['pottery', 'textiles', 'jewelry', 'woodwork', 'metalwork']),
            ('Clothing & Textiles', None, ['saree', 'kurta', 'dupatta', 'shawl', 'fabric']),
            ('Household Items', None, ['soap', 'oil', 'detergent', 'cleaning supplies']),
            ('Snacks & Beverages', None, ['biscuits', 'namkeen', 'tea', 'coffee', 'juice']),
            ('Personal Care', None, ['shampoo', 'toothpaste', 'face cream', 'hair oil'])
        ]
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        for category, parent, keywords in default_categories:
            try:
                cursor.execute(
                    'INSERT OR IGNORE INTO categories (name, parent_category, keywords) VALUES (?, ?, ?)',
                    (category, parent, json.dumps(keywords))
                )
            except sqlite3.IntegrityError:
                pass  # Category already exists
        
        conn.commit()
        conn.close()

class AdvancedNLPProcessor:
    """Enhanced NLP processor for voice commands and text analysis"""
    
    def __init__(self, gemini_api_key: str):
        self.api_key = gemini_api_key
        self.model = None
        
        if gemini_api_key:
            try:
                # Test the API key with direct HTTP call
                test_url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"
                test_headers = {
                    "Content-Type": "application/json",
                    "x-goog-api-key": gemini_api_key
                }
                test_data = {
                    "contents": [{"parts": [{"text": "Hello"}]}]
                }
                
                response = requests.post(test_url, headers=test_headers, json=test_data, timeout=10)
                if response.status_code == 200:
                    self.use_api = True
                    logger.info("✅ Gemini API key verified successfully!")
                else:
                    logger.warning(f"❌ Gemini API key verification failed: {response.status_code}")
                    self.use_api = False
            except Exception as e:
                logger.warning(f"❌ Gemini API key verification failed: {e}")
                self.use_api = False
        else:
            logger.warning("Gemini API key not provided. AI features will be limited.")
            self.use_api = False
    
    def _call_gemini_api(self, prompt: str, temperature: float = 0.7) -> str:
        """Call Gemini API using HTTP requests"""
        if not self.use_api:
            return None
            
        try:
            url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"
            headers = {
                "Content-Type": "application/json",
                "x-goog-api-key": self.api_key
            }
            
            data = {
                "contents": [
                    {
                        "parts": [
                            {
                                "text": prompt
                            }
                        ]
                    }
                ],
                "generationConfig": {
                    "temperature": temperature,
                    "topK": 1,
                    "topP": 1,
                    "maxOutputTokens": 2048,
                    "stopSequences": []
                }
            }
            
            response = requests.post(url, headers=headers, json=data, timeout=30)
            
            if response.status_code == 200:
                result = response.json()
                return result['candidates'][0]['content']['parts'][0]['text']
            else:
                logger.error(f"Gemini API error: {response.status_code} - {response.text}")
                return None
                
        except Exception as e:
            logger.error(f"Error calling Gemini API: {e}")
            return None
    
    def process_voice_command(self, text: str, language: str = 'en') -> Dict[str, Any]:
        """Process voice command with enhanced NLP"""
        try:
            # Normalize and clean text
            cleaned_text = self._clean_text(text)
            
            # Detect intent and extract entities
            intent = self._detect_intent(cleaned_text)
            entities = self._extract_entities(cleaned_text, language)
            
            return {
                'intent': intent,
                'entities': entities,
                'original_text': text,
                'cleaned_text': cleaned_text,
                'language': language,
                'confidence': entities.get('confidence', 0.8)
            }
        except Exception as e:
            logger.error(f"Error processing voice command: {e}")
            return {'error': str(e)}
    
    def _clean_text(self, text: str) -> str:
        """Clean and normalize text"""
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text.strip())
        
        # Handle common speech-to-text errors
        replacements = {
            'rupees': '₹',
            'rupee': '₹',
            'rs': '₹',
            'kilo': 'kg',
            'kilogram': 'kg',
            'gram': 'g',
            'liter': 'l',
            'litre': 'l',
            'piece': 'pc',
            'pieces': 'pcs'
        }
        
        for old, new in replacements.items():
            text = re.sub(rf'\b{old}\b', new, text, flags=re.IGNORECASE)
        
        return text
    
    def _detect_intent(self, text: str) -> str:
        """Detect user intent from text"""
        text_lower = text.lower()
        
        if any(word in text_lower for word in ['add', 'create', 'new', 'insert']):
            return 'add_product'
        elif any(word in text_lower for word in ['update', 'edit', 'modify', 'change']):
            return 'update_product'
        elif any(word in text_lower for word in ['delete', 'remove', 'cancel']):
            return 'delete_product'
        elif any(word in text_lower for word in ['search', 'find', 'show', 'list']):
            return 'search_product'
        elif any(word in text_lower for word in ['price', 'cost', 'rate', 'market']):
            return 'price_inquiry'
        elif any(word in text_lower for word in ['category', 'type', 'classify']):
            return 'categorize'
        else:
            return 'add_product'  # Default intent
    
    def _extract_entities(self, text: str, language: str) -> Dict[str, Any]:
        """Extract product entities from text using AI"""
        if not self.use_api:
            return self._fallback_entity_extraction(text)
        
        try:
            prompt = f"""
            Extract product information from this text: "{text}"
            
            Return a JSON object with these fields:
            - product_name: string (product name)
            - quantity: string (amount/quantity with unit)
            - price: number (price in rupees, extract number only)
            - confidence: number (confidence score 0-1)
            
            If any information is missing, set to null.
            Example: {{"product_name": "tomatoes", "quantity": "1kg", "price": 50, "confidence": 0.9}}
            """
            
            if self.use_api:
                response = self._call_gemini_api(prompt)
                if response:
                    result = json.loads(response.strip())
                    return result
                else:
                    return self._fallback_entity_extraction(text)
            else:
                return self._fallback_entity_extraction(text)
        except Exception as e:
            logger.error(f"AI entity extraction failed: {e}")
            return self._fallback_entity_extraction(text)
    
    def _call_gemini_api_old(self, prompt: str, parse_json: bool = False) -> Any:
        """Call Gemini API directly - OLD METHOD"""
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={self.api_key}"
            
            payload = {
                "contents": [{
                    "parts": [{"text": prompt}]
                }]
            }
            
            response = requests.post(url, json=payload, headers={'Content-Type': 'application/json'})
            
            if response.status_code == 200:
                result = response.json()
                if result.get('candidates') and result['candidates'][0].get('content'):
                    text = result['candidates'][0]['content']['parts'][0]['text']
                    if parse_json:
                        try:
                            return json.loads(text.strip())
                        except json.JSONDecodeError:
                            logger.error(f"Failed to parse JSON: {text}")
                            return None
                    return text
            else:
                logger.error(f"Gemini API error: {response.status_code} - {response.text}")
                return None
        except Exception as e:
            logger.error(f"Error calling Gemini API: {e}")
            return None
    
    def _fallback_entity_extraction(self, text: str) -> Dict[str, Any]:
        """Fallback entity extraction using regex patterns"""
        entities = {
            'product_name': None,
            'quantity': None,
            'price': None,
            'confidence': 0.6
        }
        
        # Extract price
        price_patterns = [
            r'₹\s*(\d+(?:\.\d{2})?)',
            r'(\d+(?:\.\d{2})?)\s*rupees?',
            r'rs\s*(\d+(?:\.\d{2})?)',
            r'(\d+(?:\.\d{2})?)\s*rs'
        ]
        
        for pattern in price_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                entities['price'] = float(match.group(1))
                break
        
        # Extract quantity
        quantity_patterns = [
            r'(\d+(?:\.\d+)?\s*(?:kg|g|l|ml|pc|pcs|dozen|box|packet))',
            r'(\d+(?:\.\d+)?)\s*(?:kilo|kilogram|gram|liter|litre|piece|pieces)'
        ]
        
        for pattern in quantity_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                entities['quantity'] = match.group(1).strip()
                break
        
        # Extract product name (everything else, cleaned)
        text_copy = text
        if entities['price']:
            text_copy = re.sub(r'₹\s*\d+(?:\.\d{2})?|\d+(?:\.\d{2})?\s*(?:rupees?|rs)', '', text_copy, flags=re.IGNORECASE)
        if entities['quantity']:
            text_copy = re.sub(entities['quantity'], '', text_copy, flags=re.IGNORECASE)
        
        # Remove common command words
        command_words = ['add', 'create', 'new', 'insert', 'update', 'edit']
        for word in command_words:
            text_copy = re.sub(rf'\b{word}\b', '', text_copy, flags=re.IGNORECASE)
        
        product_name = text_copy.strip()
        if product_name:
            entities['product_name'] = product_name
        
        return entities

class ProductCategorizer:
    """Intelligent product categorization system"""
    
    def __init__(self, db_manager: DatabaseManager, nlp_processor: AdvancedNLPProcessor):
        self.db = db_manager
        self.nlp = nlp_processor
        self.category_cache = {}
        self._load_categories()
    
    def _load_categories(self):
        """Load categories from database"""
        conn = sqlite3.connect(self.db.db_path)
        cursor = conn.cursor()
        cursor.execute('SELECT name, keywords FROM categories')
        
        for name, keywords_json in cursor.fetchall():
            try:
                keywords = json.loads(keywords_json) if keywords_json else []
                self.category_cache[name] = keywords
            except json.JSONDecodeError:
                self.category_cache[name] = []
        
        conn.close()
    
    def categorize_product(self, product_name: str) -> Tuple[str, List[str], float]:
        """Categorize product and generate tags"""
        product_lower = product_name.lower()
        
        # Rule-based categorization
        best_category = 'General'
        best_score = 0.0
        
        for category, keywords in self.category_cache.items():
            score = 0
            for keyword in keywords:
                if keyword.lower() in product_lower:
                    score += 1
            
            if keywords:  # Avoid division by zero
                normalized_score = score / len(keywords)
                if normalized_score > best_score:
                    best_score = normalized_score
                    best_category = category
        
        # Generate tags using AI if available
        tags = self._generate_tags(product_name, best_category)
        
        return best_category, tags, min(best_score + 0.3, 1.0)
    
    def _generate_tags(self, product_name: str, category: str) -> List[str]:
        """Generate relevant tags for the product"""
        if not self.nlp.model and not self.nlp.use_api:
            return self._fallback_tags(product_name, category)
        
        try:
            prompt = f"""
            Generate 3-5 relevant tags for the product "{product_name}" in category "{category}".
            Tags should be useful for search and organization.
            Return as a JSON array of strings.
            Example: ["fresh", "organic", "local", "seasonal"]
            """
            
            if self.nlp.use_api:
                response = self.nlp._call_gemini_api(prompt)
                if response:
                    try:
                        tags = json.loads(response.strip())
                        return tags[:5]
                    except json.JSONDecodeError:
                        return self._fallback_tags(product_name, category)
                else:
                    return self._fallback_tags(product_name, category)
            else:
                return self._fallback_tags(product_name, category)
        except Exception as e:
            logger.error(f"AI tag generation failed: {e}")
            return self._fallback_tags(product_name, category)
    
    def _fallback_tags(self, product_name: str, category: str) -> List[str]:
        """Fallback tag generation"""
        tags = []
        
        # Add category-based tags
        if category == 'Vegetables':
            tags.extend(['fresh', 'healthy', 'local'])
        elif category == 'Fruits':
            tags.extend(['fresh', 'sweet', 'nutritious'])
        elif category == 'Handicrafts':
            tags.extend(['handmade', 'traditional', 'unique'])
        elif category == 'Dairy Products':
            tags.extend(['fresh', 'nutritious', 'daily'])
        
        # Add product-specific tags
        product_lower = product_name.lower()
        if 'organic' in product_lower:
            tags.append('organic')
        if any(word in product_lower for word in ['premium', 'quality', 'best']):
            tags.append('premium')
        
        return list(set(tags))  # Remove duplicates

class PriceSuggestionEngine:
    """Market-based price suggestion system"""
    
    def __init__(self, db_manager: DatabaseManager):
        self.db = db_manager
        self.price_cache = {}
        self.cache_expiry = {}
    
    @lru_cache(maxsize=100)
    def suggest_price(self, product_name: str, category: str, quantity: str = "1kg") -> Dict[str, float]:
        """Suggest price range based on market data and historical prices"""
        
        # Check cache first
        cache_key = f"{product_name}_{category}_{quantity}"
        if cache_key in self.price_cache:
            if datetime.now() < self.cache_expiry.get(cache_key, datetime.now()):
                return self.price_cache[cache_key]
        
        # Get historical prices from database
        historical_prices = self._get_historical_prices(product_name, category)
        
        # Get market data (if API available)
        market_prices = self._get_market_prices(product_name, category)
        
        # Calculate suggested price range
        price_range = self._calculate_price_range(historical_prices, market_prices, quantity)
        
        # Cache the result for 1 hour
        self.price_cache[cache_key] = price_range
        self.cache_expiry[cache_key] = datetime.now() + timedelta(hours=1)
        
        return price_range
    
    def _get_historical_prices(self, product_name: str, category: str) -> List[float]:
        """Get historical prices from database"""
        conn = sqlite3.connect(self.db.db_path)
        cursor = conn.cursor()
        
        # Get prices from last 30 days
        thirty_days_ago = datetime.now() - timedelta(days=30)
        cursor.execute('''
            SELECT price FROM price_history 
            WHERE (product_name LIKE ? OR category = ?) 
            AND recorded_at > ?
            ORDER BY recorded_at DESC
        ''', (f'%{product_name}%', category, thirty_days_ago))
        
        prices = [row[0] for row in cursor.fetchall()]
        conn.close()
        
        return prices
    
    def _get_market_prices(self, product_name: str, category: str) -> List[float]:
        """Get current market prices from external APIs"""
        try:
            # This is a placeholder for actual market API integration
            # You would replace this with real market data APIs
            
            # For demonstration, using mock data based on product type
            mock_prices = {
                'tomato': [30, 35, 40],
                'onion': [25, 30, 35],
                'potato': [20, 25, 30],
                'rice': [40, 50, 60],
                'wheat': [25, 30, 35],
                'milk': [50, 55, 60]
            }
            
            product_lower = product_name.lower()
            for product, prices in mock_prices.items():
                if product in product_lower:
                    return prices
            
            return []
        except Exception as e:
            logger.error(f"Failed to get market prices: {e}")
            return []
    
    def _calculate_price_range(self, historical_prices: List[float], market_prices: List[float], quantity: str) -> Dict[str, float]:
        """Calculate suggested price range"""
        all_prices = historical_prices + market_prices
        
        if not all_prices:
            # Default fallback prices based on quantity
            base_price = self._get_base_price_by_quantity(quantity)
            return {
                'min_price': base_price * 0.8,
                'max_price': base_price * 1.2,
                'suggested_price': base_price,
                'confidence': 0.3
            }
        
        # Calculate statistics
        min_price = min(all_prices)
        max_price = max(all_prices)
        avg_price = sum(all_prices) / len(all_prices)
        
        # Adjust for quantity
        quantity_multiplier = self._get_quantity_multiplier(quantity)
        
        return {
            'min_price': round(min_price * quantity_multiplier, 2),
            'max_price': round(max_price * quantity_multiplier, 2),
            'suggested_price': round(avg_price * quantity_multiplier, 2),
            'confidence': min(0.9, len(all_prices) / 10)  # Higher confidence with more data
        }
    
    def _get_base_price_by_quantity(self, quantity: str) -> float:
        """Get base price estimation by quantity"""
        quantity_lower = quantity.lower()
        
        if 'kg' in quantity_lower:
            return 30.0  # Base price per kg
        elif 'g' in quantity_lower:
            return 5.0   # Base price per 100g
        elif 'l' in quantity_lower:
            return 25.0  # Base price per liter
        elif any(unit in quantity_lower for unit in ['pc', 'piece']):
            return 10.0  # Base price per piece
        else:
            return 20.0  # Default base price
    
    def _get_quantity_multiplier(self, quantity: str) -> float:
        """Calculate price multiplier based on quantity"""
        import re
        
        # Extract numeric value from quantity
        match = re.search(r'(\d+(?:\.\d+)?)', quantity)
        if not match:
            return 1.0
        
        numeric_value = float(match.group(1))
        
        if 'kg' in quantity.lower():
            return numeric_value
        elif 'g' in quantity.lower():
            return numeric_value / 1000  # Convert grams to kg equivalent
        elif 'l' in quantity.lower():
            return numeric_value
        elif any(unit in quantity.lower() for unit in ['pc', 'piece']):
            return numeric_value * 0.1  # Assuming 1 piece = 0.1 kg equivalent
        else:
            return numeric_value

class MultilingualDescriptionGenerator:
    """Generate product descriptions in multiple Indian languages"""
    
    def __init__(self, nlp_processor: AdvancedNLPProcessor):
        self.nlp = nlp_processor
        self.template_cache = {}
    
    def generate_description(self, product_name: str, category: str, price: float, 
                          quantity: str, language: str = 'en') -> str:
        """Generate appealing product description"""
        
        if not self.nlp.model and not self.nlp.use_api:
            return self._fallback_description(product_name, category, price, quantity, language)
        
        try:
            prompt = f"""
            Create an appealing product description for a {category.lower()} product called "{product_name}".
            Price: ₹{price} for {quantity}
            Language: {Config.SUPPORTED_LANGUAGES.get(language, 'English')}
            
            Make it:
            1. Attractive to customers
            2. Highlighting quality and freshness
            3. Suitable for small sellers (farmers/artisans/kirana stores)
            4. 2-3 sentences maximum
            5. Include emotional appeal
            
            Write in {Config.SUPPORTED_LANGUAGES.get(language, 'English')} language.
            """
            
            if self.nlp.model:
                response = self.nlp.model.generate_content(prompt)
                description = response.text.strip()
            elif self.nlp.use_api:
                description = self.nlp._call_gemini_api(prompt)
                if not description:
                    return self._fallback_description(product_name, category, price, quantity, language)
            else:
                return self._fallback_description(product_name, category, price, quantity, language)
            
            # Clean up the description
            description = re.sub(r'^"', '', description)
            description = re.sub(r'"$', '', description)
            
            return description
        except Exception as e:
            logger.error(f"AI description generation failed: {e}")
            return self._fallback_description(product_name, category, price, quantity, language)
    
    def _fallback_description(self, product_name: str, category: str, price: float, 
                            quantity: str, language: str) -> str:
        """Fallback description templates"""
        
        templates = {
            'en': {
                'Vegetables': f"Fresh and crisp {product_name}, straight from the farm! Perfect for your daily cooking needs. Get {quantity} for just ₹{price}.",
                'Fruits': f"Sweet and juicy {product_name}, handpicked for the best quality! Rich in vitamins and perfect for the whole family. {quantity} for ₹{price}.",
                'Handicrafts': f"Beautiful handcrafted {product_name}, made with traditional techniques and love! A perfect addition to your home. Available for ₹{price}.",
                'default': f"Premium quality {product_name} at an affordable price! Get {quantity} for just ₹{price}. Fresh, genuine, and value for money!"
            },
            'hi': {
                'Vegetables': f"ताज़ी और कुरकुरी {product_name}, सीधे खेत से! आपकी रोज़ाना खाना पकाने की ज़रूरतों के लिए बिल्कुल सही। सिर्फ ₹{price} में {quantity} पाएं।",
                'Fruits': f"मीठे और रसीले {product_name}, सबसे अच्छी गुणवत्ता के लिए हाथ से चुने गए! विटामिन से भरपूर और पूरे परिवार के लिए सही। ₹{price} में {quantity}।",
                'Handicrafts': f"सुंदर हस्तनिर्मित {product_name}, पारंपरिक तकनीकों और प्रेम से बनाया गया! आपके घर के लिए एक बेहतरीन जोड़। ₹{price} में उपलब्ध।",
                'default': f"प्रीमियम गुणवत्ता {product_name} किफायती कीमत पर! सिर्फ ₹{price} में {quantity} पाएं। ताज़ा, असली, और पैसे की कीमत!"
            },
            'ta': {
                'Vegetables': f"புதிய மற்றும் மிருதுவான {product_name}, நேரடியாக பண்ணையிலிருந்து! உங்கள் தினசரி சமையல் தேவைகளுக்கு சரியானது। வெறும் ₹{price} க்கு {quantity} பெறுங்கள்.",
                'Fruits': f"இனிப்பு மற்றும் சுவையான {product_name}, சிறந்த தரத்திற்காக கையால் தேர்ந்தெடுக்கப்பட்டது! வைட்டமின்கள் நிறைந்தது மற்றும் முழு குடும்பத்திற்கும் சரியானது। ₹{price} க்கு {quantity}.",
                'Handicrafts': f"அழகான கைவினைப்பொருள் {product_name}, பாரம்பரிய நுட்பங்கள் மற்றும் அன்புடன் செய்யப்பட்டது! உங்கள் வீட்டிற்கு ஒரு சிறந்த சேர்க்கை। ₹{price} க்கு கிடைக்கிறது.",
                'default': f"மிக உயர்ந்த தரம் {product_name} மலிவான விலையில்! வெறும் ₹{price} க்கு {quantity} பெறுங்கள். புதிய, உண்மையான, மற்றும் பணத்திற்கு மதிப்பு!"
            }
        }
        
        lang_templates = templates.get(language, templates['en'])
        template = lang_templates.get(category, lang_templates['default'])
        
        return template

# Initialize components
db_manager = DatabaseManager(Config.DATABASE_PATH)
nlp_processor = AdvancedNLPProcessor(Config.GEMINI_API_KEY)
categorizer = ProductCategorizer(db_manager, nlp_processor)
price_engine = PriceSuggestionEngine(db_manager)
description_generator = MultilingualDescriptionGenerator(nlp_processor)

# API Routes

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'ai_available': nlp_processor.model is not None
    })

@app.route('/api/process-voice', methods=['POST'])
def process_voice():
    """Process voice command with enhanced NLP"""
    try:
        data = request.get_json()
        text = data.get('text', '')
        language = data.get('language', 'en')
        user_id = data.get('user_id', 'anonymous')
        
        if not text:
            return jsonify({'error': 'No text provided'}), 400
        
        # Process with advanced NLP
        result = nlp_processor.process_voice_command(text, language)
        
        if 'error' in result:
            return jsonify(result), 500
        
        # Handle different intents
        if result['intent'] == 'add_product':
            product_result = add_product_from_nlp(result, user_id, language)
            return jsonify(product_result)
        elif result['intent'] == 'price_inquiry':
            price_result = get_price_suggestion_from_nlp(result)
            return jsonify(price_result)
        else:
            return jsonify({
                'message': 'Command processed successfully',
                'result': result
            })
    
    except Exception as e:
        logger.error(f"Error processing voice command: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/add-product', methods=['POST'])
def add_product():
    """Add product with AI enhancements"""
    try:
        data = request.get_json()
        user_id = data.get('user_id', 'anonymous')
        product_name = data.get('product_name', '')
        quantity = data.get('quantity', '1kg')
        price = float(data.get('price', 0))
        language = data.get('language', 'en')
        
        if not product_name:
            return jsonify({'error': 'Product name is required'}), 400
        
        # Auto-categorize and generate tags
        category, tags, cat_confidence = categorizer.categorize_product(product_name)
        
        # Get price suggestions
        price_suggestions = price_engine.suggest_price(product_name, category, quantity)
        
        # Generate description
        description = description_generator.generate_description(
            product_name, category, price, quantity, language
        )
        
        # Save to database
        conn = sqlite3.connect(db_manager.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO products (
                user_id, name, quantity, price, description, category, tags,
                language, suggested_price_min, suggested_price_max, confidence_score
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            user_id, product_name, quantity, price, description, category,
            json.dumps(tags), language, price_suggestions['min_price'],
            price_suggestions['max_price'], cat_confidence
        ))
        
        product_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        # Record price for historical data
        record_price_history(product_name, category, price)
        
        return jsonify({
            'success': True,
            'product_id': product_id,
            'product': {
                'name': product_name,
                'quantity': quantity,
                'price': price,
                'description': description,
                'category': category,
                'tags': tags,
                'price_suggestions': price_suggestions,
                'confidence_score': cat_confidence
            }
        })
    
    except Exception as e:
        logger.error(f"Error adding product: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/get-price-suggestion', methods=['POST'])
def get_price_suggestion():
    """Get price suggestions for a product"""
    try:
        data = request.get_json()
        product_name = data.get('product_name', '')
        category = data.get('category', 'General')
        quantity = data.get('quantity', '1kg')
        
        if not product_name:
            return jsonify({'error': 'Product name is required'}), 400
        
        # Auto-categorize if not provided
        if category == 'General':
            category, _, _ = categorizer.categorize_product(product_name)
        
        price_suggestions = price_engine.suggest_price(product_name, category, quantity)
        
        return jsonify({
            'success': True,
            'product_name': product_name,
            'category': category,
            'quantity': quantity,
            'price_suggestions': price_suggestions
        })
    
    except Exception as e:
        logger.error(f"Error getting price suggestion: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/categorize-product', methods=['POST'])
def categorize_product_endpoint():
    """Categorize a product and get tags"""
    try:
        data = request.get_json()
        product_name = data.get('product_name', '')
        
        if not product_name:
            return jsonify({'error': 'Product name is required'}), 400
        
        category, tags, confidence = categorizer.categorize_product(product_name)
        
        return jsonify({
            'success': True,
            'product_name': product_name,
            'category': category,
            'tags': tags,
            'confidence': confidence
        })
    
    except Exception as e:
        logger.error(f"Error categorizing product: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/generate-description', methods=['POST'])
def generate_description():
    """Generate product description in specified language"""
    try:
        data = request.get_json()
        product_name = data.get('product_name', '')
        category = data.get('category', 'General')
        price = float(data.get('price', 0))
        quantity = data.get('quantity', '1kg')
        language = data.get('language', 'en')
        
        if not product_name:
            return jsonify({'error': 'Product name is required'}), 400
        
        description = description_generator.generate_description(
            product_name, category, price, quantity, language
        )
        
        return jsonify({
            'success': True,
            'product_name': product_name,
            'description': description,
            'language': language
        })
    
    except Exception as e:
        logger.error(f"Error generating description: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/get-categories', methods=['GET'])
def get_categories():
    """Get all available categories"""
    try:
        conn = sqlite3.connect(db_manager.db_path)
        cursor = conn.cursor()
        cursor.execute('SELECT name, keywords FROM categories ORDER BY name')
        
        categories = []
        for name, keywords_json in cursor.fetchall():
            keywords = json.loads(keywords_json) if keywords_json else []
            categories.append({
                'name': name,
                'keywords': keywords
            })
        
        conn.close()
        
        return jsonify({
            'success': True,
            'categories': categories
        })
    
    except Exception as e:
        logger.error(f"Error getting categories: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/get-products/<user_id>', methods=['GET'])
def get_user_products(user_id):
    """Get all products for a user"""
    try:
        conn = sqlite3.connect(db_manager.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, name, quantity, price, description, category, tags,
                   language, suggested_price_min, suggested_price_max, confidence_score,
                   created_at, updated_at
            FROM products 
            WHERE user_id = ?
            ORDER BY created_at DESC
        ''', (user_id,))
        
        products = []
        for row in cursor.fetchall():
            products.append({
                'id': row[0],
                'name': row[1],
                'quantity': row[2],
                'price': row[3],
                'description': row[4],
                'category': row[5],
                'tags': json.loads(row[6]) if row[6] else [],
                'language': row[7],
                'suggested_price_min': row[8],
                'suggested_price_max': row[9],
                'confidence_score': row[10],
                'created_at': row[11],
                'updated_at': row[12]
            })
        
        conn.close()
        
        return jsonify({
            'success': True,
            'products': products
        })
    
    except Exception as e:
        logger.error(f"Error getting user products: {e}")
        return jsonify({'error': str(e)}), 500

# Helper functions

def add_product_from_nlp(nlp_result, user_id, language):
    """Add product from NLP processing result"""
    entities = nlp_result['entities']
    
    product_name = entities.get('product_name')
    quantity = entities.get('quantity', '1kg')
    price = entities.get('price', 0)
    
    if not product_name:
        return {'error': 'Could not extract product name from voice command'}
    
    # Auto-categorize and generate tags
    category, tags, cat_confidence = categorizer.categorize_product(product_name)
    
    # Get price suggestions if price not provided
    if not price:
        price_suggestions = price_engine.suggest_price(product_name, category, quantity)
        price = price_suggestions['suggested_price']
    else:
        price_suggestions = price_engine.suggest_price(product_name, category, quantity)
    
    # Generate description
    description = description_generator.generate_description(
        product_name, category, price, quantity, language
    )
    
    # Save to database
    try:
        conn = sqlite3.connect(db_manager.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO products (
                user_id, name, quantity, price, description, category, tags,
                language, suggested_price_min, suggested_price_max, confidence_score
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            user_id, product_name, quantity, price, description, category,
            json.dumps(tags), language, price_suggestions['min_price'],
            price_suggestions['max_price'], cat_confidence
        ))
        
        product_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        # Record price for historical data
        record_price_history(product_name, category, price)
        
        return {
            'success': True,
            'message': f'Product "{product_name}" added successfully!',
            'product_id': product_id,
            'product': {
                'name': product_name,
                'quantity': quantity,
                'price': price,
                'description': description,
                'category': category,
                'tags': tags,
                'price_suggestions': price_suggestions,
                'confidence_score': cat_confidence
            }
        }
    
    except Exception as e:
        logger.error(f"Error saving product from NLP: {e}")
        return {'error': f'Failed to save product: {str(e)}'}

def get_price_suggestion_from_nlp(nlp_result):
    """Get price suggestion from NLP result"""
    entities = nlp_result['entities']
    product_name = entities.get('product_name', '')
    
    if not product_name:
        return {'error': 'Could not extract product name for price inquiry'}
    
    # Auto-categorize
    category, _, _ = categorizer.categorize_product(product_name)
    quantity = entities.get('quantity', '1kg')
    
    price_suggestions = price_engine.suggest_price(product_name, category, quantity)
    
    return {
        'success': True,
        'message': f'Price suggestions for {product_name}',
        'product_name': product_name,
        'category': category,
        'quantity': quantity,
        'price_suggestions': price_suggestions
    }

def record_price_history(product_name: str, category: str, price: float, location: str = 'local', source: str = 'user_input'):
    """Record price in history for market analysis"""
    try:
        conn = sqlite3.connect(db_manager.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO price_history (product_name, category, price, location, source)
            VALUES (?, ?, ?, ?, ?)
        ''', (product_name, category, price, location, source))
        
        conn.commit()
        conn.close()
    except Exception as e:
        logger.error(f"Error recording price history: {e}")

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
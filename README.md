# 🛒 Digital Catalog Creation & Maintenance Agent

**Advanced AI-powered voice-enabled system** designed to help **farmers**, **artisans**, and **kirana store owners** effortlessly create and manage digital product catalogs with **enhanced NLP**, **automatic categorization**, **market-based pricing**, and **multilingual support**.

---

## 🌟 Enhanced Features

### 🧠 Advanced AI Capabilities
- **Smart NLP Processing**: Enhanced natural language understanding for voice commands
- **Auto-Categorization**: Intelligent product categorization with confidence scoring  
- **Price Suggestions**: Market-based price recommendations with historical analysis
- **Multilingual Descriptions**: AI-generated product descriptions in 11+ Indian languages
- **Intent Recognition**: Understands add, update, delete, search, and price inquiry commands

### 🎤 Voice Intelligence
- **Advanced Voice Commands**: Natural language processing for complex commands
- **Multi-language Support**: Voice input in Hindi, Tamil, Telugu, Kannada, and more
- **Context Awareness**: Maintains conversation context for better understanding
- **Speech-to-Text**: Real-time voice recognition with error correction

### 💰 Smart Pricing Engine
- **Market Analysis**: Real-time price suggestions based on market data
- **Historical Trends**: Price history tracking and analysis
- **Confidence Scoring**: Reliability indicators for price suggestions  
- **Dynamic Pricing**: Adjusts recommendations based on quantity and location

### 🏷️ Intelligent Categorization
- **Auto-Tagging**: Generates relevant tags for products
- **Category Confidence**: Shows categorization confidence levels
- **Custom Categories**: Supports custom category creation
- **Keyword Matching**: Advanced keyword-based categorization

### 🌍 Multilingual Support
- **11+ Indian Languages**: English, Hindi, Tamil, Telugu, Kannada, Malayalam, Gujarati, Marathi, Bengali, Odia, Punjabi
- **Voice Input**: Speech recognition in multiple languages
- **AI Descriptions**: Context-aware descriptions in native languages
- **Cultural Adaptation**: Culturally relevant product descriptions

---

## 🚀 Quick Start Guide

### Prerequisites
- **Python 3.8+** 
- **Node.js 14+**
- **Gemini AI API Key** (optional but recommended)

### 🔧 Installation Steps

1. **Clone & Navigate**
   ```bash
   git clone <repository-url>
   cd digital-catalog-agent
   ```

2. **Setup Backend**
   ```bash
   # Install Python dependencies
   cd backend
   pip install flask flask-cors requests google-generativeai
   
   # Create environment file
   cp .env.example .env
   # Edit .env with your Gemini API key
   ```

3. **Setup Frontend**
   ```bash
   cd TECHY-CRACKS
   npm install
   
   # Create environment file  
   cp .env.example .env
   # Edit .env with your Firebase config
   ```

4. **Start the Application**
   ```bash
   # Terminal 1: Backend
   python start_backend.py
   
   # Terminal 2: Frontend
   cd TECHY-CRACKS
   npm run dev
   ```

---

## 💻 Enhanced Tech Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Backend** | Python Flask | Advanced NLP, AI processing, API endpoints |
| **Frontend** | React + Vite | Modern UI with real-time updates |
| **Database** | SQLite + Firebase | Local processing + cloud sync |
| **AI Engine** | Google Gemini | NLP, categorization, descriptions |
| **Voice** | Web Speech API | Multi-language voice recognition |
| **Styling** | Tailwind CSS | Responsive, modern design |
| **State** | React Hooks | Real-time state management |

---

## 🎯 Usage Examples

### 🎤 Voice Commands (Natural Language)
```bash
# Adding Products
"Add 1kg tomatoes for ₹30"
"Create new product rice 5kg ₹250" 
"Insert potatoes 2kg price 50 rupees"
"1 किलो आलू 25 रुपये में जोड़ें" (Hindi)

# Price Inquiries  
"What is the price of onions?"
"Show me market rate for wheat"
"Price suggestion for apples 1kg"

# Product Search
"Find all vegetables in my catalog"
"Show me dairy products"
"List items under ₹50"
```

### 📝 Text Input
- Natural language text input with same intelligence as voice
- Automatic entity extraction (product, quantity, price)
- Smart categorization and tagging

### 🤖 AI Features in Action
```javascript
// Auto-categorization
Input: "basmati rice"
Output: Category: "Grains & Cereals", Tags: ["premium", "aromatic", "long-grain"], Confidence: 92%

// Price suggestions
Input: "tomatoes 1kg"  
Output: Min: ₹25, Max: ₹40, Suggested: ₹30, Confidence: 85%

// Multilingual descriptions
Input: Product="tomatoes", Language="hindi"
Output: "ताज़े और कुरकुरे टमाटर, सीधे खेत से! आपकी रोज़ाना खाना पकाने की ज़रूरतों के लिए बिल्कुल सही।"
```

---

## 🔌 API Documentation

### Core Endpoints

#### 🎤 Process Voice Commands
```http
POST /api/process-voice
Content-Type: application/json

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
    "description": "Fresh and crisp tomatoes, straight from the farm!"
  }
}
```

#### 💰 Get Price Suggestions
```http
POST /api/get-price-suggestion
Content-Type: application/json

{
  "product_name": "tomatoes",
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

---

## 🧪 Testing the System

### Automated Testing
```bash
# Test all backend features
cd backend
python test_agent.py
```

### Manual Testing  
1. **Start Backend**: `python start_backend.py`
2. **Health Check**: Visit `http://localhost:5000/api/health`
3. **Test Voice Processing**: Use the `/api/process-voice` endpoint
4. **Test Frontend**: Start React app and test voice commands

---

## 🌟 Key Benefits for Users

### 👨‍🌾 For Farmers
- **Voice Commands in Local Languages**: Add products speaking Hindi, Tamil, etc.
- **Market Price Insights**: Get current market rates for crops
- **Seasonal Categorization**: Auto-categorize seasonal vegetables and fruits
- **Quality Descriptions**: AI-generated descriptions highlighting freshness

### 🎨 For Artisans  
- **Craft Categorization**: Smart categorization of handmade items
- **Cultural Descriptions**: Culturally relevant product descriptions
- **Price Guidance**: Market-based pricing for handcrafted goods
- **Multi-language Reach**: Descriptions in multiple regional languages

### 🏪 For Kirana Store Owners
- **Quick Inventory**: Voice-based rapid product addition
- **Competitive Pricing**: Market analysis for better pricing
- **Customer Appeal**: Attractive product descriptions
- **Efficient Management**: Easy catalog organization and search

---

## 📱 Next Steps & Roadmap

### 🔮 Upcoming Features
- **Image Recognition**: Auto-detect products from photos
- **Voice-to-Voice**: Complete voice interaction without typing
- **Advanced Analytics**: Sales predictions and inventory optimization
- **Mobile App**: Dedicated mobile application
- **Marketplace Integration**: Connect with online marketplaces

### 🎯 Performance Improvements
- **Edge AI**: Local AI processing for faster responses
- **Caching**: Smart caching for frequent operations
- **Batch Processing**: Bulk product operations
- **Real-time Sync**: Instant updates across devices

---

**🚀 Ready to revolutionize your product catalog management with AI!**

Built with ❤️ for Indian small business owners


# 🛒 Digital Catalog Creation & Maintenance Agent

An AI-powered voice-enabled web application designed to help **farmers**, **artisans**, and **kirana store owners** effortlessly create and manage digital product catalogs using **text** or **real-time voice input**, with automatic **product description generation** and **offline support**.

---

## 🌟 Key Features

- 🎤 **Voice & Text Input**: Add products using speech in Indian languages (e.g., Tamil, Hindi, Telugu).
- 🧠 **AI-Powered Descriptions**: Generates smart product descriptions using OpenAI (GPT).
- 📷 **Image Upload**: Add product photos to enhance catalog listings.
- 🌐 **Multilingual Support**: Supports Indian languages for a localized experience.
- ☁️ **Cloud Sync**: Product data is saved to the cloud using Firebase.
- 🔌 **Offline Mode**: Works even without internet using PWA technology and Firestore persistence.
- 🧩 **Modular API Design**: Easy integration with other systems or UIs.

---

## 💻 Tech Stack

| Layer       | Technology Used                          |
|-------------|-------------------------------------------|
| Frontend    | HTML, CSS, JavaScript, React (or Vue)     |
| Backend     | Node.js + Firebase Functions OR Flask     |
| Database    | Firestore (with offline sync)             |
| AI Models   | OpenAI GPT-4 / ChatGPT                    |
| Voice Input | Google Speech-to-Text / AssemblyAI        |
| Image Upload| Firebase Storage / Cloudinary             |
| Hosting     | Firebase Hosting / Netlify                |

---

## 🛠️ Setup Instructions

```bash
# 1. Clone the repository
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name

# 2. Install frontend dependencies
npm install

# 3. Add your API keys in .env
touch .env
# Add:
# OPENAI_API_KEY=your_key_here
# GOOGLE_SPEECH_API_KEY=your_key_here
# FIREBASE_CONFIG={...}

# 4. Run the development server
npm start

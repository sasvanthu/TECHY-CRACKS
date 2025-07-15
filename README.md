Smart Catalog Assistant
A React-based web application that empowers small sellers to manage digital product catalogs with AI assistance, supporting multilingual voice and text input, product management, and AI-generated marketing content.
Features

Product Management: Add, edit, delete, and export products stored in Firebase Firestore.
Multilingual Support: Interface and voice input/output in English, Hindi, and Tamil.
AI Integration: Uses Gemini API for product description generation, slogan creation, category suggestions, and marketing campaign strategies.
Voice Interaction: Web Speech API for voice input and output.
Responsive Design: Built with Tailwind CSS for a modern, responsive UI.

Prerequisites

Node.js (v16 or higher)
A Firebase project with Firestore and Authentication enabled
A Google Cloud project with the Gemini API enabled
A modern browser supporting the Web Speech API (e.g., Chrome)

Setup Instructions

Clone the Repository
git clone https://github.com/your-username/smart-catalog-assistant.git
cd smart-catalog-assistant


Install DependenciesSince this example uses CDN-hosted libraries, no npm install is required for the frontend. However, ensure you have a local server to serve the files (e.g., http-server or live-server).
npm install -g http-server


Configure Environment VariablesCreate a .env file in the project root with the following variables:
REACT_APP_FIREBASE_CONFIG='{"apiKey": "your-api-key", "authDomain": "your-auth-domain", "projectId": "your-project-id", "storageBucket": "your-storage-bucket", "messagingSenderId": "your-sender-id", "appId": "your-app-id"}'
REACT_APP_GEMINI_API_KEY='your-gemini-api-key'
REACT_APP_INITIAL_AUTH_TOKEN='your-optional-auth-token'


Replace your-api-key, etc., with your Firebase project configuration.
Obtain your-gemini-api-key from the Google Cloud Console.
REACT_APP_INITIAL_AUTH_TOKEN is optional for custom Firebase authentication; omit for anonymous auth.


Run the ApplicationServe the files using a local server:
http-server .

Open your browser and navigate to http://localhost:8080 (or the port provided by the server).


Project Structure

index.html: Main HTML file with CDN imports for React, Firebase, and Tailwind CSS.
App.jsx: Core React component with all application logic and UI.
translations.js: Multilingual translations for the UI and messages.
README.md: This file.

Usage

Add Products: Type or speak product details (e.g., "Add 1kg tomatoes ₹30") to add to your catalog.
Edit/Delete Products: Use the "Edit" or "Delete" buttons next to each product.
AI Features:
Generate Slogans: Create catchy slogans for a product.
Suggest Categories: Get category suggestions for a product.
Generate Campaign: Create a marketing campaign with strategy and content tailored to the product.


Export Catalog: Export your catalog as a text summary.
Language Selection: Switch between English, Hindi, and Tamil for UI and voice interactions.

Notes

Firebase Setup: Ensure Firestore rules allow read/write for authenticated users. For anonymous auth, enable it in the Firebase Console.
Gemini API: The Gemini API key must be valid and have access to the gemini-2.0-flash model.
Speech Recognition: Works best in Chrome. Some browsers may not support the Web Speech API.
Security: Never commit your .env file to version control. Add it to .gitignore.

License
MIT License. See LICENSE file for details.
Contributing
Contributions are welcome! Please open an issue or submit a pull request.

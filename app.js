import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, collection, onSnapshot, addDoc, updateDoc, deleteDoc, query } from 'firebase/firestore';

// Ensure Tailwind CSS is loaded for styling
// This is typically handled by a build process in a real React app,
// but for a self-contained immersive, we assume it's available.

const App = () => {
    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [products, setProducts] = useState([]);
    const [input, setInput] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [editProductId, setEditProductId] = useState(null);
    const [editFormData, setEditFormData] = useState({ name: '', quantity: '', price: '', description: '' });
    const [isListening, setIsListening] = useState(false);
    const [recognition, setRecognition] = useState(null);
    const [speechLanguage, setSpeechLanguage] = useState('en-US'); // Default speech language for recognition
    const [chatHistory, setChatHistory] = useState([]); // For general AI interaction
    const [voiceOutputEnabled, setVoiceOutputEnabled] = useState(true); // Toggle for voice output
    const [isSpeaking, setIsSpeaking] = useState(false); // To prevent overlapping speech
    const [campaignOutput, setCampaignOutput] = useState(null); // State for AI-generated campaign

    // Firebase Initialization and Authentication
    useEffect(() => {
        try {
            const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
            const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};

            if (Object.keys(firebaseConfig).length === 0) {
                console.error("Firebase config is missing. Please ensure __firebase_config is provided.");
                setMessage("Error: Firebase configuration missing. Cannot connect to database.");
                return;
            }

            const app = initializeApp(firebaseConfig);
            const firestore = getFirestore(app);
            const firebaseAuth = getAuth(app);

            setDb(firestore);
            setAuth(firebaseAuth);

            // Listen for auth state changes
            const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
                if (user) {
                    setUserId(user.uid);
                } else {
                    // Sign in anonymously if no user is logged in
                    try {
                        const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
                        if (initialAuthToken) {
                            await signInWithCustomToken(firebaseAuth, initialAuthToken);
                        } else {
                            await signInAnonymously(firebaseAuth);
                        }
                        setUserId(firebaseAuth.currentUser?.uid || crypto.randomUUID()); // Fallback for userId
                    } catch (error) {
                        console.error("Error signing in:", error);
                        setMessage(`Authentication error: ${error.message}`);
                        setUserId(crypto.randomUUID()); // Use a random ID if sign-in fails
                    }
                }
                setIsAuthReady(true); // Auth state checked
            });

            return () => unsubscribe();
        } catch (error) {
            console.error("Failed to initialize Firebase:", error);
            setMessage(`Firebase initialization error: ${error.message}`);
        }
    }, []);

    // Initialize Speech Recognition API
    useEffect(() => {
        if ('webkitSpeechRecognition' in window) {
            const SpeechRecognition = window.webkitSpeechRecognition;
            const recognitionInstance = new SpeechRecognition();
            recognitionInstance.continuous = false; // Listen for a single utterance
            recognitionInstance.interimResults = false; // Only return final results
            recognitionInstance.lang = speechLanguage; // Set initial language

            recognitionInstance.onstart = () => {
                setIsListening(true);
                setMessage('Listening for your command...');
            };

            recognitionInstance.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                setInput(transcript);
                setMessage(`Heard: "${transcript}". Processing...`);
                setIsListening(false);
                // Automatically process the recognized input
                processInput(transcript);
            };

            recognitionInstance.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                setMessage(`Speech recognition error: ${event.error}. Please try again.`);
                setIsListening(false);
            };

            recognitionInstance.onend = () => {
                setIsListening(false);
            };

            setRecognition(recognitionInstance);
        } else {
            setMessage('Speech recognition not supported in this browser. Please use text input.');
        }
    }, [speechLanguage]); // Re-initialize if language changes

    // Fetch products when auth is ready and userId is available
    useEffect(() => {
        if (isAuthReady && db && userId) {
            const productsCollectionRef = collection(db, `artifacts/${__app_id}/users/${userId}/products`);
            const q = query(productsCollectionRef);

            const unsubscribe = onSnapshot(q, (snapshot) => {
                const productsData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                productsData.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
                setProducts(productsData);
            }, (error) => {
                console.error("Error fetching products:", error);
                setMessage(`Error fetching catalog: ${error.message}`);
            });

            return () => unsubscribe();
        }
    }, [isAuthReady, db, userId]);

    // Function to speak text aloud
    const speakText = (text, lang = 'en-US') => {
        if (!voiceOutputEnabled || !window.speechSynthesis) {
            return;
        }
        if (isSpeaking) {
            window.speechSynthesis.cancel(); // Stop current speech if any
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = (event) => {
            console.error('Speech synthesis error:', event);
            setIsSpeaking(false);
        };
        window.speechSynthesis.speak(utterance);
    };

    const callGeminiAPI = async (prompt, schema = null, currentChatHistory = []) => {
        setLoading(true);
        // Do not clear message here, as it might contain "Listening..." or "Heard..."
        try {
            const payload = { contents: [...currentChatHistory, { role: "user", parts: [{ text: prompt }] }] };
            if (schema) {
                payload.generationConfig = {
                    responseMimeType: "application/json",
                    responseSchema: schema
                };
            }

            const apiKey = "";
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (result.candidates && result.candidates.length > 0 &&
                result.candidates[0].content && result.candidates[0].content.parts &&
                result.candidates[0].content.parts.length > 0) {
                const text = result.candidates[0].content.parts[0].text;
                return schema ? JSON.parse(text) : text;
            } else {
                setMessage('AI response was empty or malformed.');
                console.error('AI response:', result);
                return null;
            }
        } catch (error) {
            setMessage(`Error communicating with AI: ${error.message}`);
            console.error('Gemini API error:', error);
            return null;
        } finally {
            setLoading(false);
        }
    };

    const detectLanguage = async (text) => {
        const prompt = `Detect the language of the following text and return its ISO 639-1 code (e.g., "en", "hi", "ta"). If unsure, default to "en". Text: "${text}"`;
        const schema = {
            type: "OBJECT",
            properties: {
                languageCode: { "type": "STRING" }
            },
            required: ["languageCode"]
        };
        const result = await callGeminiAPI(prompt, schema);
        return result?.languageCode || 'en';
    };

    const translateText = async (text, targetLanguage = 'en') => {
        setMessage('Translating...');
        const translationPrompt = `Translate the following text to ${targetLanguage === 'en' ? 'English' : targetLanguage}: "${text}"`;
        const translated = await callGeminiAPI(translationPrompt);
        if (translated) {
            setMessage('Translation complete.');
            return translated;
        } else {
            setMessage('Could not translate text.');
            return text; // Return original if translation fails
        }
    };

    const processInput = async (textInput) => {
        if (!db || !userId) {
            setMessage('Database not ready. Please wait.');
            return;
        }

        if (!textInput.trim()) {
            setMessage('Please enter product details or a question.');
            return;
        }

        setLoading(true);
        setMessage('');

        let processedText = textInput;
        let detectedLang = 'en'; // Default to English for processing

        // Attempt to detect language and translate if not English
        if (textInput.trim().length > 5) { // Only try to detect for non-trivial input
            detectedLang = await detectLanguage(textInput);
            // Ensure detectedLang is a valid BCP 47 language tag for speech synthesis
            // For simplicity, we'll use a mapping or just the ISO code if it works.
            // For example, 'hi' might need to be 'hi-IN' for some voices.
            // For this example, we'll assume direct ISO 639-1 works or closest match.
            const langForSpeech = detectedLang + (detectedLang.length === 2 ? '-IN' : ''); // Basic attempt for Indian languages

            if (detectedLang !== 'en') {
                setMessage(`Detected language: ${detectedLang.toUpperCase()}. Translating to English...`);
                processedText = await translateText(textInput, 'en');
                if (!processedText) {
                    setMessage('Failed to translate input. Please try again.');
                    speakText('Failed to translate input. Please try again.', langForSpeech);
                    setLoading(false);
                    return;
                }
            }
        }

        // Determine if it's a product command or a general query
        const lowerCaseInput = processedText.toLowerCase();
        const isProductCommand = lowerCaseInput.includes('add') || lowerCaseInput.includes('update') || lowerCaseInput.includes('delete') || lowerCaseInput.includes('product');

        if (isProductCommand && !editProductId) { // Only process as product command if not in edit mode
            try {
                const parseSchema = {
                    type: "OBJECT",
                    properties: {
                        productName: { "type": "STRING" },
                        quantity: { "type": "STRING" },
                        price: { "type": "STRING" }
                    },
                    required: ["productName", "quantity", "price"]
                };
                const parsedData = await callGeminiAPI(`Extract product name, quantity, and price from this text: "${processedText}". Provide the output as a JSON object with keys "productName", "quantity", and "price". Example: {"productName": "tomatoes", "quantity": "1kg", "price": "30"}`, parseSchema);

                if (!parsedData || !parsedData.productName) {
                    const errorMsg = 'Could not understand product details. Please try again with more clarity.';
                    setMessage(errorMsg);
                    speakText(errorMsg, detectedLang + (detectedLang.length === 2 ? '-IN' : '')); // Use detectedLang for speech
                    setLoading(false);
                    return;
                }

                const productName = parsedData.productName;
                const quantity = parsedData.quantity;
                const price = parsedData.price;

                let description = await callGeminiAPI(`Write a catchy and concise product description for "${productName}" (Quantity: ${quantity}, Price: ${price}). Focus on benefits and appeal to small sellers' customers. Max 2-3 sentences.`);
                if (!description) {
                    description = `A great product: ${productName}. Quantity: ${quantity}, Price: ${price}.`;
                }

                const productData = {
                    name: productName,
                    quantity: quantity,
                    price: price,
                    description: description,
                    createdAt: Date.now()
                };

                await addDoc(collection(db, `artifacts/${__app_id}/users/${userId}/products`), productData);
                const successMsg = 'Product added successfully!';
                setMessage(successMsg);
                speakText(successMsg + " " + description, detectedLang + (detectedLang.length === 2 ? '-IN' : '')); // Use detectedLang for speech
                setInput('');
            } catch (error) {
                const errorMsg = `Failed to process product command: ${error.message}`;
                setMessage(errorMsg);
                speakText(errorMsg, detectedLang + (detectedLang.length === 2 ? '-IN' : '')); // Use detectedLang for speech
                console.error('Product command error:', error);
            } finally {
                setLoading(false);
            }
        } else {
            // Handle as general chat
            try {
                const updatedChatHistory = [...chatHistory, { role: "user", parts: [{ text: textInput }] }];
                const aiResponse = await callGeminiAPI(textInput, null, updatedChatHistory); // Pass current chat history
                if (aiResponse) {
                    setChatHistory([...updatedChatHistory, { role: "model", parts: [{ text: aiResponse }] }]);
                    setMessage(`AI Response: ${aiResponse}`);
                    speakText(aiResponse, detectedLang + (detectedLang.length === 2 ? '-IN' : '')); // Use detectedLang for speech
                } else {
                    const errorMsg = 'AI could not provide a response.';
                    setMessage(errorMsg);
                    speakText(errorMsg, detectedLang + (detectedLang.length === 2 ? '-IN' : '')); // Use detectedLang for speech
                }
                setInput('');
            } catch (error) {
                const errorMsg = `Error in AI conversation: ${error.message}`;
                setMessage(errorMsg);
                speakText(errorMsg, detectedLang + (detectedLang.length === 2 ? '-IN' : '')); // Use detectedLang for speech
                console.error('Chat AI error:', error);
            } finally {
                setLoading(false);
            }
        }
    };

    const handleAddOrUpdateProduct = async () => {
        if (editProductId) {
            // Logic for updating an existing product
            if (!db || !userId) {
                setMessage('Database not ready. Please wait.');
                return;
            }
            setLoading(true);
            setMessage('');
            try {
                const productData = {
                    name: editFormData.name,
                    quantity: editFormData.quantity,
                    price: editFormData.price,
                    description: editFormData.description,
                    createdAt: Date.now()
                };
                const productDocRef = doc(db, `artifacts/${__app_id}/users/${userId}/products`, editProductId);
                await updateDoc(productDocRef, productData);
                const successMsg = 'Product updated successfully!';
                setMessage(successMsg);
                speakText(successMsg, speechLanguage); // Use selected speechLanguage for UI feedback
                setEditProductId(null); // Exit edit mode
                setEditFormData({ name: '', quantity: '', price: '', description: '' });
                setInput('');
            } catch (error) {
                const errorMsg = `Failed to update product: ${error.message}`;
                setMessage(errorMsg);
                speakText(errorMsg, speechLanguage); // Use selected speechLanguage for UI feedback
                console.error('Update product error:', error);
            } finally {
                setLoading(false);
            }
        } else {
            // Logic for adding a new product via text input
            processInput(input);
        }
    };

    const handleDeleteProduct = async (id) => {
        if (!db || !userId) {
            setMessage('Database not ready.');
            return;
        }
        setLoading(true);
        setMessage('');
        try {
            const productDocRef = doc(db, `artifacts/${__app_id}/users/${userId}/products`, id);
            await deleteDoc(productDocRef);
            const successMsg = 'Product deleted successfully!';
            setMessage(successMsg);
            speakText(successMsg, speechLanguage); // Use selected speechLanguage for UI feedback
        } catch (error) {
            const errorMsg = `Failed to delete product: ${error.message}`;
            setMessage(errorMsg);
            speakText(errorMsg, speechLanguage); // Use selected speechLanguage for UI feedback
            console.error('Delete product error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = (product) => {
        setEditProductId(product.id);
        setEditFormData({
            name: product.name,
            quantity: product.quantity,
            price: product.price,
            description: product.description
        });
        const msg = 'Editing product. Modify details and click "Update Product".';
        setMessage(msg);
        speakText(msg, speechLanguage); // Use selected speechLanguage for UI feedback
    };

    const handleCancelEdit = () => {
        setEditProductId(null);
        setEditFormData({ name: '', quantity: '', price: '', description: '' });
        const msg = 'Edit cancelled.';
        setMessage(msg);
        speakText(msg, speechLanguage); // Use selected speechLanguage for UI feedback
    };

    const toggleListening = () => {
        if (!recognition) {
            setMessage('Speech recognition not supported or initialized.');
            return;
        }
        if (isListening) {
            recognition.stop();
        } else {
            recognition.lang = speechLanguage; // Ensure language is set before starting
            recognition.start();
        }
    };

    const handleExportCatalog = () => {
        if (products.length === 0) {
            const msg = 'No products to export.';
            setMessage(msg);
            speakText(msg, speechLanguage); // Use selected speechLanguage for UI feedback
            return;
        }

        let catalogText = "--- Your Digital Catalog ---\n\n";
        products.forEach((product, index) => {
            catalogText += `${index + 1}. ${product.name}\n`;
            catalogText += `   Quantity: ${product.quantity}\n`;
            catalogText += `   Price: ₹${product.price}\n`;
            catalogText += `   Description: ${product.description}\n\n`;
        });
        catalogText += "--------------------------\n";
        catalogText += "You can copy this text and paste it into a document or message.";

        setMessage(catalogText);
        speakText("Your catalog is ready for export. Please check the message box to copy the details.", speechLanguage); // Use selected speechLanguage for UI feedback
    };

    // New LLM-powered feature: Generate Marketing Slogans
    const handleGenerateSlogans = async (product) => {
        setLoading(true);
        setMessage('');
        try {
            const prompt = `Generate 3-5 catchy marketing slogans for "${product.name}" with description: "${product.description}". Return as a comma-separated list.`;
            const slogans = await callGeminiAPI(prompt);
            if (slogans) {
                const msg = `Here are some slogans for ${product.name}: ${slogans}`;
                setMessage(msg);
                speakText(msg, speechLanguage); // Use selected speechLanguage for UI feedback
            } else {
                const errorMsg = `Could not generate slogans for ${product.name}.`;
                setMessage(errorMsg);
                speakText(errorMsg, speechLanguage); // Use selected speechLanguage for UI feedback
            }
        } catch (error) {
            const errorMsg = `Error generating slogans: ${error.message}`;
            setMessage(errorMsg);
            speakText(errorMsg, speechLanguage); // Use selected speechLanguage for UI feedback
            console.error('Generate slogans error:', error);
        } finally {
            setLoading(false);
        }
    };

    // New LLM-powered feature: Suggest Categories/Tags
    const handleSuggestCategories = async (product) => {
        setLoading(true);
        setMessage('');
        try {
            const prompt = `Suggest 3-5 relevant categories or tags for "${product.name}" with description: "${product.description}". Return as a comma-separated list.`;
            const categories = await callGeminiAPI(prompt);
            if (categories) {
                const msg = `Suggested categories for ${product.name}: ${categories}`;
                setMessage(msg);
                speakText(msg, speechLanguage); // Use selected speechLanguage for UI feedback
            } else {
                const errorMsg = `Could not suggest categories for ${product.name}.`;
                setMessage(errorMsg);
                speakText(errorMsg, speechLanguage); // Use selected speechLanguage for UI feedback
            }
        } catch (error) {
            const errorMsg = `Error suggesting categories: ${error.message}`;
            setMessage(errorMsg);
            speakText(errorMsg, speechLanguage); // Use selected speechLanguage for UI feedback
            console.error('Suggest categories error:', error);
        } finally {
            setLoading(false);
        }
    };

    // New Agentic AI Feature: Generate Marketing Campaign
    const handleGenerateCampaign = async (product) => {
        setLoading(true);
        setMessage('');
        setCampaignOutput(null); // Clear previous campaign output

        try {
            const detectedLang = speechLanguage.split('-')[0]; // Use the selected speech language for output

            // Step 1: AI generates a campaign strategy
            const strategyPrompt = `Given the product "${product.name}" with description "${product.description}", suggest a brief marketing campaign strategy. Focus on a primary channel (e.g., Social Media, Local Flyers, WhatsApp Broadcast) and a key message. Return as a JSON object with 'channel' and 'message' fields.`;
            const strategySchema = {
                type: "OBJECT",
                properties: {
                    channel: { "type": "STRING" },
                    message: { "type": "STRING" }
                },
                required: ["channel", "message"]
            };
            const strategy = await callGeminiAPI(strategyPrompt, strategySchema);

            if (!strategy || !strategy.channel) {
                const errorMsg = 'AI could not generate a campaign strategy.';
                setMessage(errorMsg);
                speakText(errorMsg, detectedLang + (detectedLang.length === 2 ? '-IN' : ''));
                return;
            }

            // Step 2: AI generates content based on the strategy
            let contentPrompt = `Create marketing content for "${product.name}" (Description: "${product.description}") based on this strategy: Channel: ${strategy.channel}, Message: "${strategy.message}".`;
            let contentSchema = null;
            let templateType = 'general';

            if (strategy.channel.toLowerCase().includes('social media')) {
                contentPrompt += ` Generate a short social media post (max 150 characters) with relevant emojis and hashtags. Also suggest 3-5 engaging questions for comments. Return as a JSON object with 'postText' and 'engagingQuestions' (array of strings).`;
                contentSchema = {
                    type: "OBJECT",
                    properties: {
                        postText: { "type": "STRING" },
                        engagingQuestions: {
                            type: "ARRAY",
                            items: { "type": "STRING" }
                        }
                    },
                    required: ["postText", "engagingQuestions"]
                };
                templateType = 'socialMedia';
            } else if (strategy.channel.toLowerCase().includes('flyer')) {
                contentPrompt += ` Generate a catchy headline (max 50 chars) and 2-3 bullet points highlighting benefits for a local flyer. Return as a JSON object with 'headline' and 'bulletPoints' (array of strings).`;
                contentSchema = {
                    type: "OBJECT",
                    properties: {
                        headline: { "type": "STRING" },
                        bulletPoints: {
                            type: "ARRAY",
                            items: { "type": "STRING" }
                        }
                    },
                    required: ["headline", "bulletPoints"]
                };
                templateType = 'flyer';
            } else if (strategy.channel.toLowerCase().includes('whatsapp')) {
                contentPrompt += ` Generate a concise WhatsApp broadcast message (max 200 characters) with a call to action and 2-3 emojis. Return as a JSON object with 'whatsappMessage'.`;
                contentSchema = {
                    type: "OBJECT",
                    properties: {
                        whatsappMessage: { "type": "STRING" }
                    },
                    required: ["whatsappMessage"]
                };
                templateType = 'whatsapp';
            } else {
                contentPrompt += ` Generate a brief marketing message for this campaign.`;
                // No specific schema, will get plain text
            }

            const content = await callGeminiAPI(contentPrompt, contentSchema);

            if (!content) {
                const errorMsg = 'AI could not generate campaign content.';
                setMessage(errorMsg);
                speakText(errorMsg, detectedLang + (detectedLang.length === 2 ? '-IN' : ''));
                return;
            }

            // Step 3: Present in a "unique template"
            const campaignResult = {
                productName: product.name,
                strategy: strategy,
                content: content,
                templateType: templateType
            };
            setCampaignOutput(campaignResult);

            const successMsg = `AI generated a marketing campaign for ${product.name} focusing on ${strategy.channel}.`;
            setMessage(successMsg);
            speakText(successMsg, detectedLang + (detectedLang.length === 2 ? '-IN' : ''));

        } catch (error) {
            const errorMsg = `Error generating campaign: ${error.message}`;
            setMessage(errorMsg);
            speakText(errorMsg, speechLanguage);
            console.error('Generate campaign error:', error);
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 py-10 px-4 sm:px-6 lg:px-8 flex flex-col items-center font-inter text-gray-800">
            <div className="w-full max-w-3xl bg-white p-8 rounded-2xl shadow-xl border border-indigo-200">
                <h1 className="text-4xl font-extrabold text-indigo-700 text-center mb-6">
                    Smart Catalog Assistant
                </h1>
                <p className="text-center text-gray-600 mb-8">
                    Empowering small sellers with AI-powered digital catalogs.
                </p>

                {userId && (
                    <div className="text-sm text-center text-gray-500 mb-4 p-2 bg-indigo-50 rounded-lg">
                        Your User ID: <span className="font-mono text-indigo-700 break-all">{userId}</span>
                    </div>
                )}

                {/* Input Section */}
                <div className="mb-8 p-6 bg-indigo-50 rounded-xl shadow-inner">
                    <h2 className="text-2xl font-semibold text-indigo-700 mb-4">Input Product or Ask AI</h2>
                    {editProductId ? (
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="editName" className="block text-sm font-medium text-gray-700">Product Name</label>
                                <input
                                    type="text"
                                    id="editName"
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    value={editFormData.name}
                                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                                    placeholder="e.g., Fresh Tomatoes"
                                />
                            </div>
                            <div>
                                <label htmlFor="editQuantity" className="block text-sm font-medium text-gray-700">Quantity</label>
                                <input
                                    type="text"
                                    id="editQuantity"
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    value={editFormData.quantity}
                                    onChange={(e) => setEditFormData({ ...editFormData, quantity: e.target.value })}
                                    placeholder="e.g., 1kg or 5 pieces"
                                />
                            </div>
                            <div>
                                <label htmlFor="editPrice" className="block text-sm font-medium text-gray-700">Price (₹)</label>
                                <input
                                    type="text"
                                    id="editPrice"
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    value={editFormData.price}
                                    onChange={(e) => setEditFormData({ ...editFormData, price: e.target.value })}
                                    placeholder="e.g., 30 or 150"
                                />
                            </div>
                            <div>
                                <label htmlFor="editDescription" className="block text-sm font-medium text-gray-700">Description</label>
                                <textarea
                                    id="editDescription"
                                    rows="3"
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm resize-y"
                                    value={editFormData.description}
                                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                                    placeholder="e.g., Freshly picked, juicy, and perfect for salads."
                                ></textarea>
                            </div>
                            <div className="flex gap-4">
                                <button
                                    onClick={handleAddOrUpdateProduct}
                                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                    disabled={loading}
                                >
                                    {loading ? 'Updating...' : 'Update Product'}
                                </button>
                                <button
                                    onClick={handleCancelEdit}
                                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-3 px-6 rounded-lg shadow-md transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                                    disabled={loading}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <textarea
                                className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:ring-indigo-500 focus:border-indigo-500 resize-y"
                                rows="3"
                                placeholder='Type product details (e.g., "Add 1kg tomatoes for ₹30") or ask a question (e.g., "What is a digital catalog?")'
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                disabled={loading}
                            ></textarea>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <button
                                    onClick={() => processInput(input)}
                                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                    disabled={loading || !input.trim()}
                                >
                                    {loading ? 'Processing...' : 'Process Input'}
                                </button>
                                <button
                                    onClick={toggleListening}
                                    className={`flex-1 font-bold py-3 px-6 rounded-lg shadow-md transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 ${isListening ? 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-500' : 'bg-green-500 hover:bg-green-600 text-white focus:ring-green-500'}`}
                                    disabled={loading || !recognition}
                                >
                                    <i className={`fas fa-microphone ${isListening ? 'animate-pulse' : ''} mr-2`}></i>
                                    {isListening ? 'Stop Listening' : 'Start Voice Input'}
                                </button>
                            </div>
                            <div className="mt-4 flex items-center justify-between">
                                <div className="flex-1 mr-4">
                                    <label htmlFor="speechLang" className="block text-sm font-medium text-gray-700 mb-1">Voice Input Language:</label>
                                    <select
                                        id="speechLang"
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        value={speechLanguage}
                                        onChange={(e) => setSpeechLanguage(e.target.value)}
                                        disabled={isListening || loading}
                                    >
                                        <option value="en-US">English (US)</option>
                                        <option value="hi-IN">Hindi (India)</option>
                                        <option value="ta-IN">Tamil (India)</option>
                                        <option value="te-IN">Telugu (India)</option>
                                        <option value="kn-IN">Kannada (India)</option>
                                        <option value="ml-IN">Malayalam (India)</option>
                                        <option value="bn-IN">Bengali (India)</option>
                                        <option value="gu-IN">Gujarati (India)</option>
                                        <option value="mr-IN">Marathi (India)</option>
                                        <option value="pa-IN">Punjabi (India)</option>
                                    </select>
                                </div>
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="voiceOutputToggle"
                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                        checked={voiceOutputEnabled}
                                        onChange={(e) => setVoiceOutputEnabled(e.target.checked)}
                                    />
                                    <label htmlFor="voiceOutputToggle" className="ml-2 block text-sm font-medium text-gray-700">
                                        Enable Voice Output
                                    </label>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Message Box */}
                {message && (
                    <div className={`p-4 rounded-lg mb-8 ${message.includes('Error') ? 'bg-red-100 text-red-700 border border-red-300' : 'bg-blue-100 text-blue-700 border border-blue-300'}`}>
                        <pre className="whitespace-pre-wrap font-sans text-sm">{message}</pre>
                    </div>
                )}

                {/* AI Chat History */}
                {chatHistory.length > 0 && (
                    <div className="mb-8 p-6 bg-gray-50 rounded-xl shadow-inner border border-gray-200 max-h-60 overflow-y-auto">
                        <h2 className="text-2xl font-semibold text-gray-700 mb-4">AI Conversation</h2>
                        <div className="space-y-4">
                            {chatHistory.map((msg, index) => (
                                <div key={index} className={`p-3 rounded-lg ${msg.role === 'user' ? 'bg-indigo-100 text-indigo-800 self-end ml-auto' : 'bg-gray-200 text-gray-800 self-start mr-auto'}`}>
                                    <p className="font-semibold">{msg.role === 'user' ? 'You' : 'Assistant'}:</p>
                                    <p className="text-sm">{msg.parts[0].text}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* AI Marketing Campaign Output */}
                {campaignOutput && (
                    <div className="mb-8 p-6 bg-white rounded-xl shadow-lg border border-purple-200">
                        <h2 className="text-2xl font-semibold text-purple-700 mb-4">Generated Marketing Campaign</h2>
                        <div className="bg-purple-50 p-4 rounded-lg mb-4">
                            <p className="text-lg font-medium text-purple-800">Strategy for {campaignOutput.productName}:</p>
                            <p className="text-sm text-gray-700">Channel: <span className="font-semibold">{campaignOutput.strategy.channel}</span></p>
                            <p className="text-sm text-gray-700">Key Message: "{campaignOutput.strategy.message}"</p>
                        </div>

                        {campaignOutput.templateType === 'socialMedia' && (
                            <div className="bg-blue-100 p-5 rounded-lg shadow-md border border-blue-200 animate-fade-in">
                                <h3 className="text-xl font-bold text-blue-800 mb-3">Social Media Post Idea <i className="fab fa-instagram ml-2"></i></h3>
                                <p className="text-gray-800 mb-3">{campaignOutput.content.postText}</p>
                                <div className="text-gray-600 text-sm">
                                    <p className="font-semibold">Engaging Questions:</p>
                                    <ul className="list-disc list-inside">
                                        {campaignOutput.content.engagingQuestions.map((q, i) => <li key={i}>{q}</li>)}
                                    </ul>
                                </div>
                            </div>
                        )}

                        {campaignOutput.templateType === 'flyer' && (
                            <div className="bg-green-100 p-5 rounded-lg shadow-md border border-green-200 animate-fade-in">
                                <h3 className="text-xl font-bold text-green-800 mb-3">Local Flyer Content <i className="fas fa-paper-plane ml-2"></i></h3>
                                <h4 className="text-lg font-semibold text-green-700 mb-2">{campaignOutput.content.headline}</h4>
                                <ul className="list-disc list-inside text-gray-800">
                                    {campaignOutput.content.bulletPoints.map((bp, i) => <li key={i}>{bp}</li>)}
                                </ul>
                            </div>
                        )}

                        {campaignOutput.templateType === 'whatsapp' && (
                            <div className="bg-lime-100 p-5 rounded-lg shadow-md border border-lime-200 animate-fade-in">
                                <h3 className="text-xl font-bold text-lime-800 mb-3">WhatsApp Broadcast Message <i className="fab fa-whatsapp ml-2"></i></h3>
                                <p className="text-gray-800">{campaignOutput.content.whatsappMessage}</p>
                            </div>
                        )}

                        {campaignOutput.templateType === 'general' && (
                            <div className="bg-gray-100 p-5 rounded-lg shadow-md border border-gray-200 animate-fade-in">
                                <h3 className="text-xl font-bold text-gray-800 mb-3">General Marketing Message</h3>
                                <p className="text-gray-800">{campaignOutput.content}</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Product Catalog Display */}
                <div className="p-6 bg-white rounded-xl shadow-lg border border-gray-200">
                    <h2 className="text-2xl font-semibold text-indigo-700 mb-4 flex justify-between items-center">
                        Your Digital Catalog
                        <button
                            onClick={handleExportCatalog}
                            className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold py-2 px-4 rounded-full shadow-md transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                            disabled={products.length === 0 || loading}
                        >
                            <i className="fas fa-download mr-1"></i> Export
                        </button>
                    </h2>
                    {products.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No products in your catalog yet. Add some above!</p>
                    ) : (
                        <div className="grid grid-cols-1 gap-6">
                            {products.map(product => (
                                <div key={product.id} className="bg-gray-50 p-5 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">{product.name}</h3>
                                    <p className="text-gray-700 mb-1"><strong>Quantity:</strong> {product.quantity}</p>
                                    <p className="text-gray-700 mb-2"><strong>Price:</strong> ₹{product.price}</p>
                                    <p className="text-gray-600 text-sm italic mb-4">{product.description}</p>
                                    <div className="flex flex-wrap gap-3 mt-4">
                                        <button
                                            onClick={() => handleEditClick(product)}
                                            className="flex-1 min-w-[100px] bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-md shadow-sm transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
                                            disabled={loading}
                                        >
                                            <i className="fas fa-edit mr-1"></i> Edit
                                        </button>
                                        <button
                                            onClick={() => handleDeleteProduct(product.id)}
                                            className="flex-1 min-w-[100px] bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-md shadow-sm transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                                            disabled={loading}
                                        >
                                            <i className="fas fa-trash-alt mr-1"></i> Delete
                                        </button>
                                        <button
                                            onClick={() => handleGenerateSlogans(product)}
                                            className="flex-1 min-w-[100px] bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md shadow-sm transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                            disabled={loading}
                                        >
                                            <i className="fas fa-lightbulb mr-1"></i> Generate Slogans ✨
                                        </button>
                                        <button
                                            onClick={() => handleSuggestCategories(product)}
                                            className="flex-1 min-w-[100px] bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 px-4 rounded-md shadow-sm transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                                            disabled={loading}
                                        >
                                            <i className="fas fa-tags mr-1"></i> Suggest Categories ✨
                                        </button>
                                        <button
                                            onClick={() => handleGenerateCampaign(product)}
                                            className="flex-1 min-w-[100px] bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-md shadow-sm transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                                            disabled={loading}
                                        >
                                            <i className="fas fa-bullhorn mr-1"></i> Generate Campaign 🚀
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default App;

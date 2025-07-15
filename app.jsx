import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, collection, onSnapshot, addDoc, updateDoc, deleteDoc, query } from 'firebase/firestore';
import { translations } from './translations';

// Main App component
const App = () => {
    // Firebase states
    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);

    // Product management states
    const [products, setProducts] = useState([]);
    const [input, setInput] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [editProductId, setEditProductId] = useState(null);
    const [editFormData, setEditFormData] = useState({ name: '', quantity: '', price: '', description: '' });

    // Speech and AI states
    const [isListening, setIsListening] = useState(false);
    const [recognition, setRecognition] = useState(null);
    const [speechLanguage, setSpeechLanguage] = useState('en-US');
    const [displayLanguage, setDisplayLanguage] = useState('en');
    const [chatHistory, setChatHistory] = useState([]);
    const [voiceOutputEnabled, setVoiceOutputEnabled] = useState(true);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [campaignOutput, setCampaignOutput] = useState(null);

    // Helper to get translated text
    const getTranslatedText = (key, replacements = {}) => {
        let text = translations[key]?.[displayLanguage] || translations[key]?.['en'] || key;
        for (const [placeholder, value] of Object.entries(replacements)) {
            text = text.replace(`{{${placeholder}}}`, value);
        }
        return text;
    };

    // Effect for Firebase Initialization and Authentication
    useEffect(() => {
        try {
            const firebaseConfig = JSON.parse(process.env.REACT_APP_FIREBASE_CONFIG || '{}');
            if (Object.keys(firebaseConfig).length === 0) {
                console.error("Firebase config is missing.");
                setMessage(getTranslatedText("firebaseConfigMissingError"));
                return;
            }

            const app = initializeApp(firebaseConfig);
            const firestore = getFirestore(app);
            const firebaseAuth = getAuth(app);

            setDb(firestore);
            setAuth(firebaseAuth);

            const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
                if (user) {
                    setUserId(user.uid);
                } else {
                    try {
                        const initialAuthToken = process.env.REACT_APP_INITIAL_AUTH_TOKEN || null;
                        if (initialAuthToken) {
                            await signInWithCustomToken(firebaseAuth, initialAuthToken);
                        } else {
                            await signInAnonymously(firebaseAuth);
                        }
                        setUserId(firebaseAuth.currentUser?.uid || crypto.randomUUID());
                    } catch (error) {
                        console.error("Error signing in:", error);
                        setMessage(`${getTranslatedText("authenticationError")}: ${error.message}`);
                        setUserId(crypto.randomUUID());
                    }
                }
                setIsAuthReady(true);
            });

            return () => unsubscribe();
        } catch (error) {
            console.error("Failed to initialize Firebase:", error);
            setMessage(`${getTranslatedText("firebaseInitializationError")}: ${error.message}`);
        }
    }, [displayLanguage]);

    // Effect for Speech Recognition setup
    useEffect(() => {
        if ('webkitSpeechRecognition' in window) {
            const SpeechRecognition = window.webkitSpeechRecognition;
            const recognitionInstance = new SpeechRecognition();
            recognitionInstance.continuous = false;
            recognitionInstance.interimResults = false;
            recognitionInstance.lang = speechLanguage;

            recognitionInstance.onstart = () => {
                setIsListening(true);
                setMessage(getTranslatedText('listeningMessage'));
            };

            recognitionInstance.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                setInput(transcript);
                setMessage(`${getTranslatedText('heardMessage')} "${transcript}". ${getTranslatedText('processingMessage')}`);
                setIsListening(false);
                processInput(transcript);
            };

            recognitionInstance.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                setMessage(`${getTranslatedText('speechRecognitionErrorMessage')}: ${event.error}. ${getTranslatedText('pleaseTryAgain')}`);
                setIsListening(false);
            };

            recognitionInstance.onend = () => {
                setIsListening(false);
            };

            setRecognition(recognitionInstance);
        } else {
            setMessage(getTranslatedText('speechRecognitionNotSupported'));
        }
    }, [speechLanguage, displayLanguage]);

    // Effect for fetching products from Firestore
    useEffect(() => {
        if (isAuthReady && db && userId) {
            const productsCollectionRef = collection(db, `artifacts/smart-catalog/users/${userId}/products`);
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
                setMessage(`${getTranslatedText('errorFetchingCatalog')}: ${error.message}`);
            });

            return () => unsubscribe();
        }
    }, [isAuthReady, db, userId, displayLanguage]);

    // Function to speak text using Web Speech API
    const speakText = (text, lang = 'en-US') => {
        if (!voiceOutputEnabled || !window.speechSynthesis) return;
        if (isSpeaking) window.speechSynthesis.cancel();

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

    // Generic function to call Gemini API
    const callGeminiAPI = async (prompt, schema = null, currentChatHistory = []) => {
        setLoading(true);
        try {
            const payload = { contents: [...currentChatHistory, { role: "user", parts: [{ text: prompt }] }] };
            if (schema) {
                payload.generationConfig = {
                    responseMimeType: "application/json",
                    responseSchema: schema
                };
            }

            const apiKey = process.env.REACT_APP_GEMINI_API_KEY || '';
            if (!apiKey) throw new Error("Gemini API key is missing.");
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorBody = await response.text();
                if (response.status === 401) {
                    throw new Error(`API call failed with status 401 (Unauthorized). Ensure the Gemini API key is correctly set in .env.`);
                }
                throw new Error(`API call failed with status ${response.status}: ${errorBody}`);
            }

            let result;
            try {
                result = await response.json();
            } catch (jsonError) {
                throw new Error(`Failed to parse API response as JSON: ${jsonError.message}`);
            }

            if (result.candidates && result.candidates[0].content && result.candidates[0].content.parts) {
                let text = result.candidates[0].content.parts[0].text;
                if (schema) {
                    try {
                        text = JSON.parse(text);
                    } catch (parseError) {
                        throw new Error(`Failed to parse AI text into schema: ${parseError.message}. Text was: ${text}`);
                    }
                }
                return text;
            } else {
                setMessage(getTranslatedText('aiResponseEmpty'));
                console.error('AI response:', result);
                return null;
            }
        } catch (error) {
            setMessage(`${getTranslatedText('errorCommunicatingWithAI')}: ${error.message}`);
            console.error('Gemini API error:', error);
            return null;
        } finally {
            setLoading(false);
        }
    };

    // Function to translate text using Gemini API
    const translateText = async (text, targetLanguage = 'en') => {
        setMessage(getTranslatedText('translatingMessage'));
        const translationPrompt = `Translate the following text to ${targetLanguage === 'en' ? 'English' : targetLanguage}: "${text}"`;
        const translated = await callGeminiAPI(translationPrompt);
        if (translated) {
            setMessage(getTranslatedText('translationComplete'));
            return translated;
        } else {
            setMessage(getTranslatedText('couldNotTranslateText'));
            return text;
        }
    };

    // Main function to process user input (voice or text)
    const processInput = async (textInput) => {
        if (!db || !userId) {
            setMessage(getTranslatedText('dbNotReady'));
            return;
        }

        if (!textInput.trim()) {
            setMessage(getTranslatedText('enterProductDetails'));
            return;
        }

        setLoading(true);
        setMessage('');

        let processedText = textInput;
        const selectedLangCode = speechLanguage.split('-')[0];

        if (selectedLangCode !== 'en') {
            setMessage(getTranslatedText('translatingInput', { lang: selectedLangCode.toUpperCase() }));
            processedText = await translateText(textInput, 'en');
            if (!processedText) {
                setMessage(getTranslatedText('failedToTranslateInput'));
                speakText(getTranslatedText('failedToTranslateInput'), speechLanguage);
                setLoading(false);
                return;
            }
        }

        const lowerCaseInput = processedText.toLowerCase();
        const isProductCommand = lowerCaseInput.includes('add') || lowerCaseInput.includes('update') || lowerCaseInput.includes('delete') || lowerCaseInput.includes('product');

        if (isProductCommand && !editProductId) {
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
                    const errorMsg = getTranslatedText('couldNotUnderstandProduct');
                    setMessage(errorMsg);
                    speakText(errorMsg, speechLanguage);
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

                if (selectedLangCode !== 'en') {
                    description = await translateText(description, selectedLangCode);
                }

                const productData = {
                    name: productName,
                    quantity: quantity,
                    price: price,
                    description: description,
                    createdAt: Date.now()
                };

                await addDoc(collection(db, `artifacts/smart-catalog/users/${userId}/products`), productData);
                const successMsg = getTranslatedText('productAddedSuccess');
                setMessage(successMsg);
                speakText(successMsg + " " + description, speechLanguage);
                setInput('');
            } catch (error) {
                const errorMsg = `${getTranslatedText('failedToProcessProduct')}: ${error.message}`;
                setMessage(errorMsg);
                speakText(errorMsg, speechLanguage);
                console.error('Product command error:', error);
            } finally {
                setLoading(false);
            }
        } else {
            try {
                const updatedChatHistory = [...chatHistory, { role: "user", parts: [{ text: textInput }] }];
                const aiResponse = await callGeminiAPI(textInput, null, updatedChatHistory);
                if (aiResponse) {
                    let translatedAiResponse = aiResponse;
                    if (selectedLangCode !== 'en') {
                        translatedAiResponse = await translateText(aiResponse, selectedLangCode);
                    }

                    setChatHistory([...updatedChatHistory, { role: "model", parts: [{ text: translatedAiResponse }] }]);
                    setMessage(`${getTranslatedText('aiResponse')} ${translatedAiResponse}`);
                    speakText(translatedAiResponse, speechLanguage);
                } else {
                    const errorMsg = getTranslatedText('aiNoResponse');
                    setMessage(errorMsg);
                    speakText(errorMsg, speechLanguage);
                }
                setInput('');
            } catch (error) {
                const errorMsg = `${getTranslatedText('errorInAIConversation')}: ${error.message}`;
                setMessage(errorMsg);
                speakText(errorMsg, speechLanguage);
                console.error('Chat AI error:', error);
            } finally {
                setLoading(false);
            }
        }
    };

    // Function to handle adding or updating a product
    const handleAddOrUpdateProduct = async () => {
        if (editProductId) {
            if (!db || !userId) {
                setMessage(getTranslatedText('dbNotReady'));
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
                const productDocRef = doc(db, `artifacts/smart-catalog/users/${userId}/products`, editProductId);
                await updateDoc(productDocRef, productData);
                const successMsg = getTranslatedText('productUpdatedSuccess');
                setMessage(successMsg);
                speakText(successMsg, speechLanguage);
                setEditProductId(null);
                setEditFormData({ name: '', quantity: '', price: '', description: '' });
                setInput('');
            } catch (error) {
                const errorMsg = `${getTranslatedText('failedToUpdateProduct')}: ${error.message}`;
                setMessage(errorMsg);
                speakText(errorMsg, speechLanguage);
                console.error('Update product error:', error);
            } finally {
                setLoading(false);
            }
        } else {
            processInput(input);
        }
    };

    // Function to delete a product
    const handleDeleteProduct = async (id) => {
        if (!db || !userId) {
            setMessage(getTranslatedText('dbNotReady'));
            return;
        }
        setLoading(true);
        setMessage('');
        try {
            const productDocRef = doc(db, `artifacts/smart-catalog/users/${userId}/products`, id);
            await deleteDoc(productDocRef);
            const successMsg = getTranslatedText('productDeletedSuccess');
            setMessage(successMsg);
            speakText(successMsg, speechLanguage);
        } catch (error) {
            const errorMsg = `${getTranslatedText('failedToDeleteProduct')}: ${error.message}`;
            setMessage(errorMsg);
            speakText(errorMsg, speechLanguage);
            console.error('Delete product error:', error);
        } finally {
            setLoading(false);
        }
    };

    // Function to set up edit mode for a product
    const handleEditClick = (product) => {
        setEditProductId(product.id);
        setEditFormData({
            name: product.name,
            quantity: product.quantity,
            price: product.price,
            description: product.description
        });
        const msg = getTranslatedText('editingProductMessage');
        setMessage(msg);
        speakText(msg, speechLanguage);
    };

    // Function to cancel edit mode
    const handleCancelEdit = () => {
        setEditProductId(null);
        setEditFormData({ name: '', quantity: '', price: '', description: '' });
        const msg = getTranslatedText('editCancelled');
        setMessage(msg);
        speakText(msg, speechLanguage);
    };

    // Function to toggle speech recognition
    const toggleListening = () => {
        if (!recognition) {
            setMessage(getTranslatedText('speechRecognitionNotSupported'));
            return;
        }
        if (isListening) {
            recognition.stop();
        } else {
            recognition.lang = speechLanguage;
            recognition.start();
        }
    };

    // Function to export catalog data as text
    const handleExportCatalog = () => {
        if (products.length === 0) {
            const msg = getTranslatedText('noProductsToExport');
            setMessage(msg);
            speakText(msg, speechLanguage);
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
        speakText(getTranslatedText('catalogReady'), speechLanguage);
    };

    // AI Feature: Generate Marketing Slogans
    const handleGenerateSlogans = async (product) => {
        setLoading(true);
        setMessage('');
        try {
            const prompt = `Generate 3-5 catchy marketing slogans for "${product.name}" with description: "${product.description}". Return as a comma-separated list.`;
            let slogans = await callGeminiAPI(prompt);
            
            const selectedLangCode = speechLanguage.split('-')[0];
            if (selectedLangCode !== 'en' && slogans) {
                slogans = await translateText(slogans, selectedLangCode);
            }

            if (slogans) {
                const msg = getTranslatedText('hereAreSlogans', { productName: product.name }) + ` ${slogans}`;
                setMessage(msg);
                speakText(msg, speechLanguage);
            } else {
                const errorMsg = getTranslatedText('couldNotGenerateSlogans', { productName: product.name });
                setMessage(errorMsg);
                speakText(errorMsg, speechLanguage);
            }
        } catch (error) {
            const errorMsg = `${getTranslatedText('errorGeneratingSlogans')}: ${error.message}`;
            setMessage(errorMsg);
            speakText(errorMsg, speechLanguage);
            console.error('Generate slogans error:', error);
        } finally {
            setLoading(false);
        }
    };

    // AI Feature: Suggest Categories
    const handleSuggestCategories = async (product) => {
        setLoading(true);
        setMessage('');
        try {
            const prompt = `Suggest 3-5 relevant categories or tags for "${product.name}" with description: "${product.description}". Return as a comma-separated list.`;
            let categories = await callGeminiAPI(prompt);

            const selectedLangCode = speechLanguage.split('-')[0];
            if (selectedLangCode !== 'en' && categories) {
                categories = await translateText(categories, selectedLangCode);
            }

            if (categories) {
                const msg = getTranslatedText('suggestedCategories', { productName: product.name }) + ` ${categories}`;
                setMessage(msg);
                speakText(msg, speechLanguage);
            } else {
                const errorMsg = getTranslatedText('couldNotSuggestCategories', { productName: product.name });
                setMessage(errorMsg);
                speakText(errorMsg, speechLanguage);
            }
        } catch (error) {
            const errorMsg = `${getTranslatedText('errorSuggestingCategories')}: ${error.message}`;
            setMessage(errorMsg);
            speakText(errorMsg, speechLanguage);
            console.error('Suggest categories error:', error);
        } finally {
            setLoading(false);
        }
    };

    // AI Feature: Generate Marketing Campaign
    const handleGenerateCampaign = async (product) => {
        setLoading(true);
        setMessage('');
        setCampaignOutput(null);

        try {
            const selectedLangCode = speechLanguage.split('-')[0];
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
                const errorMsg = getTranslatedText('aiCouldNotGenerateCampaignStrategy');
                setMessage(errorMsg);
                speakText(errorMsg, speechLanguage);
                return;
            }

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
            }

            let content = await callGeminiAPI(contentPrompt, contentSchema);

            if (!content) {
                const errorMsg = getTranslatedText('aiCouldNotGenerateCampaignContent');
                setMessage(errorMsg);
                speakText(errorMsg, speechLanguage);
                return;
            }

            if (selectedLangCode !== 'en') {
                if (templateType === 'socialMedia') {
                    content.postText = await translateText(content.postText, selectedLangCode);
                    content.engagingQuestions = await Promise.all(content.engagingQuestions.map(q => translateText(q, selectedLangCode)));
                } else if (templateType === 'flyer') {
                    content.headline = await translateText(content.headline, selectedLangCode);
                    content.bulletPoints = await Promise.all(content.bulletPoints.map(bp => translateText(bp, selectedLangCode)));
                } else if (templateType === 'whatsapp') {
                    content.whatsappMessage = await translateText(content.whatsappMessage, selectedLangCode);
                } else {
                    content = await translateText(content, selectedLangCode);
                }
            }

            const campaignResult = {
                productName: product.name,
                strategy: strategy,
                content: content,
                templateType: templateType
            };
            setCampaignOutput(campaignResult);

            const successMsg = getTranslatedText('aiGeneratedCampaign', { productName: product.name, channel: strategy.channel });
            setMessage(successMsg);
            speakText(successMsg, speechLanguage);
        } catch (error) {
            const errorMsg = `${getTranslatedText('errorGeneratingCampaign')}: ${error.message}`;
            setMessage(errorMsg);
            speakText(errorMsg, speechLanguage);
            console.error('Generate campaign error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 py-10 px-4 sm:px-6 lg:px-8 flex flex-col items-center font-inter text-gray-800">
            <div className="w-full max-w-4xl bg-white p-10 rounded-3xl shadow-2xl border border-indigo-200">
                <h1 className="text-5xl font-extrabold text-indigo-800 text-center mb-6">
                    {getTranslatedText('appTitle')}
                </h1>
                <p className="text-center text-gray-600 mb-8 text-lg">
                    {getTranslatedText('tagline')}
                </p>

                {userId && (
                    <div className="text-sm text-center text-gray-500 mb-4 p-2 bg-indigo-50 rounded-lg">
                        {getTranslatedText('userIdLabel')} <span className="font-mono text-indigo-700 break-all">{userId}</span>
                    </div>
                )}

                <div className="mb-8 p-8 bg-indigo-50 rounded-xl shadow-inner border border-indigo-200">
                    <h2 className="text-2xl font-semibold text-indigo-700 mb-4">{getTranslatedText('inputSectionTitle')}</h2>
                    {editProductId ? (
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="editName" className="block text-sm font-medium text-gray-700">{getTranslatedText('productNameLabel')}</label>
                                <input
                                    type="text"
                                    id="editName"
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    value={editFormData.name}
                                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                                    placeholder={getTranslatedText('productNamePlaceholder')}
                                />
                            </div>
                            <div>
                                <label htmlFor="editQuantity" className="block text-sm font-medium text-gray-700">{getTranslatedText('quantityLabel')}</label>
                                <input
                                    type="text"
                                    id="editQuantity"
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    value={editFormData.quantity}
                                    onChange={(e) => setEditFormData({ ...editFormData, quantity: e.target.value })}
                                    placeholder={getTranslatedText('quantityPlaceholder')}
                                />
                            </div>
                            <div>
                                <label htmlFor="editPrice" className="block text-sm font-medium text-gray-700">{getTranslatedText('priceLabel')}</label>
                                <input
                                    type="text"
                                    id="editPrice"
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    value={editFormData.price}
                                    onChange={(e) => setEditFormData({ ...editFormData, price: e.target.value })}
                                    placeholder={getTranslatedText('pricePlaceholder')}
                                />
                            </div>
                            <div>
                                <label htmlFor="editDescription" className="block text-sm font-medium text-gray-700">{getTranslatedText('descriptionLabel')}</label>
                                <textarea
                                    id="editDescription"
                                    rows="3"
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    value={editFormData.description}
                                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                                    placeholder={getTranslatedText('descriptionPlaceholder')}
                                ></textarea>
                            </div>
                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={handleCancelEdit}
                                    className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg shadow-sm hover:bg-gray-400 transition duration-200"
                                    disabled={loading}
                                >
                                    {getTranslatedText('cancelButton')}
                                </button>
                                <button
                                    onClick={handleAddOrUpdateProduct}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition duration-200 flex items-center justify-center"
                                    disabled={loading}
                                >
                                    {loading && <span className="animate-spin h-4 w-4 mr-2 border-b-2 border-white rounded-full"></span>}
                                    {getTranslatedText('updateProductButton')}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col space-y-4">
                            <textarea
                                className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-base"
                                rows="4"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder={getTranslatedText('inputPlaceholder')}
                                disabled={loading}
                            ></textarea>
                            <div className="flex flex-wrap gap-3 items-center justify-center sm:justify-start">
                                <button
                                    onClick={toggleListening}
                                    className={`px-5 py-2 rounded-full shadow-md transition duration-200 flex items-center ${
                                        isListening ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                    }`}
                                    disabled={loading}
                                >
                                    {isListening ? (
                                        <>
                                            <span className="animate-pulse mr-2">🔴</span> {getTranslatedText('stopListeningButton')}
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8V4a1 1 0 10-2 0v4A5 5 0 015 8V4a1 1 0 00-2 0v4a7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd"></path></svg>
                                            {getTranslatedText('startVoiceInputButton')}
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={() => processInput(input)}
                                    className="px-5 py-2 bg-green-600 text-white rounded-full shadow-md hover:bg-green-700 transition duration-200 flex items-center justify-center"
                                    disabled={loading || !input.trim()}
                                >
                                    {loading && <span className="animate-spin h-4 w-4 mr-2 border-b-2 border-white rounded-full"></span>}
                                    {getTranslatedText('processTextInputButton')}
                                </button>
                                <select
                                    value={speechLanguage}
                                    onChange={(e) => setSpeechLanguage(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                    disabled={loading || isListening}
                                >
                                    <option value="en-US">English (US)</option>
                                    <option value="hi-IN">Hindi (India)</option>
                                    <option value="ta-IN">Tamil (India)</option>
                                </select>
                                <select
                                    value={displayLanguage}
                                    onChange={(e) => setDisplayLanguage(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                    disabled={loading}
                                >
                                    <option value="en">Display: English</option>
                                    <option value="hi">प्रदर्शन: हिंदी</option>
                                    <option value="ta">காட்சி: தமிழ்</option>
                                </select>
                                <label className="flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={voiceOutputEnabled}
                                        onChange={() => setVoiceOutputEnabled(!voiceOutputEnabled)}
                                    />
                                    <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                    <span className="ml-2 text-sm font-medium text-gray-700">{getTranslatedText('voiceOutputToggle')}</span>
                                </label>
                            </div>
                        </div>
                    )}
                </div>

                {message && (
                    <div className={`p-4 rounded-lg text-center mb-6 ${message.startsWith('Error') || message.includes('failed') || message.includes('could not') ? 'bg-red-100 text-red-700 border border-red-300' : 'bg-blue-100 text-blue-700 border border-blue-300'}`}>
                        {message}
                    </div>
                )}

                <div className="mb-8 p-6 bg-white rounded-xl shadow-md border border-gray-200">
                    <h2 className="text-2xl font-semibold text-indigo-700 mb-4">{getTranslatedText('yourCatalogTitle')}</h2>
                    {products.length === 0 ? (
                        <p className="text-gray-500 text-center">{getTranslatedText('noProductsMessage')}</p>
                    ) : (
                        <div className="space-y-6">
                            {products.map((product) => (
                                <div key={product.id} className="p-6 border-l-4 border-indigo-400 bg-gray-50 rounded-xl shadow-sm">
                                    <h3 className="text-xl font-bold text-gray-800 mb-1">{product.name}</h3>
                                    <p className="text-gray-700 text-base">Quantity: <span className="font-medium">{product.quantity}</span></p>
                                    <p className="text-gray-700 text-base">Price: <span className="font-medium">₹{product.price}</span></p>
                                    <p className="text-gray-700 mt-2 text-sm italic">{product.description}</p>
                                    <div className="flex flex-wrap gap-2 mt-4">
                                        <button
                                            onClick={() => handleEditClick(product)}
                                            className="px-3 py-1 bg-yellow-500 text-white rounded-lg text-sm hover:bg-yellow-600 transition duration-200 shadow-sm"
                                            disabled={loading}
                                        >
                                            {getTranslatedText('editButton')}
                                        </button>
                                        <button
                                            onClick={() => handleDeleteProduct(product.id)}
                                            className="px-3 py-1 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition duration-200 shadow-sm"
                                            disabled={loading}
                                        >
                                            {getTranslatedText('deleteButton')}
                                        </button>
                                        <button
                                            onClick={() => handleGenerateSlogans(product)}
                                            className="px-3 py-1 bg-purple-500 text-white rounded-lg text-sm hover:bg-purple-600 transition duration-200 shadow-sm"
                                            disabled={loading}
                                        >
                                            {getTranslatedText('generateSlogansButton')}
                                        </button>
                                        <button
                                            onClick={() => handleSuggestCategories(product)}
                                            className="px-3 py-1 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition duration-200 shadow-sm"
                                            disabled={loading}
                                        >
                                            {getTranslatedText('suggestCategoriesButton')}
                                        </button>
                                        <button
                                            onClick={() => handleGenerateCampaign(product)}
                                            className="px-3 py-1 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition duration-200 shadow-sm"
                                            disabled={loading}
                                        >
                                            {getTranslatedText('generateCampaignButton')}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="mt-6 text-center">
                        <button
                            onClick={handleExportCatalog}
                            className="px-6 py-2 bg-indigo-600 text-white rounded-full shadow-md hover:bg-indigo-700 transition duration-200 flex items-center justify-center mx-auto"
                            disabled={loading || products.length === 0}
                        >
                            {getTranslatedText('exportCatalogButton')}
                        </button>
                    </div>
                </div>

                {campaignOutput && (
                    <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                            <h2 className="text-3xl font-bold text-indigo-700 mb-4 text-center">
                                {getTranslatedText('campaignModalTitle')} {campaignOutput.productName}
                            </h2>
                            <div className="space-y-4 text-gray-700">
                                <p><span className="font-semibold">{getTranslatedText('strategyChannelLabel')}</span> {campaignOutput.strategy.channel}</p>
                                <p><span className="font-semibold">{getTranslatedText('keyMessageLabel')}</span> {campaignOutput.strategy.message}</p>
                                <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                                    <h3 className="text-xl font-semibold text-indigo-700 mb-2">{getTranslatedText('campaignContentTitle')}</h3>
                                    {campaignOutput.templateType === 'socialMedia' && (
                                        <>
                                            <p className="mb-2 whitespace-pre-wrap">{campaignOutput.content.postText}</p>
                                            <p className="font-semibold">{getTranslatedText('engagingQuestionsLabel')}</p>
                                            <ul className="list-disc list-inside">
                                                {campaignOutput.content.engagingQuestions.map((q, i) => (
                                                    <li key={i}>{q}</li>
                                                ))}
                                            </ul>
                                        </>
                                    )}
                                    {campaignOutput.templateType === 'flyer' && (
                                        <>
                                            <p className="text-xl font-bold mb-2">{campaignOutput.content.headline}</p>
                                            <ul className="list-disc list-inside">
                                                {campaignOutput.content.bulletPoints.map((bp, i) => (
                                                    <li key={i}>{bp}</li>
                                                ))}
                                            </ul>
                                        </>
                                    )}
                                    {campaignOutput.templateType === 'whatsapp' && (
                                        <p className="whitespace-pre-wrap">{campaignOutput.content.whatsappMessage}</p>
                                    )}
                                    {campaignOutput.templateType === 'general' && (
                                        <p className="whitespace-pre-wrap">{campaignOutput.content}</p>
                                    )}
                                </div>
                            </div>
                            <div className="mt-6 text-center">
                                <button
                                    onClick={() => setCampaignOutput(null)}
                                    className="px-6 py-2 bg-indigo-600 text-white rounded-full shadow-md hover:bg-indigo-700 transition duration-200"
                                >
                                    {getTranslatedText('closeButton')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default App;

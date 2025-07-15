import React, { useState, useEffect, useRef, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, collection, onSnapshot, addDoc, updateDoc, deleteDoc, query as firestoreQuery, orderBy, serverTimestamp } from 'firebase/firestore'; // Added orderBy and serverTimestamp

// Ensure Tailwind CSS is loaded for styling
// This is typically handled by a build process in a real React app,
// but for a self-contained immersive, we assume it's available.

const App = () => {
    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [products, setProducts] = useState([]);
    const [input, setInput] = useState(''); // For product name or voice command
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [editProductId, setEditProductId] = useState(null);
    const [editFormData, setEditFormData] = useState({ name: '', quantity: '', price: '', description: '' });
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef(null); // Use useRef for mutable object like SpeechRecognition
    const [speechLanguage, setSpeechLanguage] = useState('en-US'); // Default speech language for recognition
    const [chatHistory, setChatHistory] = useState([]); // For general AI interaction
    const [voiceOutputEnabled, setVoiceOutputEnabled] = useState(true); // Toggle for voice output
    const [isSpeaking, setIsSpeaking] = useState(false); // To prevent overlapping speech
    const [campaignOutput, setCampaignOutput] = useState(null); // State for AI-generated campaign

    // Product form data state
    const [newProduct, setNewProduct] = useState({
        name: '',
        quantity: '',
        price: '',
        description: ''
    });

    // Firebase Initialization and Authentication
    useEffect(() => {
        let unsubscribeAuth = () => {};
        try {
            // Replace with your actual Firebase config and token
            const firebaseConfig = JSON.parse(process.env.REACT_APP_FIREBASE_CONFIG || '{}');
            const initialAuthToken = process.env.REACT_APP_FIREBASE_CUSTOM_TOKEN || null;

            if (Object.keys(firebaseConfig).length === 0) {
                console.error("Firebase config is missing. Please ensure REACT_APP_FIREBASE_CONFIG is provided.");
                setMessage("Error: Firebase configuration missing. Cannot connect to database.");
                return;
            }

            const app = initializeApp(firebaseConfig);
            const firestore = getFirestore(app);
            const firebaseAuth = getAuth(app);

            setDb(firestore);
            setAuth(firebaseAuth);

            // Listen for auth state changes
            unsubscribeAuth = onAuthStateChanged(firebaseAuth, async (user) => {
                if (user) {
                    setUserId(user.uid);
                    setIsAuthReady(true);
                    setMessage(`Logged in as: ${user.isAnonymous ? 'Anonymous' : user.uid}`);
                } else {
                    try {
                        if (initialAuthToken) {
                            await signInWithCustomToken(firebaseAuth, initialAuthToken);
                        } else {
                            await signInAnonymously(firebaseAuth);
                        }
                        // User ID will be set by the subsequent onAuthStateChanged call
                    } catch (error) {
                        console.error("Error during anonymous sign-in or custom token sign-in:", error);
                        setMessage(`Authentication Error: ${error.message}`);
                        setIsAuthReady(false);
                    }
                }
            });
        } catch (error) {
            console.error("Failed to initialize Firebase:", error);
            setMessage(`Firebase Initialization Error: ${error.message}`);
        }

        return () => {
            if (unsubscribeAuth) {
                unsubscribeAuth();
            }
        };
    }, []);

    // Real-time product listener
    useEffect(() => {
        if (!db || !userId || !isAuthReady) return;

        setMessage("Loading products...");
        setLoading(true);

        const productsCollectionRef = collection(db, 'products');
        const q = firestoreQuery(productsCollectionRef, orderBy('createdAt', 'desc')); // Order by creation time

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const productsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setProducts(productsData);
            setMessage("Products loaded.");
            setLoading(false);
        }, (error) => {
            console.error("Error fetching products:", error);
            setMessage(`Error fetching products: ${error.message}`);
            setLoading(false);
        });

        return () => unsubscribe(); // Cleanup the listener
    }, [db, userId, isAuthReady]);

    // Speech Recognition Setup
    useEffect(() => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            setMessage("Speech Recognition not supported by this browser.");
            setRecognition(null);
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognitionInstance = new SpeechRecognition();
        recognitionInstance.continuous = false; // Listen for a single utterance
        recognitionInstance.interimResults = false; // Only return final results
        recognitionInstance.lang = speechLanguage;

        recognitionInstance.onstart = () => {
            setIsListening(true);
            setMessage("Listening...");
        };

        recognitionInstance.onresult = (event) => {
            const transcript = Array.from(event.results)
                .map(result => result[0])
                .map(result => result.transcript)
                .join('');
            setInput(transcript); // Set the recognized speech to the input field
            setMessage("Speech recognized.");
            handleVoiceCommand(transcript); // Process the command
        };

        recognitionInstance.onerror = (event) => {
            console.error("Speech recognition error:", event.error);
            setMessage(`Speech recognition error: ${event.error}`);
            setIsListening(false);
        };

        recognitionInstance.onend = () => {
            setIsListening(false);
            setMessage("Listening stopped.");
        };

        recognitionRef.current = recognitionInstance;
        setRecognition(recognitionInstance); // Also set to state for UI toggle

        return () => {
            if (recognitionInstance) {
                recognitionInstance.stop(); // Ensure it stops when component unmounts
            }
        };
    }, [speechLanguage]); // Re-initialize if language changes

    // Text-to-Speech (TTS) function
    const speakText = useCallback((text) => {
        if (!voiceOutputEnabled || !('speechSynthesis' in window)) {
            console.log("Voice output disabled or not supported.");
            return;
        }

        if (isSpeaking) {
            console.log("Already speaking, queuing text...");
            // Optionally, queue speeches or interrupt current one
            // For simplicity, we'll just log and return
            return;
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US'; // Default to English for output
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = (event) => {
            console.error("Speech synthesis error:", event);
            setIsSpeaking(false);
        };

        window.speechSynthesis.speak(utterance);
    }, [voiceOutputEnabled, isSpeaking]);

    // Mock AI Interaction Function
    const getAiResponse = async (command) => {
        setLoading(true);
        setMessage("Thinking...");
        try {
            // Simulate API call delay
            await new Promise(resolve => setTimeout(Math.random() * 1500 + 500, resolve));

            let responseText = "I'm sorry, I don't understand that command.";
            let campaignSuggestion = null;

            const lowerCommand = command.toLowerCase();

            if (lowerCommand.includes("hello") || lowerCommand.includes("hi")) {
                responseText = "Hello there! How can I assist you with your products today?";
            } else if (lowerCommand.includes("add product")) {
                responseText = "To add a product, please use the form. What is the product name, quantity, price, and a brief description?";
            } else if (lowerCommand.includes("list products") || lowerCommand.includes("show products")) {
                if (products.length > 0) {
                    responseText = `You have ${products.length} products. For example, ${products[0].name}, priced at $${products[0].price}.`;
                } else {
                    responseText = "You currently have no products. Try adding one!";
                }
            } else if (lowerCommand.includes("generate campaign")) {
                responseText = "Generating a marketing campaign idea for your products...";
                campaignSuggestion = {
                    title: "Seasonal Sale Extravaganza!",
                    slogan: "Unbeatable prices on all your favorites!",
                    hashtags: ["#SeasonSale", "#GreatDeals", "#ShopNow"],
                    targetAudience: "Budget-conscious shoppers, families",
                    callToAction: "Visit our store or website today!"
                };
            } else if (lowerCommand.includes("thank you")) {
                responseText = "You're welcome! Is there anything else I can help with?";
            }

            setChatHistory(prev => [...prev, { role: 'user', text: command }, { role: 'ai', text: responseText }]);
            setCampaignOutput(campaignSuggestion);
            setMessage("AI response received.");
            speakText(responseText); // Speak the AI's response
        } catch (error) {
            console.error("AI interaction error:", error);
            setMessage(`AI Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Handler for voice commands (after speech recognition)
    const handleVoiceCommand = (command) => {
        getAiResponse(command);
    };

    // CRUD Operations

    const handleNewProductChange = (e) => {
        const { name, value } = e.target;
        setNewProduct(prev => ({ ...prev, [name]: value }));
    };

    const addProduct = async (e) => {
        e.preventDefault();
        if (!db || !userId || !newProduct.name || !newProduct.quantity || !newProduct.price) {
            setMessage("Please fill in all product fields.");
            return;
        }

        setLoading(true);
        setMessage("Adding product...");
        try {
            await addDoc(collection(db, 'products'), {
                ...newProduct,
                quantity: Number(newProduct.quantity),
                price: Number(newProduct.price),
                userId: userId,
                createdAt: serverTimestamp() // Add timestamp
            });
            setNewProduct({ name: '', quantity: '', price: '', description: '' });
            setMessage("Product added successfully!");
        } catch (error) {
            console.error("Error adding product:", error);
            setMessage(`Error adding product: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const startEditProduct = (product) => {
        setEditProductId(product.id);
        setEditFormData({
            name: product.name,
            quantity: product.quantity,
            price: product.price,
            description: product.description
        });
    };

    const handleEditFormChange = (e) => {
        const { name, value } = e.target;
        setEditFormData(prev => ({ ...prev, [name]: value }));
    };

    const updateProduct = async (e) => {
        e.preventDefault();
        if (!db || !editProductId || !editFormData.name || !editFormData.quantity || !editFormData.price) {
            setMessage("Please fill in all fields for editing.");
            return;
        }

        setLoading(true);
        setMessage("Updating product...");
        try {
            const productRef = doc(db, 'products', editProductId);
            await updateDoc(productRef, {
                ...editFormData,
                quantity: Number(editFormData.quantity),
                price: Number(editFormData.price)
            });
            setEditProductId(null);
            setEditFormData({ name: '', quantity: '', price: '', description: '' });
            setMessage("Product updated successfully!");
        } catch (error) {
            console.error("Error updating product:", error);
            setMessage(`Error updating product: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const deleteProduct = async (productId) => {
        if (!db) return;
        if (window.confirm("Are you sure you want to delete this product?")) {
            setLoading(true);
            setMessage("Deleting product...");
            try {
                await deleteDoc(doc(db, 'products', productId));
                setMessage("Product deleted successfully!");
            } catch (error) {
                console.error("Error deleting product:", error);
                setMessage(`Error deleting product: ${error.message}`);
            } finally {
                setLoading(false);
            }
        }
    };

    // Voice Assistant Controls
    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
        } else {
            recognitionRef.current?.start();
        }
    };

    const toggleVoiceOutput = () => {
        setVoiceOutputEnabled(prev => !prev);
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel(); // Stop current speech if toggled off
            setIsSpeaking(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-8 flex flex-col items-center">
            <h1 className="text-4xl font-bold text-indigo-700 mb-8">AI-Powered Product Manager</h1>

            {/* Status Messages */}
            {message && (
                <div className={`p-3 rounded-md mb-6 w-full max-w-2xl text-center ${
                    message.includes("Error") ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                }`}>
                    {message}
                </div>
            )}
            {loading && (
                <div className="flex items-center space-x-2 text-gray-600 mb-6">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600"></div>
                    <span>Loading...</span>
                </div>
            )}

            {!isAuthReady ? (
                <div className="text-center text-lg text-gray-600">
                    Initializing Firebase and authenticating...
                </div>
            ) : (
                <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Product Management Section */}
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-2xl font-semibold text-indigo-600 mb-4">Product Management</h2>

                        {/* Add Product Form */}
                        <form onSubmit={addProduct} className="space-y-4 mb-8">
                            <h3 className="text-xl font-medium text-gray-700">Add New Product</h3>
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={newProduct.name}
                                    onChange={handleNewProductChange}
                                    placeholder="Product Name"
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">Quantity</label>
                                    <input
                                        type="number"
                                        id="quantity"
                                        name="quantity"
                                        value={newProduct.quantity}
                                        onChange={handleNewProductChange}
                                        placeholder="Quantity"
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="price" className="block text-sm font-medium text-gray-700">Price</label>
                                    <input
                                        type="number"
                                        id="price"
                                        name="price"
                                        step="0.01"
                                        value={newProduct.price}
                                        onChange={handleNewProductChange}
                                        placeholder="Price"
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                                <textarea
                                    id="description"
                                    name="description"
                                    value={newProduct.description}
                                    onChange={handleNewProductChange}
                                    placeholder="Product Description (optional)"
                                    rows="2"
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                                ></textarea>
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                                disabled={loading}
                            >
                                Add Product
                            </button>
                        </form>

                        {/* Product List */}
                        <h3 className="text-xl font-medium text-gray-700 mb-4">Your Products</h3>
                        {products.length === 0 ? (
                            <p className="text-gray-500">No products added yet.</p>
                        ) : (
                            <ul className="space-y-4">
                                {products.map(product => (
                                    <li key={product.id} className="bg-gray-50 p-4 rounded-md shadow-sm border border-gray-200">
                                        {editProductId === product.id ? (
                                            <form onSubmit={updateProduct} className="space-y-3">
                                                <input
                                                    type="text"
                                                    name="name"
                                                    value={editFormData.name}
                                                    onChange={handleEditFormChange}
                                                    className="block w-full border border-gray-300 rounded-md p-2"
                                                    required
                                                />
                                                <input
                                                    type="number"
                                                    name="quantity"
                                                    value={editFormData.quantity}
                                                    onChange={handleEditFormChange}
                                                    className="block w-full border border-gray-300 rounded-md p-2"
                                                    required
                                                />
                                                <input
                                                    type="number"
                                                    name="price"
                                                    step="0.01"
                                                    value={editFormData.price}
                                                    onChange={handleEditFormChange}
                                                    className="block w-full border border-gray-300 rounded-md p-2"
                                                    required
                                                />
                                                <textarea
                                                    name="description"
                                                    value={editFormData.description}
                                                    onChange={handleEditFormChange}
                                                    rows="2"
                                                    className="block w-full border border-gray-300 rounded-md p-2"
                                                ></textarea>
                                                <div className="flex space-x-2">
                                                    <button
                                                        type="submit"
                                                        className="flex-1 bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 disabled:opacity-50"
                                                        disabled={loading}
                                                    >
                                                        Save
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setEditProductId(null)}
                                                        className="flex-1 bg-gray-400 text-white py-2 px-4 rounded-md hover:bg-gray-500 disabled:opacity-50"
                                                        disabled={loading}
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </form>
                                        ) : (
                                            <>
                                                <h4 className="font-semibold text-lg text-indigo-700">{product.name}</h4>
                                                <p className="text-gray-600">Quantity: {product.quantity}</p>
                                                <p className="text-gray-600">Price: ${product.price?.toFixed(2)}</p>
                                                {product.description && <p className="text-gray-600 text-sm italic">{product.description}</p>}
                                                <div className="mt-3 flex space-x-2">
                                                    <button
                                                        onClick={() => startEditProduct(product)}
                                                        className="bg-blue-500 text-white py-1 px-3 rounded-md text-sm hover:bg-blue-600 disabled:opacity-50"
                                                        disabled={loading}
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => deleteProduct(product.id)}
                                                        className="bg-red-500 text-white py-1 px-3 rounded-md text-sm hover:bg-red-600 disabled:opacity-50"
                                                        disabled={loading}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* AI Voice Assistant Section */}
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-2xl font-semibold text-indigo-600 mb-4">AI Voice Assistant</h2>

                        <div className="mb-4">
                            <label className="inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={voiceOutputEnabled}
                                    onChange={toggleVoiceOutput}
                                />
                                <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                <span className="ms-3 text-sm font-medium text-gray-900">Voice Output {voiceOutputEnabled ? 'Enabled' : 'Disabled'}</span>
                            </label>
                        </div>

                        <div className="mb-4">
                            <label htmlFor="speech-lang" className="block text-sm font-medium text-gray-700 mb-1">Speech Language:</label>
                            <select
                                id="speech-lang"
                                value={speechLanguage}
                                onChange={(e) => setSpeechLanguage(e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                <option value="en-US">English (US)</option>
                                <option value="hi-IN">Hindi (India)</option>
                                <option value="ta-IN">Tamil (India)</option>
                                {/* Add more languages as supported by Web Speech API */}
                            </select>
                        </div>

                        <div className="flex items-center space-x-4 mb-6">
                            <button
                                onClick={toggleListening}
                                className={`py-3 px-6 rounded-full text-white font-semibold transition-colors duration-200 ${
                                    isListening ? 'bg-red-500 hover:bg-red-600' : 'bg-indigo-600 hover:bg-indigo-700'
                                } disabled:opacity-50`}
                                disabled={loading || !recognitionRef.current}
                            >
                                {isListening ? 'Stop Listening' : 'Start Listening'}
                            </button>
                            {isListening && (
                                <span className="text-indigo-600 animate-pulse">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-14 0v-1m7 11v-3m-3 0h6m-3 0a7 7 0 01-7-7v-1a7 7 0 0114 0v1a7 7 0 01-7 7z"></path></svg>
                                </span>
                            )}
                        </div>

                        <div className="mb-6">
                            <label htmlFor="voice-input" className="block text-sm font-medium text-gray-700">Your Voice Input:</label>
                            <input
                                type="text"
                                id="voice-input"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Speak or type a command..."
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                                disabled={isListening}
                            />
                            <button
                                onClick={() => getAiResponse(input)}
                                className="mt-2 w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:opacity-50"
                                disabled={loading || !input.trim()}
                            >
                                Ask AI (Text)
                            </button>
                        </div>

                        {/* AI Chat History */}
                        <h3 className="text-xl font-medium text-gray-700 mb-3">AI Chat History</h3>
                        <div className="bg-gray-50 p-4 rounded-md h-64 overflow-y-auto border border-gray-200 mb-6">
                            {chatHistory.length === 0 ? (
                                <p className="text-gray-500 italic">No conversation yet. Try asking something!</p>
                            ) : (
                                chatHistory.map((msg, index) => (
                                    <div key={index} className={`mb-2 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                                        <span className={`inline-block p-2 rounded-lg ${
                                            msg.role === 'user' ? 'bg-indigo-100 text-indigo-800' : 'bg-green-100 text-green-800'
                                        }`}>
                                            {msg.role === 'user' ? 'You: ' : 'AI: '} {msg.text}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* AI Campaign Output */}
                        {campaignOutput && (
                            <div className="bg-yellow-50 p-4 rounded-md shadow-sm border border-yellow-200 mt-6">
                                <h3 className="text-xl font-medium text-yellow-800 mb-3">AI Campaign Suggestion:</h3>
                                <p className="font-semibold text-lg text-yellow-700">{campaignOutput.title}</p>
                                <p className="italic text-yellow-600">"{campaignOutput.slogan}"</p>
                                <p className="text-yellow-600">Hashtags: {campaignOutput.hashtags.join(', ')}</p>
                                <p className="text-yellow-600">Target Audience: {campaignOutput.targetAudience}</p>
                                <p className="text-yellow-600">Call to Action: {campaignOutput.callToAction}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;

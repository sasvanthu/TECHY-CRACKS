import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

interface ProductData {
  name: string;
  price: string;
  quantity: string;
  unit: string;
  category: string;
}

interface VoiceProductInputProps {
  onProductDetected: (product: ProductData) => void;
  isListening: boolean;
  setIsListening: (listening: boolean) => void;
  selectedLanguage: string;
  className?: string;
}

export function VoiceProductInput({ 
  onProductDetected, 
  isListening, 
  setIsListening,
  selectedLanguage,
  className = ""
}: VoiceProductInputProps) {
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check if speech recognition is supported
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setIsSupported(true);
      
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.maxAlternatives = 1;
      recognitionRef.current.lang = selectedLanguage;
      
      recognitionRef.current.onresult = (event: any) => {
        const result = event.results[0][0];
        const text = result.transcript;
        const confidence = result.confidence;
        
        if (confidence > 0.5) {
          const productData = parseProductFromText(text);
          if (productData) {
            onProductDetected(productData);
            toast({
              title: "Product Added!",
              description: `Added ${productData.name} - ${productData.price}`,
            });
          } else {
            toast({
              title: "Could not understand",
              description: `Try saying: "Add 1kg tomatoes 30 rupees"`,
              variant: "destructive"
            });
          }
        } else {
          toast({
            title: "Please speak clearly",
            description: "Try again with clear pronunciation",
            variant: "destructive"
          });
        }
        setIsListening(false);
      };
      
      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        
        let errorMessage = "Voice recognition failed";
        switch (event.error) {
          case 'no-speech':
            errorMessage = "No speech detected. Try saying: 'Add 1kg rice 50 rupees'";
            break;
          case 'audio-capture':
            errorMessage = "Microphone not working. Please check permissions.";
            break;
          case 'not-allowed':
            errorMessage = "Please allow microphone access to add products by voice.";
            break;
        }
        
        toast({
          title: "Voice Input Error",
          description: errorMessage,
          variant: "destructive"
        });
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, [onProductDetected, setIsListening, selectedLanguage]);

  // Parse natural language product input
  const parseProductFromText = (text: string): ProductData | null => {
    const lowerText = text.toLowerCase();
    
    // Common patterns: "add 1kg tomatoes 30 rupees", "tomatoes 1 kg price 30", etc.
    const patterns = [
      /(?:add\s+)?(\d+(?:\.\d+)?)\s*(kg|grams?|liter|litre|piece|dozen|box|bag|packet)\s+(.+?)\s+(?:price\s+|for\s+|at\s+|rupees?\s*)?(\d+)/i,
      /(?:add\s+)?(.+?)\s+(\d+(?:\.\d+)?)\s*(kg|grams?|liter|litre|piece|dozen|box|bag|packet)\s+(?:price\s+|for\s+|at\s+|rupees?\s*)?(\d+)/i,
      /(?:add\s+)?(.+?)\s+(?:price\s+|for\s+|at\s+|rupees?\s*)?(\d+)\s+(?:per\s+)?(\d+(?:\.\d+)?)\s*(kg|grams?|liter|litre|piece|dozen|box|bag|packet)/i
    ];
    
    for (const pattern of patterns) {
      const match = lowerText.match(pattern);
      if (match) {
        let quantity, unit, name, price;
        
        if (pattern === patterns[0]) {
          [, quantity, unit, name, price] = match;
        } else if (pattern === patterns[1]) {
          [, name, quantity, unit, price] = match;
        } else {
          [, name, price, quantity, unit] = match;
        }
        
        // Determine category based on product name
        const category = detectCategory(name);
        
        return {
          name: name.trim(),
          price: price,
          quantity: quantity,
          unit: unit,
          category
        };
      }
    }
    
    return null;
  };

  const detectCategory = (productName: string): string => {
    const categories = {
      'Vegetables': ['tomato', 'potato', 'onion', 'carrot', 'cabbage', 'spinach', 'lettuce', 'cucumber', 'pepper', 'brinjal', 'okra'],
      'Fruits': ['apple', 'banana', 'orange', 'mango', 'grape', 'strawberry', 'watermelon', 'pineapple'],
      'Grains': ['rice', 'wheat', 'barley', 'corn', 'maize', 'millet', 'quinoa'],
      'Dairy': ['milk', 'cheese', 'butter', 'yogurt', 'paneer', 'cream'],
      'Pulses': ['dal', 'lentil', 'chickpea', 'bean', 'peas'],
      'Spices': ['turmeric', 'chili', 'cumin', 'coriander', 'garam masala', 'pepper'],
      'Crafts': ['handicraft', 'pottery', 'jewelry', 'textile', 'painting', 'decoration'],
      'General': ['soap', 'detergent', 'oil', 'sugar', 'salt', 'tea', 'coffee']
    };
    
    const lowerName = productName.toLowerCase();
    for (const [category, items] of Object.entries(categories)) {
      if (items.some(item => lowerName.includes(item))) {
        return category;
      }
    }
    return 'Other';
  };

  const toggleListening = () => {
    if (!isSupported) {
      toast({
        title: "Not Supported",
        description: "Voice input is not supported in this browser.",
        variant: "destructive"
      });
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
        toast({
          title: "🎤 Say your product...",
          description: "Example: 'Add 1kg tomatoes 30 rupees'",
        });
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        toast({
          title: "Error",
          description: "Failed to start voice input",
          variant: "destructive"
        });
      }
    }
  };

  if (!isSupported) {
    return (
      <Button
        variant="outline"
        size="icon"
        disabled
        className={`${className} opacity-50 cursor-not-allowed`}
        title="Voice input not supported"
      >
        <MicOff className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Button
      variant={isListening ? "default" : "outline"}
      size="lg"
      onClick={toggleListening}
      className={`
        ${className} 
        transition-all duration-300 min-w-[160px] h-16
        ${isListening 
          ? 'bg-voice-active hover:bg-voice-active/90 text-white shadow-voice animate-pulse-voice' 
          : 'hover:bg-accent hover:text-accent-foreground border-2 border-accent hover:border-accent'
        }
      `}
      title={isListening ? "Stop listening" : "Add product by voice"}
    >
      <div className="flex items-center gap-3">
        {isListening ? (
          <MicOff className="h-6 w-6" />
        ) : (
          <Mic className="h-6 w-6" />
        )}
        <div className="text-left">
          <div className="font-semibold">
            {isListening ? "Listening..." : "Add by Voice"}
          </div>
          <div className="text-xs opacity-80">
            {isListening ? "Say your product" : "Tap to speak"}
          </div>
        </div>
      </div>
    </Button>
  );
}

import { useState } from 'react';
import { Plus, Edit3, Package, IndianRupee } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { VoiceProductInput } from './VoiceProductInput';
import { toast } from '@/hooks/use-toast';

interface ProductData {
  name: string;
  price: string;
  quantity: string;
  unit: string;
  category: string;
  description?: string;
}

interface ProductFormProps {
  onAddProduct: (product: ProductData & { id: string; description: string }) => void;
  selectedLanguage: string;
  className?: string;
}

const CATEGORIES = [
  'Vegetables', 'Fruits', 'Grains', 'Dairy', 'Pulses', 'Spices', 'Crafts', 'General', 'Other'
];

const UNITS = [
  'kg', 'grams', 'liter', 'piece', 'dozen', 'box', 'bag', 'packet', 'meter', 'square ft'
];

export function ProductForm({ onAddProduct, selectedLanguage, className = "" }: ProductFormProps) {
  const [isListening, setIsListening] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [formData, setFormData] = useState<ProductData>({
    name: '',
    price: '',
    quantity: '',
    unit: 'kg',
    category: 'Vegetables',
    description: ''
  });

  const handleVoiceProductDetected = (product: ProductData) => {
    // Auto-generate description
    const description = generateProductDescription(product);
    
    const newProduct = {
      id: Date.now().toString(),
      ...product,
      description
    };
    
    onAddProduct(newProduct);
    setFormData({
      name: '',
      price: '',
      quantity: '',
      unit: 'kg',
      category: 'Vegetables',
      description: ''
    });
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.price || !formData.quantity) {
      toast({
        title: "Missing Information",
        description: "Please fill in product name, price, and quantity",
        variant: "destructive"
      });
      return;
    }

    const description = formData.description || generateProductDescription(formData);
    
    const newProduct = {
      id: Date.now().toString(),
      ...formData,
      description
    };
    
    onAddProduct(newProduct);
    setFormData({
      name: '',
      price: '',
      quantity: '',
      unit: 'kg',
      category: 'Vegetables',
      description: ''
    });
    setShowManualForm(false);
    
    toast({
      title: "Product Added!",
      description: `${formData.name} has been added to your catalog`,
    });
  };

  const generateProductDescription = (product: ProductData): string => {
    const descriptions = {
      'Vegetables': [
        `Fresh, organic ${product.name} straight from the farm. Perfect for healthy cooking.`,
        `Premium quality ${product.name}, handpicked for freshness and taste.`,
        `Farm-fresh ${product.name}, rich in nutrients and flavor.`
      ],
      'Fruits': [
        `Sweet and juicy ${product.name}, perfect for snacking or making fresh juice.`,
        `Ripe, delicious ${product.name} picked at peak freshness.`,
        `Premium quality ${product.name}, naturally sweet and nutritious.`
      ],
      'Grains': [
        `High-quality ${product.name}, perfect for daily meals. Clean and well-processed.`,
        `Premium ${product.name} with excellent taste and nutrition.`,
        `Fresh ${product.name}, ideal for traditional cooking.`
      ],
      'Dairy': [
        `Fresh ${product.name} from healthy, well-cared animals. Pure and natural.`,
        `Premium quality ${product.name}, rich in taste and nutrition.`,
        `Pure, fresh ${product.name} delivered daily.`
      ],
      'Crafts': [
        `Beautiful handmade ${product.name}, crafted with love and attention to detail.`,
        `Unique, artisanal ${product.name} perfect for gifts or home decoration.`,
        `Traditional handcrafted ${product.name}, showcasing local artistry.`
      ]
    };

    const categoryDescriptions = descriptions[product.category as keyof typeof descriptions] || [
      `High-quality ${product.name} at competitive prices.`,
      `Premium ${product.name} for all your needs.`,
      `Fresh ${product.name} available now.`
    ];

    return categoryDescriptions[Math.floor(Math.random() * categoryDescriptions.length)];
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Voice Input Section */}
      <Card className="p-6 bg-gradient-accent/5 border-2 border-accent/20">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Package className="h-6 w-6 text-accent" />
            <h3 className="text-xl font-bold text-foreground">Add Products to Your Catalog</h3>
          </div>
          
          <VoiceProductInput
            onProductDetected={handleVoiceProductDetected}
            isListening={isListening}
            setIsListening={setIsListening}
            selectedLanguage={selectedLanguage}
            className="mx-auto"
          />
          
          <p className="text-muted-foreground">
            Say: <span className="font-semibold text-accent">"Add 1kg tomatoes 30 rupees"</span> or 
            <span className="font-semibold text-accent"> "Rice 25kg price 500"</span>
          </p>
        </div>
      </Card>

      {/* Manual Form Toggle */}
      <div className="text-center">
        <Button
          variant="outline"
          onClick={() => setShowManualForm(!showManualForm)}
          className="border-2 border-accent hover:bg-accent hover:text-accent-foreground"
        >
          <Edit3 className="h-4 w-4 mr-2" />
          {showManualForm ? 'Hide Manual Form' : 'Add Manually Instead'}
        </Button>
      </div>

      {/* Manual Form */}
      {showManualForm && (
        <Card className="p-6 bg-card/90">
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">Product Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g., Fresh Tomatoes"
                  className="border-2 focus:border-accent"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category" className="text-sm font-medium">Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                  <SelectTrigger className="border-2 focus:border-accent">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity" className="text-sm font-medium">Quantity *</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                  placeholder="1"
                  className="border-2 focus:border-accent"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit" className="text-sm font-medium">Unit</Label>
                <Select value={formData.unit} onValueChange={(value) => setFormData({...formData, unit: value})}>
                  <SelectTrigger className="border-2 focus:border-accent">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map(unit => (
                      <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="price" className="text-sm font-medium flex items-center gap-1">
                  <IndianRupee className="h-4 w-4" />
                  Price (₹) *
                </Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  placeholder="30"
                  className="border-2 focus:border-accent"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description" className="text-sm font-medium">Description (Auto-generated if empty)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="AI will create an attractive description automatically..."
                  className="border-2 focus:border-accent min-h-[80px]"
                />
              </div>
            </div>

            <Button type="submit" className="w-full bg-gradient-primary hover:opacity-90 h-12 text-lg">
              <Plus className="h-5 w-5 mr-2" />
              Add Product to Catalog
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}

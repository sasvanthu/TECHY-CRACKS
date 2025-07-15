import { useState, useEffect } from 'react';
import { Package, Users, TrendingUp, IndianRupee, Search, Grid, List } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProductForm } from './ProductForm';
import { ProductCard } from './ProductCard';
import { CatalogExport } from './CatalogExport';
import { LanguageSelector, SUPPORTED_LANGUAGES } from './LanguageSelector';
import { toast } from '@/hooks/use-toast';

interface Product {
  id: string;
  name: string;
  price: string;
  quantity: string;
  unit: string;
  category: string;
  description: string;
}

interface CatalogManagerProps {
  className?: string;
}

export function CatalogManager({ className = "" }: CatalogManagerProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [businessName, setBusinessName] = useState('My Farm Shop');

  // Load from localStorage on mount
  useEffect(() => {
    const savedProducts = localStorage.getItem('catalog_products');
    const savedBusinessName = localStorage.getItem('business_name');
    
    if (savedProducts) {
      setProducts(JSON.parse(savedProducts));
    }
    if (savedBusinessName) {
      setBusinessName(savedBusinessName);
    }

    // Detect browser language
    const browserLang = navigator.language.split('-')[0];
    const supportedLang = SUPPORTED_LANGUAGES.find(lang => lang.code === browserLang);
    if (supportedLang) {
      setSelectedLanguage(browserLang);
    }
  }, []);

  // Save to localStorage whenever products change
  useEffect(() => {
    localStorage.setItem('catalog_products', JSON.stringify(products));
  }, [products]);

  // Save business name
  useEffect(() => {
    localStorage.setItem('business_name', businessName);
  }, [businessName]);

  const handleAddProduct = (newProduct: Product) => {
    setProducts(prev => [newProduct, ...prev]);
    toast({
      title: "Product Added! 🎉",
      description: `${newProduct.name} is now in your catalog`,
    });
  };

  const handleUpdateProduct = (id: string, updatedProduct: Partial<Product>) => {
    setProducts(prev => prev.map(product => 
      product.id === id ? { ...product, ...updatedProduct } : product
    ));
  };

  const handleDeleteProduct = (id: string) => {
    setProducts(prev => prev.filter(product => product.id !== id));
  };

  // Filter products based on search and category
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Get unique categories
  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];

  // Calculate stats
  const totalProducts = products.length;
  const totalValue = products.reduce((sum, product) => 
    sum + (parseFloat(product.price) * parseFloat(product.quantity)), 0
  );
  const topCategory = products.length > 0 
    ? Object.entries(products.reduce((acc, product) => {
        acc[product.category] = (acc[product.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)).sort(([,a], [,b]) => b - a)[0]?.[0] || 'None'
    : 'None';

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3 mb-4">
          <span className="text-6xl">🏪</span>
          <div>
            <Input
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="text-4xl md:text-5xl font-bold text-center border-0 bg-transparent focus:border-accent focus:bg-background/50 h-auto p-2"
              placeholder="Your Business Name"
            />
            <p className="text-xl text-muted-foreground mt-2">
              Smart Catalog Assistant
            </p>
          </div>
          <span className="text-6xl">📱</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-primary/10 border-2 border-primary/20">
          <div className="flex items-center gap-3">
            <Package className="h-8 w-8 text-primary" />
            <div>
              <div className="text-2xl font-bold text-primary">{totalProducts}</div>
              <div className="text-sm text-muted-foreground">Total Products</div>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-accent/10 border-2 border-accent/20">
          <div className="flex items-center gap-3">
            <IndianRupee className="h-8 w-8 text-accent" />
            <div>
              <div className="text-2xl font-bold text-accent">₹{totalValue.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Catalog Value</div>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-surface border-2">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-success" />
            <div>
              <div className="text-xl font-bold text-foreground">{topCategory}</div>
              <div className="text-sm text-muted-foreground">Top Category</div>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-surface border-2">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-muted-foreground" />
            <div>
              <div className="text-xl font-bold text-foreground">{categories.length - 1}</div>
              <div className="text-sm text-muted-foreground">Categories</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Language Selector */}
      <div className="flex justify-center">
        <LanguageSelector
          selectedLanguage={selectedLanguage}
          onLanguageChange={setSelectedLanguage}
          className="text-lg"
        />
      </div>

      {/* Product Form */}
      <ProductForm
        onAddProduct={handleAddProduct}
        selectedLanguage={selectedLanguage}
      />

      {/* Export Section */}
      <CatalogExport
        products={products}
        businessName={businessName}
      />

      {/* Products Section */}
      {products.length > 0 && (
        <div className="space-y-6">
          {/* Filters and Search */}
          <Card className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="pl-10 border-2 focus:border-accent"
                />
              </div>

              <div className="flex gap-2 flex-wrap">
                {categories.map(category => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                    className={selectedCategory === category ? "bg-accent" : ""}
                  >
                    {category}
                  </Button>
                ))}
              </div>

              <div className="flex gap-1 border rounded-lg p-1">
                <Button
                  variant={viewMode === 'grid' ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>

          {/* Products Grid/List */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-foreground">
                📦 Your Products ({filteredProducts.length})
              </h2>
              {searchQuery && (
                <Badge variant="outline" className="text-sm">
                  Filtering: "{searchQuery}"
                </Badge>
              )}
            </div>

            {filteredProducts.length > 0 ? (
              <div className={`
                ${viewMode === 'grid' 
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
                  : 'space-y-4'
                }
              `}>
                {filteredProducts.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onUpdate={handleUpdateProduct}
                    onDelete={handleDeleteProduct}
                    selectedLanguage={selectedLanguage}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <p className="text-xl text-muted-foreground">
                  No products found matching your search
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('All');
                  }}
                  className="mt-4"
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {products.length === 0 && (
        <Card className="p-12 text-center bg-gradient-surface">
          <div className="space-y-4">
            <div className="text-8xl">🛒</div>
            <h3 className="text-2xl font-bold text-foreground">
              Start Building Your Catalog
            </h3>
            <p className="text-lg text-muted-foreground max-w-md mx-auto">
              Add your first product using voice input or the manual form above. 
              Your catalog will be saved automatically!
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}

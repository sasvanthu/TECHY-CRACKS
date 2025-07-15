import { CatalogManager } from '@/components/CatalogManager';

const Index = () => {

  return (
    <div className="min-h-screen bg-gradient-surface">
      {/* Smart Catalog Header */}
      <header className="bg-card/90 backdrop-blur-sm border-b border-border/50 shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-4xl">🤖</div>
              <div>
                <span className="text-2xl font-bold text-foreground">Smart Catalog Assistant</span>
                <p className="text-sm text-muted-foreground">AI-powered catalog builder for small sellers</p>
              </div>
            </div>
            <nav className="hidden md:flex space-x-6">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors text-lg">🏠 Dashboard</a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors text-lg">📦 Products</a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors text-lg">📤 Export</a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors text-lg">💬 Help</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <CatalogManager />
      </main>

      {/* Seller-Friendly Footer */}
      <footer className="bg-card/80 backdrop-blur-sm border-t border-border/30 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="grid md:grid-cols-4 gap-6">
            <div>
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <span className="text-xl">🤖</span> Smart Catalog Assistant
              </h3>
              <p className="text-sm text-muted-foreground">
                AI-powered catalog creation for farmers, artisans, and small shop owners. Just speak and we'll build your catalog!
              </p>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-3">🎙️ Voice Features</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Say "Add 1kg tomatoes 30 rupees"</li>
                <li>• Auto-generate descriptions</li>
                <li>• Multi-language support</li>
                <li>• Instant catalog updates</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-3">📤 Export Options</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>💬 WhatsApp sharing</li>
                <li>📄 PDF catalogs</li>
                <li>📊 CSV export</li>
                <li>🌐 Online marketplaces</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-3">👥 Perfect For</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>🧑‍🌾 Farmers & Producers</li>
                <li>🎨 Artisans & Crafters</li>
                <li>🛒 Kirana Shop Owners</li>
                <li>🏪 Small Business Owners</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border/30 mt-6 pt-6 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 Smart Catalog Assistant. Empowering small sellers with AI technology.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;

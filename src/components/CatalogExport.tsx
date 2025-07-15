import { Download, Share2, FileText, Image, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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

interface CatalogExportProps {
  products: Product[];
  businessName?: string;
  className?: string;
}

export function CatalogExport({ products, businessName = "My Business", className = "" }: CatalogExportProps) {
  
  const generateWhatsAppCatalog = () => {
    if (products.length === 0) {
      toast({
        title: "No Products",
        description: "Add some products to your catalog first",
        variant: "destructive"
      });
      return;
    }

    let message = `🛍️ *${businessName} - Product Catalog*\n\n`;
    
    const groupedProducts = products.reduce((acc, product) => {
      if (!acc[product.category]) {
        acc[product.category] = [];
      }
      acc[product.category].push(product);
      return acc;
    }, {} as Record<string, Product[]>);

    Object.entries(groupedProducts).forEach(([category, categoryProducts]) => {
      message += `📦 *${category}*\n`;
      categoryProducts.forEach((product, index) => {
        message += `${index + 1}. *${product.name}*\n`;
        message += `   💰 ₹${product.price} per ${product.quantity}${product.unit}\n`;
        message += `   📝 ${product.description}\n\n`;
      });
      message += `\n`;
    });

    message += `📞 *Contact us to place your order!*\n`;
    message += `💬 WhatsApp: [Your Number]\n`;
    message += `📧 Email: [Your Email]`;

    // Copy to clipboard
    navigator.clipboard.writeText(message).then(() => {
      toast({
        title: "Copied to Clipboard!",
        description: "Paste in WhatsApp to share your catalog",
      });
    }).catch(() => {
      toast({
        title: "Copy Failed",
        description: "Please try again",
        variant: "destructive"
      });
    });
  };

  const generatePDFCatalog = () => {
    if (products.length === 0) {
      toast({
        title: "No Products",
        description: "Add some products to create PDF catalog",
        variant: "destructive"
      });
      return;
    }

    // Create a simple HTML version for printing/PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${businessName} - Product Catalog</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .category { margin-bottom: 25px; }
          .category-title { background: #f0f0f0; padding: 10px; font-weight: bold; font-size: 18px; }
          .product { border: 1px solid #ddd; margin: 10px 0; padding: 15px; border-radius: 5px; }
          .product-name { font-weight: bold; font-size: 16px; color: #2563eb; }
          .product-price { font-size: 18px; color: #dc2626; font-weight: bold; }
          .product-desc { margin-top: 5px; color: #666; }
          @media print { .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🛍️ ${businessName}</h1>
          <h2>Product Catalog</h2>
          <p>📅 Generated on: ${new Date().toLocaleDateString()}</p>
        </div>
        
        ${Object.entries(products.reduce((acc, product) => {
          if (!acc[product.category]) acc[product.category] = [];
          acc[product.category].push(product);
          return acc;
        }, {} as Record<string, Product[]>)).map(([category, categoryProducts]) => `
          <div class="category">
            <div class="category-title">📦 ${category}</div>
            ${categoryProducts.map(product => `
              <div class="product">
                <div class="product-name">${product.name}</div>
                <div class="product-price">₹${product.price} per ${product.quantity}${product.unit}</div>
                <div class="product-desc">${product.description}</div>
              </div>
            `).join('')}
          </div>
        `).join('')}
        
        <div style="margin-top: 30px; text-align: center; border-top: 1px solid #ddd; padding-top: 20px;">
          <p><strong>📞 Contact us to place your order!</strong></p>
          <p>💬 WhatsApp: [Your Number] | 📧 Email: [Your Email]</p>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.print();
      
      toast({
        title: "PDF Ready!",
        description: "Print or save as PDF from the new window",
      });
    }
  };

  const generateCSVExport = () => {
    if (products.length === 0) {
      toast({
        title: "No Products",
        description: "Add some products to export CSV",
        variant: "destructive"
      });
      return;
    }

    const csvHeader = "Name,Category,Quantity,Unit,Price,Description\n";
    const csvContent = products.map(product => 
      `"${product.name}","${product.category}","${product.quantity}","${product.unit}","${product.price}","${product.description}"`
    ).join('\n');

    const fullCSV = csvHeader + csvContent;
    const blob = new Blob([fullCSV], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${businessName.toLowerCase().replace(/\s+/g, '_')}_catalog.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "CSV Downloaded!",
      description: "Your catalog has been saved as CSV file",
    });
  };

  const shareOnline = () => {
    if (products.length === 0) {
      toast({
        title: "No Products",
        description: "Add some products to share online",
        variant: "destructive"
      });
      return;
    }

    // Create a simple JSON representation for sharing
    const catalogData = {
      businessName,
      products,
      generatedAt: new Date().toISOString(),
      totalProducts: products.length
    };

    const jsonString = JSON.stringify(catalogData, null, 2);
    navigator.clipboard.writeText(jsonString).then(() => {
      toast({
        title: "Catalog Data Copied!",
        description: "Share this data with marketplaces or your website developer",
      });
    });
  };

  return (
    <Card className={`p-6 bg-gradient-surface border-2 border-accent/20 ${className}`}>
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-foreground mb-2">📤 Share Your Catalog</h3>
          <p className="text-muted-foreground">
            Export and share your catalog in different formats
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button
            onClick={generateWhatsAppCatalog}
            variant="outline"
            className="h-20 flex-col gap-2 border-2 hover:border-green-500 hover:bg-green-50"
          >
            <div className="text-2xl">💬</div>
            <div className="text-center">
              <div className="font-semibold">WhatsApp</div>
              <div className="text-xs text-muted-foreground">Copy & Share</div>
            </div>
          </Button>

          <Button
            onClick={generatePDFCatalog}
            variant="outline"
            className="h-20 flex-col gap-2 border-2 hover:border-red-500 hover:bg-red-50"
          >
            <FileText className="h-6 w-6" />
            <div className="text-center">
              <div className="font-semibold">PDF Catalog</div>
              <div className="text-xs text-muted-foreground">Print Ready</div>
            </div>
          </Button>

          <Button
            onClick={generateCSVExport}
            variant="outline"
            className="h-20 flex-col gap-2 border-2 hover:border-blue-500 hover:bg-blue-50"
          >
            <Download className="h-6 w-6" />
            <div className="text-center">
              <div className="font-semibold">CSV Export</div>
              <div className="text-xs text-muted-foreground">For Spreadsheets</div>
            </div>
          </Button>

          <Button
            onClick={shareOnline}
            variant="outline"
            className="h-20 flex-col gap-2 border-2 hover:border-purple-500 hover:bg-purple-50"
          >
            <ExternalLink className="h-6 w-6" />
            <div className="text-center">
              <div className="font-semibold">Online Share</div>
              <div className="text-xs text-muted-foreground">Copy Data</div>
            </div>
          </Button>
        </div>

        {products.length > 0 && (
          <div className="text-center text-sm text-muted-foreground">
            📊 {products.length} products ready to share
          </div>
        )}
      </div>
    </Card>
  );
}

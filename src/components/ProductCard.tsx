import { useState } from 'react';
                  type="number"
                  value={editData.price}
                  onChange={(e) => setEditData({...editData, price: e.target.value})}
                  placeholder="Price"
                  className="border-0 bg-transparent p-0 h-auto focus:ring-0"
                />
              </div>
            </div>

            <Textarea
              value={editData.description}
              onChange={(e) => setEditData({...editData, description: e.target.value})}
              placeholder="Product description"
              className="min-h-[80px] border-2 focus:border-accent"
            />

            <div className="flex gap-2">
              <Button onClick={handleSave} className="bg-accent hover:bg-accent/90">
                Save Changes
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <h3 className="text-xl font-bold text-foreground">{product.name}</h3>
            
            <div className="flex items-center gap-4 text-lg">
              <div className="flex items-center gap-1">
                <Package className="h-5 w-5 text-muted-foreground" />
                <span className="font-semibold">{product.quantity}</span>
                <span className="text-muted-foreground">{product.unit}</span>
              </div>
              <div className="flex items-center gap-1 text-accent font-bold">
                <IndianRupee className="h-5 w-5" />
                <span className="text-2xl">{product.price}</span>
              </div>
            </div>

            <p className="text-muted-foreground leading-relaxed">{product.description}</p>
          </div>
        )}
      </div>
    </Card>
  );
}

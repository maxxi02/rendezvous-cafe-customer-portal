'use client';

import { Plus, Sparkles } from 'lucide-react';

export interface AddonItem {
  name: string;
  price: number;
}

export interface AddonGroup {
  name: string;
  required: boolean;
  multiSelect: boolean;
  items: AddonItem[];
}

export interface MenuItem {
  _id: string;
  name: string;
  price: number;
  description?: string;
  imageUrl?: string;
  category?: string;
  menuType?: 'food' | 'drink';
  ingredients: Array<{ name: string; quantity: string; unit: string }>;
  available: boolean;
  addonGroups?: AddonGroup[];
}

interface MenuCardProps {
  product: MenuItem;
  onAdd: (product: MenuItem) => void;
  onOpenAddons: (product: MenuItem) => void;
  cartQuantity?: number;
}

export function MenuCard({ product, onAdd, onOpenAddons, cartQuantity = 0 }: MenuCardProps) {
  const hasAddons = (product.addonGroups?.length ?? 0) > 0;

  const handleAdd = () => {
    if (hasAddons) onOpenAddons(product);
    else onAdd(product);
  };

  return (
    <div className="group relative rounded-2xl overflow-hidden bg-card border border-white/10 hover:border-primary/50 active:scale-[0.98] transition-all duration-300 hover:shadow-xl hover:shadow-black/40 hover:-translate-y-1 touch-manipulation">
      {/* Image */}
      <div className="relative h-36 sm:h-44 overflow-hidden">
        {cartQuantity > 0 && (
          <div className="absolute top-2 right-2 z-10 bg-primary text-background font-black text-xs h-6 min-w-[24px] px-1.5 rounded-full flex items-center justify-center shadow-lg shadow-primary/30 border-2 border-background">
            {cartQuantity}
          </div>
        )}
        {/* Customize badge */}
        {hasAddons && (
          <div className="absolute top-2 left-2 z-10 flex items-center gap-1 bg-background/80 backdrop-blur-sm border border-primary/40 text-primary text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">
            <Sparkles className="w-2.5 h-2.5" />
            Customize
          </div>
        )}
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-background flex items-center justify-center text-4xl sm:text-5xl">
            {product.menuType === 'drink' ? '☕' : '🍽️'}
          </div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="p-3 sm:p-4">
        <h3 className="font-black text-white text-xs sm:text-sm uppercase tracking-wide leading-tight line-clamp-1">
          {product.name}
        </h3>
        {product.description && (
          <p className="text-white/40 text-xs mt-0.5 sm:mt-1 line-clamp-2 font-medium hidden sm:block">
            {product.description}
          </p>
        )}
        <div className="flex items-center justify-between mt-2 sm:mt-4">
          <span className="text-primary font-black text-base sm:text-lg">
            ₱{product.price.toFixed(2)}
          </span>
          <button
            onClick={handleAdd}
            aria-label={`Add ${product.name} to cart`}
            className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-primary text-background flex items-center justify-center hover:bg-white hover:scale-110 active:scale-95 transition-all duration-200 shadow-lg shadow-primary/30 touch-manipulation"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
          </button>
        </div>
      </div>
    </div>
  );
}
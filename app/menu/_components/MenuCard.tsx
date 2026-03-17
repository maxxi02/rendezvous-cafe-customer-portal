'use client';

import { Plus } from 'lucide-react';

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
}

interface MenuCardProps {
    product: MenuItem;
    onAdd: (product: MenuItem) => void;
    cartQuantity?: number;
}

export function MenuCard({ product, onAdd, cartQuantity = 0 }: MenuCardProps) {
    return (
        <div className="group relative rounded-2xl overflow-hidden bg-card border border-white/10 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-black/40 hover:-translate-y-1">
            {/* Image */}
            <div className="relative h-44 overflow-hidden">
                {cartQuantity > 0 && (
                    <div className="absolute top-3 right-3 z-10 bg-primary text-background font-black text-xs h-7 min-w-[28px] px-2 rounded-full flex items-center justify-center shadow-lg shadow-primary/30 border-2 border-background">
                        {cartQuantity}
                    </div>
                )}
                {product.imageUrl ? (
                    <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full bg-background flex items-center justify-center text-5xl">
                        {product.menuType === 'drink' ? '☕' : '🍽️'}
                    </div>
                )}
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
            </div>

            {/* Content */}
            <div className="p-4">
                <h3 className="font-black text-white text-sm uppercase tracking-wide leading-tight line-clamp-1">
                    {product.name}
                </h3>
                {product.description && (
                    <p className="text-white/40 text-xs mt-1 line-clamp-2 font-medium">
                        {product.description}
                    </p>
                )}
                <div className="flex items-center justify-between mt-4">
                    <span className="text-primary font-black text-lg">
                        ₱{product.price.toFixed(2)}
                    </span>
                    <button
                        onClick={() => onAdd(product)}
                        className="h-9 w-9 rounded-full bg-primary text-background flex items-center justify-center hover:bg-white hover:scale-110 active:scale-95 transition-all duration-200 shadow-lg shadow-primary/30"
                    >
                        <Plus className="w-4 h-4 stroke-[3]" />
                    </button>
                </div>
            </div>
        </div >
    );
}
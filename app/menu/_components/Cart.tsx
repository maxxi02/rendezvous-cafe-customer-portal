'use client';

import { Minus, Plus, Trash2, ShoppingCart, X } from 'lucide-react';
import { CustomerOrderItem } from '@/app/types/order.type';

interface CartProps {
    items: CustomerOrderItem[];
    onUpdate: (id: string, change: number) => void;
    onRemove: (id: string) => void;
    onClose: () => void;
    onCheckout: () => void;
}

export function Cart({ items, onUpdate, onRemove, onClose, onCheckout }: CartProps) {
    const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

    return (
        <>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
                <div>
                    <h2 className="text-white font-black text-lg uppercase tracking-widest">Your Order</h2>
                    <p className="text-white/40 text-xs mt-0.5">{items.length} item{items.length !== 1 ? 's' : ''}</p>
                </div>
                <button
                    onClick={onClose}
                    className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 max-h-[calc(100vh-300px)]">
                {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-white/30 py-16">
                        <ShoppingCart className="h-12 w-12 mb-3" />
                        <p className="text-sm font-medium uppercase tracking-widest">Cart is empty</p>
                    </div>
                ) : (
                    items.map(item => (
                        <div key={item._id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                            {item.imageUrl && (
                                <img src={item.imageUrl} alt={item.name} className="h-12 w-12 rounded-lg object-cover flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-white text-sm truncate uppercase tracking-wide">{item.name}</p>
                                <p className="text-primary text-xs font-bold mt-0.5">
                                    ₱{(item.price * item.quantity).toFixed(2)}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => onUpdate(item._id, -1)}
                                    className="h-7 w-7 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                                >
                                    <Minus className="w-3 h-3" />
                                </button>
                                <span className="text-white font-bold text-sm w-4 text-center">{item.quantity}</span>
                                <button
                                    onClick={() => onUpdate(item._id, 1)}
                                    className="h-7 w-7 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                                >
                                    <Plus className="w-3 h-3" />
                                </button>
                                <button
                                    onClick={() => onRemove(item._id)}
                                    className="h-7 w-7 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 hover:bg-red-500/30 transition-colors ml-1"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
                <div className="px-6 py-5 border-t border-white/10 space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-white/60 font-medium uppercase tracking-widest text-xs">Total</span>
                        <span className="text-primary font-black text-2xl">₱{total.toFixed(2)}</span>
                    </div>
                    <button
                        onClick={onCheckout}
                        className="w-full bg-primary text-background py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-white active:scale-95 transition-all duration-200 shadow-lg shadow-primary/20"
                    >
                        Place Order
                    </button>
                </div>
            )}
        </>
    );
}
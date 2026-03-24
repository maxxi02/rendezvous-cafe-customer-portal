'use client';

import { Minus, Plus, Trash2, ShoppingCart, X } from 'lucide-react';
import { CustomerOrderItem } from '@/app/types/order.type';
import { useState } from 'react';

interface CartProps {
    items: CustomerOrderItem[];
    onUpdate: (id: string, change: number) => void;
    onRemove: (id: string) => void;
    onClose: () => void;
    onCheckout: () => void;
}

export function Cart({ items, onUpdate, onRemove, onClose, onCheckout }: CartProps) {
    const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const [showConfirm, setShowConfirm] = useState(false);

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 border-b border-white/10 shrink-0">
                <div>
                    <h2 className="text-white font-black text-base sm:text-lg uppercase tracking-widest">Your Order</h2>
                    <p className="text-white/40 text-xs mt-0.5">{items.length} item{items.length !== 1 ? 's' : ''}</p>
                </div>
                <button
                    onClick={onClose}
                    aria-label="Close cart"
                    className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 active:scale-95 transition-colors touch-manipulation"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Items — scrollable, fills remaining space */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-3 sm:py-4 space-y-2 sm:space-y-3 overscroll-contain">
                {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-white/30 py-16">
                        <ShoppingCart className="h-10 w-10 sm:h-12 sm:w-12 mb-3" />
                        <p className="text-sm font-medium uppercase tracking-widest">Cart is empty</p>
                    </div>
                ) : (
                    items.map(item => (
                        <div key={item._id} className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl bg-white/5 border border-white/10">
                            {item.imageUrl && (
                                <img src={item.imageUrl} alt={item.name} className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg object-cover flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-white text-xs sm:text-sm truncate uppercase tracking-wide leading-tight">{item.name}</p>
                                <p className="text-primary text-xs font-bold mt-0.5">
                                    ₱{(item.price * item.quantity).toFixed(2)}
                                </p>
                            </div>
                            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                                <button
                                    onClick={() => onUpdate(item._id, -1)}
                                    aria-label="Decrease"
                                    className="h-7 w-7 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 active:scale-95 transition-colors touch-manipulation"
                                >
                                    <Minus className="w-3 h-3" />
                                </button>
                                <span className="text-white font-bold text-sm w-5 text-center">{item.quantity}</span>
                                <button
                                    onClick={() => onUpdate(item._id, 1)}
                                    aria-label="Increase"
                                    className="h-7 w-7 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 active:scale-95 transition-colors touch-manipulation"
                                >
                                    <Plus className="w-3 h-3" />
                                </button>
                                <button
                                    onClick={() => onRemove(item._id)}
                                    aria-label="Remove"
                                    className="h-7 w-7 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 hover:bg-red-500/30 active:scale-95 transition-colors ml-1 touch-manipulation"
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
                <div className="px-4 sm:px-6 py-4 sm:py-5 border-t border-white/10 space-y-3 shrink-0">
                    <div className="flex justify-between items-center">
                        <span className="text-white/60 font-medium uppercase tracking-widest text-xs">Total</span>
                        <span className="text-primary font-black text-xl sm:text-2xl">₱{total.toFixed(2)}</span>
                    </div>
                    <button
                        onClick={() => setShowConfirm(true)}
                        className="w-full bg-primary text-background py-3.5 sm:py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-white active:scale-95 transition-all duration-200 shadow-lg shadow-primary/20 touch-manipulation"
                    >
                        Place Order
                    </button>
                </div>
            )}

            {/* Confirm Modal */}
            {showConfirm && (
                <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <div className="w-full max-w-sm bg-background border border-white/10 rounded-3xl p-6 shadow-2xl text-center">
                        <h3 className="text-white font-black text-lg sm:text-xl uppercase tracking-widest mb-3">
                            Confirm Order
                        </h3>
                        <p className="text-white/60 text-sm mb-6 sm:mb-8">
                            Are you sure you want to pay or edit your order?
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowConfirm(false)}
                                className="flex-1 bg-white/10 text-white py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/20 active:scale-95 transition-all duration-200 touch-manipulation"
                            >
                                Edit
                            </button>
                            <button
                                onClick={() => { setShowConfirm(false); onCheckout(); }}
                                className="flex-1 bg-primary text-background py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white active:scale-95 transition-all duration-200 shadow-lg shadow-primary/20 touch-manipulation"
                            >
                                Proceed
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
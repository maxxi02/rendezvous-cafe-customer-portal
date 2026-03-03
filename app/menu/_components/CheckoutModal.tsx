'use client';

import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { CustomerOrder, CustomerOrderItem } from '@/app/types/order.type';

interface SessionData {
    customerName: string;
    tableId?: string;
    qrType: string;
    isAnonymous: boolean;
}

interface CheckoutModalProps {
    items: CustomerOrderItem[];
    total: number;
    onClose: () => void;
    onConfirm: (order: CustomerOrder) => Promise<void>;
    sessionData?: SessionData | null;
}

export function CheckoutModal({ items, total, onClose, onConfirm, sessionData }: CheckoutModalProps) {
    const isGuest = !sessionData || sessionData.isAnonymous;
    const [customerName, setCustomerName] = useState(sessionData?.customerName || (isGuest ? 'Guest' : ''));
    const [orderType, setOrderType] = useState<'dine-in' | 'takeaway'>(sessionData?.tableId ? 'dine-in' : 'takeaway');
    const [tableNumber, setTableNumber] = useState(sessionData?.tableId || '');
    const [orderNote, setOrderNote] = useState('');
    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        if (!customerName.trim()) {
            alert('Please enter your name');
            return;
        }

        setLoading(true);
        try {
            const order: CustomerOrder = {
                orderId: `customer-${Date.now()}`,
                customerName: customerName.trim(),
                items,
                orderNote: orderNote.trim() || undefined,
                orderType,
                tableNumber: orderType === 'dine-in' ? tableNumber.trim() : undefined,
                subtotal: total,
                total,
                timestamp: new Date(),
            };
            await onConfirm(order);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="w-full max-w-md bg-background rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
                {/* Amber top bar */}
                <div className="h-1 w-full bg-gradient-to-r from-primary via-primary/50 to-primary" />

                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-6 pb-4">
                    <div>
                        <h2 className="text-white font-black text-xl uppercase tracking-widest">Confirm Order</h2>
                        <p className="text-white/40 text-xs mt-1">{items.length} item(s) · ₱{total.toFixed(2)}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Order summary */}
                <div className="mx-6 mb-4 bg-white/5 rounded-2xl p-3 max-h-32 overflow-y-auto border border-white/10">
                    {items.map(item => (
                        <div key={item._id} className="flex justify-between text-sm py-1">
                            <span className="text-white/70 font-medium">{item.name} × {item.quantity}</span>
                            <span className="text-primary font-bold">₱{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                    ))}
                </div>

                <div className="px-6 pb-6 space-y-4">
                    {/* Table number display if available */}
                    {sessionData?.tableId && (
                        <div>
                            <label className="text-white/50 text-xs font-bold uppercase tracking-widest mb-2 block">Your Table</label>
                            <div className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-white/50 text-sm font-medium">
                                Table {sessionData.tableId}
                            </div>
                        </div>
                    )}

                    {/* Notes */}

                    {/* Notes */}
                    <div>
                        <label className="text-white/50 text-xs font-bold uppercase tracking-widest mb-2 block">Special Instructions</label>
                        <textarea
                            value={orderNote}
                            onChange={e => setOrderNote(e.target.value)}
                            placeholder="Any special requests?"
                            rows={2}
                            className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-primary/50 focus:bg-white/15 transition-all resize-none"
                        />
                    </div>

                    {/* Confirm button */}
                    <button
                        onClick={handleConfirm}
                        disabled={loading || !customerName.trim()}
                        className="w-full bg-primary text-background py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                    >
                        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Placing Order...</> : 'Confirm Order →'}
                    </button>
                </div>
            </div>
        </div>
    );
}
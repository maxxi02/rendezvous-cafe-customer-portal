'use client';

import { useState } from 'react';
import { X, Loader2, Smartphone } from 'lucide-react';
import { CustomerOrder, CustomerOrderItem } from '@/app/types/order.type';

interface SessionData {
    customerName: string;
    tableId?: string;
    qrType: string;
    isAnonymous: boolean;
    sessionId?: string;
}

interface CheckoutModalProps {
    items: CustomerOrderItem[];
    total: number;
    onClose: () => void;
    onConfirm: (order: CustomerOrder) => Promise<void>;
    sessionData?: SessionData | null;
}

export function CheckoutModal({ items, total, onClose, onConfirm, sessionData }: CheckoutModalProps) {
    const [orderNote, setOrderNote] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const customerName = sessionData?.customerName || 'Guest';
    const tableId = sessionData?.tableId;
    const sessionId = sessionData?.sessionId;

    const handleGCashPay = async () => {
        setLoading(true);
        setError(null);

        try {
            // 1. Build the order object (will be saved to DB by the server on order:submit)
            const orderId = `customer-${Date.now()}`;
            const order: CustomerOrder = {
                orderId,
                customerName,
                items,
                orderNote: orderNote.trim() || undefined,
                orderType: tableId ? 'dine-in' : 'takeaway',
                tableNumber: tableId || undefined,
                subtotal: total,
                total,
                timestamp: new Date(),
            };

            // 2. Submit the order first via the existing socket flow
            //    The server saves it as pending_payment until GCash confirms.
            await onConfirm(order);

            // 3. Create a PayMongo GCash Source to get the redirect URL
            const res = await fetch('/api/payment/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId,
                    sessionId: sessionId || orderId,
                    amount: total,
                    customerName,
                    description: `Order ${orderId}`,
                }),
            });

            const data = await res.json();

            if (!res.ok || !data.checkoutUrl) {
                throw new Error(data.error || 'Failed to create GCash payment');
            }

            // 4. Redirect to GCash checkout
            window.location.href = data.checkoutUrl;
        } catch (err: any) {
            setError(err.message || 'Something went wrong. Please try again.');
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
                        <h2 className="text-white font-black text-xl uppercase tracking-widest">Confirm & Pay</h2>
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
                    {/* Table info */}
                    {tableId && (
                        <div className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3 border border-white/10">
                            <span className="text-white/40 text-xs font-bold uppercase tracking-widest">Table</span>
                            <span className="text-white font-bold">{tableId}</span>
                        </div>
                    )}

                    {/* Customer name */}
                    <div className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3 border border-white/10">
                        <span className="text-white/40 text-xs font-bold uppercase tracking-widest">Name</span>
                        <span className="text-white font-medium">{customerName}</span>
                    </div>

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

                    {/* Error */}
                    {error && (
                        <p className="text-red-400 text-xs text-center bg-red-500/10 rounded-xl px-4 py-2 border border-red-500/20">
                            {error}
                        </p>
                    )}

                    {/* Total */}
                    <div className="flex items-center justify-between py-3 border-t border-white/10">
                        <span className="text-white/50 text-sm uppercase tracking-widest font-bold">Total</span>
                        <span className="text-primary font-black text-2xl">₱{total.toFixed(2)}</span>
                    </div>

                    {/* GCash Pay button */}
                    <button
                        onClick={handleGCashPay}
                        disabled={loading}
                        className="w-full bg-blue-500 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-400 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all duration-200 flex items-center justify-center gap-3 shadow-lg shadow-blue-500/20"
                    >
                        {loading ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Redirecting to GCash…</>
                        ) : (
                            <><Smartphone className="w-4 h-4" /> Pay with GCash</>
                        )}
                    </button>

                    <p className="text-center text-white/20 text-[11px]">
                        You will be redirected to GCash to complete your payment.
                    </p>
                </div>
            </div>
        </div>
    );
}
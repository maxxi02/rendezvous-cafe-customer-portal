'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChefHat, Loader2 } from 'lucide-react';
import { CustomerChat } from '../chat/CustomerChat';
import { useSocket } from '../../providers/socket-provider';

interface SessionData {
    customerName: string;
    tableId?: string;
    qrType: string;
    isAnonymous: boolean;
    lastOrderId?: string;
}

export default function WaitingPage() {
    const router = useRouter();
    const {
        socket,
        onOrderSubmitted,
        onOrderStatusChanged,
        offOrderSubmitted,
        offOrderStatusChanged
    } = useSocket();

    const [sessionData, setSessionData] = useState<SessionData | null>(null);
    const [showChat, setShowChat] = useState(false);

    useEffect(() => {
        const stored = sessionStorage.getItem("orderSession");
        if (stored) {
            try {
                setSessionData(JSON.parse(stored));
            } catch (e) {
                console.error("Failed to parse session data", e);
            }
        } else {
            // If no session exists, back to home
            router.replace('/order');
        }
    }, [router]);

    // Real-time order status updates via Socket
    const [queueStatus, setQueueStatus] = useState<string | null>(null);

    useEffect(() => {
        if (!socket) return;

        onOrderSubmitted?.((data) => {
            console.log("Order submitted event received:", data);
            setQueueStatus(data.queueStatus);
        });

        onOrderStatusChanged?.((data) => {
            console.log("Order status changed event received:", data);
            setQueueStatus(data.queueStatus);
        });

        return () => {
            offOrderSubmitted?.();
            offOrderStatusChanged?.();
        };
    }, [socket, onOrderSubmitted, offOrderSubmitted, onOrderStatusChanged, offOrderStatusChanged]);

    if (!sessionData) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-6">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-start pt-12 p-6 overflow-x-hidden">
            {/* Ambient Background Effect */}
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="relative z-10 max-w-lg w-full space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 mt-8">
                {/* Status Column */}
                <div className="flex flex-col items-center text-center space-y-5">
                    <div className="relative">
                        <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
                        <div className="relative bg-background border border-primary/30 w-20 h-20 rounded-full flex items-center justify-center shadow-2xl shadow-primary/20">
                            <ChefHat className="w-8 h-8 text-primary" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-widest text-white">
                            {queueStatus === "preparing" ? "In The Kitchen" : queueStatus === "ready" ? "Order Ready!" : queueStatus === "served" ? "Enjoy Your Meal" : "Order Received"}
                            <span className="text-primary">.</span>
                        </h1>
                        <p className="text-white/60 text-sm leading-relaxed max-w-[280px] mx-auto">
                            {queueStatus === "preparing" ? "Our chefs are cooking up your order right now."
                                : queueStatus === "ready" ? "Your order is ready to be collected or will be served shortly!"
                                    : sessionData.tableId
                                        ? `The kitchen is preparing your order for Table ${sessionData.tableId}.`
                                        : 'Sit tight! The kitchen has received your order.'}
                        </p>
                    </div>
                </div>

                {/* Inline Chat Component Toggle */}
                <div className="w-full flex flex-col items-center gap-4">
                    <button
                        onClick={() => setShowChat(!showChat)}
                        className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest border border-white/10 transition-all active:scale-95"
                    >
                        {showChat ? 'Hide Staff Chat' : 'Open Staff Chat'}
                    </button>

                    {showChat && (
                        <div className="w-full animate-in slide-in-from-top-4 fade-in duration-300">
                            <CustomerChat
                                sessionId={sessionData.tableId || "guest-session-" + sessionData.customerName}
                                customerName={sessionData.customerName}
                                tableId={sessionData.tableId}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ChefHat, UtensilsCrossed, CheckCircle, Loader2, Package } from 'lucide-react';
import { CustomerChat } from '../chat/CustomerChat';
import { useSocket } from '../../providers/socket-provider';

interface SessionData {
    customerName: string;
    tableId?: string;
    qrType: string;
    isAnonymous: boolean;
    lastOrderId?: string;
}

// ─── Sound player ────────────────────────────────────────────────────────────
function playNotificationSound() {
    try {
        const settings = JSON.parse(localStorage.getItem('portalNotifSettings') || '{}');
        if (settings.sound === false) return;
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.4, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.6);
    } catch { /* silent fail */ }
}

function triggerVibration() {
    try {
        const settings = JSON.parse(localStorage.getItem('portalNotifSettings') || '{}');
        if (settings.vibration === false) return;
        window.navigator.vibrate?.([200, 100, 200, 100, 400]);
    } catch { /* silent fail */ }
}

// ─── Status configs ──────────────────────────────────────────────────────────
type OrderStatus = 'pending_payment' | 'queueing' | 'serving' | 'done' | string;

function getStatusConfig(status: OrderStatus) {
    switch (status) {
        case 'serving':
            return {
                icon: UtensilsCrossed,
                title: 'Being Served Now',
                subtitle: 'Our staff is bringing your order to you right now!',
                iconBg: 'bg-emerald-500/20',
                iconColor: 'text-emerald-400',
                ringColor: 'border-emerald-500/40',
                pingColor: 'bg-emerald-400/30',
                badge: '🍽️ Serving',
                badgeColor: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
            };
        case 'done':
            return {
                icon: CheckCircle,
                title: 'Enjoy Your Meal!',
                subtitle: 'Your order has been served. Thank you!',
                iconBg: 'bg-purple-500/20',
                iconColor: 'text-purple-400',
                ringColor: 'border-purple-500/40',
                pingColor: 'bg-purple-400/30',
                badge: '✅ Done',
                badgeColor: 'bg-purple-500/10 text-purple-400 border border-purple-500/30',
            };
        case 'pending_payment':
            return {
                icon: Package,
                title: 'Awaiting Payment',
                subtitle: 'Complete your GCash payment to confirm the order.',
                iconBg: 'bg-yellow-500/20',
                iconColor: 'text-yellow-400',
                ringColor: 'border-yellow-500/40',
                pingColor: 'bg-yellow-400/30',
                badge: '💳 Pending Payment',
                badgeColor: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
            };
        default: // queueing
            return {
                icon: Package,
                title: 'Order Received',
                subtitle: 'Sit tight! The kitchen will start your order soon.',
                iconBg: 'bg-primary/20',
                iconColor: 'text-primary',
                ringColor: 'border-primary/40',
                pingColor: 'bg-primary/20',
                badge: '⏳ Queueing',
                badgeColor: 'bg-primary/10 text-primary border border-primary/20',
            };
    }
}

// ─── Step indicator ──────────────────────────────────────────────────────────
const STEPS: { status: OrderStatus; label: string }[] = [
    { status: 'queueing', label: 'Received' },
    { status: 'serving', label: 'Serving' },
    { status: 'done', label: 'Done ✓' },
];

function getStepIndex(status: OrderStatus): number {
    const idx = STEPS.findIndex((s) => s.status === status);
    return idx === -1 ? 0 : idx;
}

export default function WaitingPage() {
    const router = useRouter();
    const { socket, onOrderSubmitted, onOrderStatusChanged, offOrderSubmitted, offOrderStatusChanged } = useSocket();

    const [sessionData, setSessionData] = useState<SessionData | null>(null);
    const [showChat, setShowChat] = useState(false);
    const [queueStatus, setQueueStatus] = useState<OrderStatus>('paid');
    const prevStatusRef = useRef<OrderStatus>('paid');

    // Load session
    useEffect(() => {
        const stored = sessionStorage.getItem("orderSession");
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                setSessionData(parsed);
                if (parsed.lastQueueStatus) {
                    setQueueStatus(parsed.lastQueueStatus);
                }
            } catch { router.replace('/order'); }
        } else {
            router.replace('/order');
        }
    }, [router]);

    // Socket listeners
    useEffect(() => {
        if (!socket) return;

        const handleSubmitted = (data: { queueStatus: string }) => {
            setQueueStatus(data.queueStatus as OrderStatus);
        };

        const handleStatusChanged = (data: { queueStatus: string }) => {
            const newStatus = data.queueStatus as OrderStatus;
            setQueueStatus(newStatus);

            // Save to session
            const stored = sessionStorage.getItem("orderSession");
            if (stored) {
                try {
                    const session = JSON.parse(stored);
                    sessionStorage.setItem("orderSession", JSON.stringify({ ...session, lastQueueStatus: newStatus }));
                } catch { /* ignore */ }
            }

            // Notify on serving transition
            if (newStatus === 'serving' && prevStatusRef.current !== 'serving') {
                playNotificationSound();
                triggerVibration();
            }

            prevStatusRef.current = newStatus;
        };

        onOrderSubmitted?.(handleSubmitted);
        onOrderStatusChanged?.(handleStatusChanged);

        return () => {
            offOrderSubmitted?.();
            offOrderStatusChanged?.();
        };
    }, [socket, onOrderSubmitted, offOrderSubmitted, onOrderStatusChanged, offOrderStatusChanged]);

    if (!sessionData) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    const cfg = getStatusConfig(queueStatus);
    const Icon = cfg.icon;
    const stepIdx = getStepIndex(queueStatus);

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-start pt-10 p-6 overflow-x-hidden">
            {/* Ambient glow */}
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="relative z-10 max-w-md w-full space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
                {/* Brand */}
                <div className="text-center">
                    <h1 className="text-white font-black text-xl uppercase tracking-widest">
                        RENDEZVOUS<span className="text-primary">.</span>
                    </h1>
                    <p className="text-white/30 text-xs tracking-widest uppercase mt-1">
                        Order Status
                    </p>
                </div>

                {/* Status card */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-8 flex flex-col items-center text-center gap-5">
                    {/* Animated icon */}
                    <div className="relative">
                        <div className={`absolute inset-0 ${cfg.pingColor} rounded-full animate-ping opacity-60`} />
                        <div className={`relative w-20 h-20 rounded-full ${cfg.iconBg} border ${cfg.ringColor} flex items-center justify-center shadow-2xl`}>
                            <Icon className={`w-9 h-9 ${cfg.iconColor}`} />
                        </div>
                    </div>

                    {/* Status badge */}
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${cfg.badgeColor} uppercase tracking-wider`}>
                        {cfg.badge}
                    </span>

                    {/* Title & subtitle */}
                    <div className="space-y-2">
                        <h2 className="text-2xl font-black uppercase tracking-widest text-white">
                            {cfg.title}<span className="text-primary">.</span>
                        </h2>
                        <p className="text-white/50 text-sm leading-relaxed max-w-[260px] mx-auto">
                            {cfg.subtitle}
                        </p>
                    </div>

                    {/* Customer & table info */}
                    <div className="text-xs text-white/30 space-y-0.5">
                        <p>{sessionData.customerName}</p>
                        {sessionData.tableId && <p>Table {sessionData.tableId}</p>}
                    </div>
                </div>

                {/* Progress steps */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                    <div className="flex items-center justify-between relative">
                        {/* Connecting line */}
                        <div className="absolute top-4 left-0 right-0 h-px bg-white/10 mx-8" />
                        <div
                            className="absolute top-4 left-0 h-px bg-primary transition-all duration-700 mx-8"
                            style={{ right: `${(1 - stepIdx / (STEPS.length - 1)) * 100}%` }}
                        />
                        {STEPS.map((step, i) => {
                            const done = i <= stepIdx;
                            const active = i === stepIdx;
                            return (
                                <div key={step.label} className="flex flex-col items-center gap-1.5 z-10 flex-1">
                                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${done
                                        ? 'bg-primary border-primary'
                                        : 'bg-background border-white/20'
                                        } ${active ? 'scale-110 shadow-lg shadow-primary/30' : ''}`}>
                                        {done ? (
                                            <span className="text-background text-xs font-black">✓</span>
                                        ) : (
                                            <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
                                        )}
                                    </div>
                                    <span className={`text-[10px] font-semibold uppercase tracking-wider text-center leading-tight ${done ? 'text-white' : 'text-white/30'
                                        }`}>
                                        {step.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Chat toggle */}
                <div className="flex flex-col items-center gap-3">
                    <button
                        onClick={() => setShowChat(!showChat)}
                        className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest border border-white/10 transition-all active:scale-95"
                    >
                        {showChat ? 'Hide Staff Chat' : 'Open Staff Chat'}
                    </button>

                    {showChat && (
                        <div className="w-full animate-in slide-in-from-top-4 fade-in duration-300">
                            <CustomerChat
                                sessionId={sessionData.tableId || 'guest-session-' + sessionData.customerName}
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

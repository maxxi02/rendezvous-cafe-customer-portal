'use client';

import { useRouter } from 'next/navigation';

export default function PaymentFailedPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 p-6">
            <div className="w-16 h-16 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center">
                <span className="text-3xl">❌</span>
            </div>
            <div className="text-center">
                <h1 className="text-white font-black text-xl uppercase tracking-widest">Payment Failed</h1>
                <p className="text-white/50 text-sm mt-2">Your GCash payment was not completed.</p>
                <p className="text-white/30 text-xs mt-1">Your order has NOT been placed. Please try again.</p>
            </div>
            <button
                onClick={() => router.back()}
                className="bg-primary text-background px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-white active:scale-95 transition-all"
            >
                Try Again →
            </button>
        </div>
    );
}

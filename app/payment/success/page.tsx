"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

// After GCash redirects back here, we redirect the customer to /order/waiting
// The webhook has already (or will shortly) confirm the payment on the server.
export default function PaymentSuccessPage() {
  const router = useRouter();
  const params = useSearchParams();
  const orderId = params.get("orderId");
  const sessionId = params.get("sessionId");

  useEffect(() => {
    if (!orderId) {
      // No orderId, redirect to menu
      router.replace("/menu");
      return;
    }

    // Play notification sound
    const audio = new Audio("/order-notification.mp3");
    audio.play().catch((err) => console.error("Audio playback failed:", err));

    // Confirm payment immediately — this fires as soon as GCash redirects back.
    // It acts as a reliable fallback to the PayMongo webhook (which cannot
    // reach localhost in dev, and may occasionally be delayed in production).
    fetch("/api/payment/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    }).catch((err) => console.error("[payment/success] confirm error:", err));

    if (sessionId) {
      // Restore sessionId so /order/waiting can join the right socket room
      const stored = sessionStorage.getItem("orderSession");
      if (stored) {
        try {
          const session = JSON.parse(stored);
          session.sessionId = sessionId;
          session.lastOrderId = orderId;
          sessionStorage.setItem("orderSession", JSON.stringify(session));
        } catch {
          /* ignore */
        }
      }
    }

    // Short delay to allow confirmation to propagate, then navigate to tracking
    const t = setTimeout(() => {
      // Use push instead of replace to ensure proper navigation
      router.push("/order/waiting");
    }, 1500);

    return () => clearTimeout(t);
  }, [orderId, sessionId, router]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 p-6">
      <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
        <span className="text-3xl">✅</span>
      </div>
      <div className="text-center">
        <h1 className="text-white font-black text-xl uppercase tracking-widest">
          Payment Received!
        </h1>
        <p className="text-white/50 text-sm mt-2">
          Taking you to your order tracker…
        </p>
      </div>
      <Loader2 className="w-6 h-6 text-primary animate-spin" />
    </div>
  );
}

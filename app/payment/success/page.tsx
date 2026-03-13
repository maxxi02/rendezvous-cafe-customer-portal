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
    console.log("[payment/success] Page loaded", { orderId, sessionId });

    if (!orderId) {
      console.log("[payment/success] No orderId, redirecting to menu");
      router.replace("/menu");
      return;
    }

    // Play notification sound
    const audio = new Audio("/order-notification.mp3");
    audio.play().catch((err) => console.error("Audio playback failed:", err));

    // Confirm payment immediately
    console.log("[payment/success] Confirming payment for orderId:", orderId);
    fetch("/api/payment/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    })
      .then((res) => {
        console.log("[payment/success] Payment confirm response:", res.status);
        return res.json();
      })
      .then((data) => console.log("[payment/success] Payment confirm data:", data))
      .catch((err) => console.error("[payment/success] confirm error:", err));

    if (sessionId) {
      console.log("[payment/success] Updating session with sessionId:", sessionId);
      const stored = sessionStorage.getItem("orderSession");
      if (stored) {
        try {
          const session = JSON.parse(stored);
          session.sessionId = sessionId;
          session.lastOrderId = orderId;
          sessionStorage.setItem("orderSession", JSON.stringify(session));
          console.log("[payment/success] Session updated:", session);
        } catch (e) {
          console.error("[payment/success] Failed to update session:", e);
        }
      } else {
        console.log("[payment/success] No orderSession in sessionStorage");
      }
    }

    // Short delay to allow confirmation to propagate, then navigate to tracking
    console.log("[payment/success] Scheduling redirect to /order/waiting in 1500ms");
    const t = setTimeout(() => {
      console.log("[payment/success] Redirecting to /order/waiting");
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

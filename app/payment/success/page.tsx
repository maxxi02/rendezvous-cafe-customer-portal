"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

function PaymentSuccessContent() {
  const params = useSearchParams();
  const orderId = params.get("orderId");
  const sessionId = params.get("sessionId");

  useEffect(() => {
    console.log("[payment/success] Page loaded", { orderId, sessionId });

    let effectiveOrderId = orderId;
    let effectiveSessionId = sessionId;

    console.log("[payment/success] Initial params:", { orderId, sessionId });

    if (!effectiveOrderId) {
      const stored = sessionStorage.getItem("orderSession");
      console.log("[payment/success] No orderId in URL, checking sessionStorage:", stored);
      if (stored) {
        try {
          const sess = JSON.parse(stored);
          if (sess.lastOrderId) {
            effectiveOrderId = sess.lastOrderId;
            console.log("[payment/success] Recovered orderId from session:", effectiveOrderId);
          }
          if (sess.sessionId && !effectiveSessionId) {
            effectiveSessionId = sess.sessionId;
            console.log("[payment/success] Recovered sessionId from session:", effectiveSessionId);
          }
        } catch (e) {
          console.error("[payment/success] Failed to parse orderSession", e);
        }
      }
    }

    if (!effectiveOrderId) {
      console.warn("[payment/success] No orderId found after recovery, redirecting to menu");
      window.location.replace("/menu");
      return;
    }

    // Play notification sound
    const audio = new Audio("/order-notification.mp3");
    audio.play().catch((err) => console.error("Audio playback failed:", err));

    // Confirm payment immediately
    console.log("[payment/success] Confirming payment for orderId:", effectiveOrderId);
    fetch("/api/payment/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: effectiveOrderId }),
    })
      .then((res) => {
        console.log("[payment/success] Payment confirm response:", res.status);
        return res.json();
      })
      .then((data) => console.log("[payment/success] Payment confirm data:", data))
      .catch((err) => console.error("[payment/success] confirm error:", err));

    if (effectiveSessionId) {
      console.log("[payment/success] Syncing session storage for tracking:", effectiveSessionId);
      const stored = sessionStorage.getItem("orderSession");
      if (stored) {
        try {
          const session = JSON.parse(stored);
          session.sessionId = effectiveSessionId;
          session.lastOrderId = effectiveOrderId;
          sessionStorage.setItem("orderSession", JSON.stringify(session));
        } catch (e) {
          console.error("[payment/success] Failed to sync session storage:", e);
        }
      }
    }

    // Short delay to allow confirmation to propagate, then navigate to tracking
    console.log("[payment/success] Scheduling redirect to /order/waiting in 1500ms");
    const t = setTimeout(() => {
      console.log("[payment/success] Redirecting to /order/waiting");
      window.location.replace("/order/waiting");
    }, 1500);

    return () => clearTimeout(t);
  }, [orderId, sessionId]);

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

// After GCash redirects back here, we redirect the customer to /order/waiting.
// The webhook has already (or will shortly) confirm the payment on the server.
export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 p-6">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}

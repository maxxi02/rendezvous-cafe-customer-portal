"use client";

import { useState } from "react";
import { X, Loader2, Smartphone, Car, Banknote } from "lucide-react";
import { CustomerOrder, CustomerOrderItem } from "@/app/types/order.type";

interface SessionData {
  customerName: string;
  tableId?: string;
  qrType: string;
  isAnonymous: boolean;
  email?: string;
  sessionId?: string;
  customerId?: string;
}

interface CheckoutModalProps {
  items: CustomerOrderItem[];
  total: number;
  onClose: () => void;
  onConfirm: (order: CustomerOrder) => Promise<void>;
  clearCart: () => void;
  sessionData?: SessionData | null;
}

type PaymentMode = "gcash" | "cash";

export function CheckoutModal({
  items,
  total,
  onClose,
  onConfirm,
  clearCart,
  sessionData,
}: CheckoutModalProps) {
  const [orderNote, setOrderNote] = useState("");
  const [vehicleIdentification, setVehicleIdentification] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("gcash");

  const customerName = sessionData?.customerName || "Guest";
  const tableId = sessionData?.tableId;
  const sessionId = sessionData?.sessionId;
  const isDriveThru = sessionData?.qrType === "drive-thru";

  const canPay =
    !loading &&
    (!isDriveThru || vehicleIdentification.trim()) &&
    (paymentMode === "gcash" || paymentMode === "cash");

  const handlePay = async () => {
    if (isDriveThru && !vehicleIdentification.trim()) {
      setError("Please tell us how to identify you (e.g. car color, name, etc.)");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const orderId = `customer-${Date.now()}`;
      const effectiveSessionId = sessionId || orderId;
      const isCash = paymentMode === "cash";
      const gcashCharge = isCash ? 0 : total;

      // 1. Create the order record
      const orderRes = await fetch("/api/order/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          sessionId: effectiveSessionId,
          customerName,
          customerId: sessionData?.customerId ?? null,
          tableId: tableId || undefined,
          tableNumber: tableId || undefined,
          items,
          orderNote: orderNote.trim() || undefined,
          vehicleIdentification: isDriveThru ? vehicleIdentification.trim() : undefined,
          qrType: sessionData?.qrType || undefined,
          orderType: tableId ? "dine-in" : "takeaway",
          subtotal: total,
          total,
          paymentMethod: isCash ? "cash" : "gcash",
          timestamp: new Date(),
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData?.error || "Failed to register order");

      // 2a. Cash — skip PayMongo, go directly to waiting page
      if (isCash) {
        const stored = sessionStorage.getItem("orderSession");
        if (stored) {
          try {
            const sess = JSON.parse(stored);
            sess.sessionId = effectiveSessionId;
            sess.lastOrderId = orderId;
            if (sessionData?.customerId) sess.customerId = sessionData.customerId;
            sessionStorage.setItem("orderSession", JSON.stringify(sess));
          } catch (e) {
            console.error("[CheckoutModal] Failed to update session:", e);
          }
        }
        clearCart();
        window.location.href = "/order/waiting";
        return;
      }

      // 2b. GCash — create PayMongo source
      const payRes = await fetch("/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          sessionId: effectiveSessionId,
          amount: gcashCharge,
          customerName,
          email: sessionData?.email || "",
          description: `Order ${orderId}`,
        }),
      });

      const payData = await payRes.json();
      if (!payRes.ok || !payData.checkoutUrl)
        throw new Error(payData.error || "Failed to create GCash payment");

      // 3. Persist session
      const stored = sessionStorage.getItem("orderSession");
      if (stored) {
        try {
          const sess = JSON.parse(stored);
          sess.sessionId = effectiveSessionId;
          sess.lastOrderId = orderId;
          if (sessionData?.customerId) sess.customerId = sessionData.customerId;
          sessionStorage.setItem("orderSession", JSON.stringify(sess));
        } catch (e) {
          console.error("[CheckoutModal] Failed to update session:", e);
        }
      }

      sessionStorage.setItem("isRedirectingToPayment", "true");
      clearCart();
      window.location.href = payData.checkoutUrl;
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-end sm:items-center justify-center sm:p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full sm:max-w-md bg-background rounded-t-3xl sm:rounded-3xl border border-white/10 shadow-2xl flex flex-col max-h-[92dvh] overflow-hidden">
        <div className="h-1 w-full bg-linear-to-r from-primary via-primary/50 to-primary shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 pt-5 pb-4 shrink-0">
          <div>
            <h2 className="text-white font-black text-lg sm:text-xl uppercase tracking-widest">
              Confirm &amp; Pay
            </h2>
            <p className="text-white/40 text-xs mt-1">
              {items.length} item(s) · ₱{total.toFixed(2)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors touch-manipulation"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {/* Order summary */}
          <div className="mx-5 sm:mx-6 mb-4 bg-white/5 rounded-2xl p-3 max-h-24 overflow-y-auto border border-white/10">
            {items.map((item) => (
              <div key={item._id} className="flex justify-between text-sm py-1">
                <span className="text-white/70 font-medium">
                  {item.name} × {item.quantity}
                </span>
                <span className="text-primary font-bold shrink-0 ml-2">
                  ₱{(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div className="px-5 sm:px-6 pb-6 space-y-4">
            {/* Table info */}
            {tableId && (
              <div className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3 border border-white/10">
                <span className="text-white/40 text-xs font-bold uppercase tracking-widest shrink-0">
                  Table
                </span>
                <span className="text-white font-bold">
                  {customerName.startsWith("TABLE-#")
                    ? customerName.replace("TABLE-", "")
                    : tableId.match(/\d+/)
                    ? `#${tableId.match(/\d+/)?.[0]}`
                    : tableId}
                </span>
              </div>
            )}

            {/* Customer name */}
            <div className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3 border border-white/10">
              <span className="text-white/40 text-xs font-bold uppercase tracking-widest shrink-0">
                Name
              </span>
              <span className="text-white font-medium truncate">{customerName}</span>
            </div>

            {/* Drive-Thru Identification */}
            {isDriveThru && (
              <div>
                <label className="text-white/50 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2 flex-wrap">
                  <Car className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>How do we identify you?</span>
                  <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={vehicleIdentification}
                  onChange={(e) => setVehicleIdentification(e.target.value)}
                  placeholder="e.g. Red Toyota, Blue shirt, Name: Juan"
                  className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-blue-400/60 focus:bg-white/15 transition-all"
                />
              </div>
            )}

            {/* Payment mode selector — GCash and Cash only */}
            <div>
              <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-2">
                Payment Method
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setPaymentMode("gcash")}
                  className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-bold transition-all ${
                    paymentMode === "gcash"
                      ? "bg-blue-500/20 border-blue-500/60 text-blue-400"
                      : "bg-white/5 border-white/10 text-white/50 hover:border-white/20"
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                  GCash
                </button>
                <button
                  onClick={() => setPaymentMode("cash")}
                  className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-bold transition-all ${
                    paymentMode === "cash"
                      ? "bg-emerald-500/20 border-emerald-500/60 text-emerald-400"
                      : "bg-white/5 border-white/10 text-white/50 hover:border-white/20"
                  }`}
                >
                  <Banknote className="w-4 h-4" />
                  Cash
                </button>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-white/50 text-xs font-bold uppercase tracking-widest mb-2 block">
                Special Instructions
              </label>
              <textarea
                value={orderNote}
                onChange={(e) => setOrderNote(e.target.value)}
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

            {/* Pay button */}
            <button
              onClick={handlePay}
              disabled={!canPay}
              className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all duration-200 flex items-center justify-center gap-3 shadow-lg touch-manipulation ${
                paymentMode === "cash"
                  ? "bg-emerald-500 text-white hover:bg-emerald-400 shadow-emerald-500/20"
                  : "bg-blue-500 text-white hover:bg-blue-400 shadow-blue-500/20"
              }`}
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> {paymentMode === "cash" ? "Placing Order…" : "Redirecting to GCash…"}</>
              ) : paymentMode === "cash" ? (
                <><Banknote className="w-4 h-4" /> Pay ₱{total.toFixed(2)} Cash</>
              ) : (
                <><Smartphone className="w-4 h-4" /> Pay with GCash</>
              )}
            </button>

            {paymentMode === "cash" && (
              <p className="text-center text-white/20 text-[11px]">
                Staff will collect ₱{total.toFixed(2)} cash when your order is ready.
              </p>
            )}
            {paymentMode === "gcash" && (
              <p className="text-center text-white/20 text-[11px]">
                You will be redirected to GCash to complete your payment.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
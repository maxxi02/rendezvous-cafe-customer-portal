"use client";

import { useState } from "react";
import { Star, X, LogIn, CheckCircle2, Loader2 } from "lucide-react";

interface RatingModalProps {
  orderId: string;
  isGoogleUser: boolean;
  onClose: () => void;
}

export function RatingModal({ orderId, isGoogleUser, onClose }: RatingModalProps) {
  const [hovered, setHovered] = useState(0);
  const [selected, setSelected] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!selected || isSubmitting) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/order/rate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, rating: selected, comment: comment.trim() || undefined }),
      });

      if (res.status === 409) {
        setError("You've already rated this order.");
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      setSubmitted(true);
      setTimeout(onClose, 2200);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const starLabel = ["", "Poor", "Fair", "Good", "Great", "Excellent!"];

  return (
    /* Backdrop */
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
      {/* Modal card */}
      <div className="relative w-full max-w-sm bg-[#0f1117] border border-white/10 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-6 duration-400 overflow-hidden">

        {/* Top accent bar */}
        <div className="h-0.5 w-full bg-linear-to-r from-emerald-500 via-primary to-purple-500" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/30 hover:text-white/70 transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-7">
          {/* ── Thank-you state ── */}
          {submitted ? (
            <div className="flex flex-col items-center gap-4 py-4 animate-in fade-in zoom-in duration-400">
              <CheckCircle2 className="w-14 h-14 text-emerald-400" />
              <div className="text-center">
                <p className="text-white font-black text-lg uppercase tracking-widest">Thank You!</p>
                <p className="text-white/40 text-sm mt-1">Your feedback helps us improve.</p>
              </div>
            </div>
          ) : !isGoogleUser ? (
            /* ── Sign-in prompt for anonymous users ── */
            <div className="flex flex-col items-center gap-5 py-2 text-center">
              <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                <LogIn className="w-7 h-7 text-primary" />
              </div>
              <div>
                <p className="text-white font-black text-base uppercase tracking-widest">Rate Your Order</p>
                <p className="text-white/40 text-sm mt-2 leading-relaxed">
                  Sign in with Google to leave a rating and help us serve you better.
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-xs text-white/30 hover:text-white/50 underline underline-offset-2 transition-colors"
              >
                Maybe later
              </button>
            </div>
          ) : (
            /* ── Star rating form ── */
            <>
              <div className="text-center mb-6">
                <p className="text-white font-black text-base uppercase tracking-widest">
                  Rate Your Experience
                  <span className="text-primary">.</span>
                </p>
                <p className="text-white/40 text-xs mt-1">How was your order?</p>
              </div>

              {/* Stars */}
              <div
                className="flex items-center justify-center gap-2 mb-2"
                onMouseLeave={() => setHovered(0)}
              >
                {[1, 2, 3, 4, 5].map((star) => {
                  const filled = star <= (hovered || selected);
                  return (
                    <button
                      key={star}
                      onMouseEnter={() => setHovered(star)}
                      onClick={() => setSelected(star)}
                      className="transition-transform active:scale-90"
                      aria-label={`${star} star${star !== 1 ? "s" : ""}`}
                    >
                      <Star
                        className={`w-10 h-10 transition-all duration-150 ${
                          filled
                            ? "fill-amber-400 text-amber-400 scale-110"
                            : "text-white/20 scale-100"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              {/* Star label */}
              <p className="text-center text-xs font-bold uppercase tracking-widest text-amber-400/80 min-h-[16px] mb-5">
                {starLabel[hovered || selected] || ""}
              </p>

              {/* Comment */}
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value.slice(0, 200))}
                placeholder="Leave a comment (optional)…"
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 resize-none focus:outline-none focus:border-primary/50 transition-colors mb-1"
              />
              <p className="text-right text-[10px] text-white/20 mb-5">{comment.length}/200</p>

              {/* Error */}
              {error && (
                <p className="text-xs text-red-400 text-center mb-4">{error}</p>
              )}

              {/* Actions */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleSubmit}
                  disabled={!selected || isSubmitting}
                  className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-white text-background py-3.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
                  ) : (
                    "Submit Rating"
                  )}
                </button>
                <button
                  onClick={onClose}
                  className="text-xs text-white/30 hover:text-white/50 underline underline-offset-2 transition-colors text-center py-1"
                >
                  Skip for now
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

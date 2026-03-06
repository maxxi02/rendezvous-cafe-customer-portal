import { NextRequest, NextResponse } from "next/server";

const SOCKET_SERVER_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:8080";
const INTERNAL_SECRET = process.env.INTERNAL_SECRET || "";

/**
 * POST /api/payment/confirm
 *
 * Called by /payment/success immediately after GCash redirects back.
 * Acts as a direct fallback to mark the order as paid without relying
 * solely on the PayMongo webhook (which can't reach localhost in dev).
 */
export async function POST(req: NextRequest) {
  try {
    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json(
        { error: "orderId is required" },
        { status: 400 },
      );
    }

    const res = await fetch(`${SOCKET_SERVER_URL}/internal/payment-confirmed`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-secret": INTERNAL_SECRET,
      },
      body: JSON.stringify({ orderId, paymentReference: "gcash-redirect" }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("[payment/confirm] Server error:", data);
      return NextResponse.json(
        { error: data?.error || "Failed to confirm payment" },
        { status: res.status },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[payment/confirm] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

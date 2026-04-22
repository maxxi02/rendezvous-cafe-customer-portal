import { NextRequest, NextResponse } from "next/server";

const SOCKET_SERVER_URL =
  process.env.SOCKET_URL || "https://rendezvous-server-gpmv.onrender.com";
const INTERNAL_SECRET = process.env.INTERNAL_SECRET || "";

/**
 * POST /api/order/create
 *
 * Synchronously creates a customer order in the socket-server's MongoDB
 * (via /internal/order-create) before a PayMongo payment source is created.
 *
 * This is critical: the PayMongo webhook fires moments after the GCash redirect,
 * and it must find the order in the DB or the payment confirmation is lost.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body?.orderId || !body?.customerName) {
      return NextResponse.json(
        { error: "orderId and customerName are required" },
        { status: 400 },
      );
    }

    const res = await fetch(`${SOCKET_SERVER_URL}/internal/order-create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-secret": INTERNAL_SECRET,
      },
      body: JSON.stringify(body),
    });

    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error("[api/order/create] Non-JSON response:", text);
      return NextResponse.json(
        {
          error:
            "Socket server returned an invalid response. Please ensure it is running and updated.",
        },
        { status: 502 },
      );
    }

    if (!res.ok) {
      console.error("[api/order/create] Socket server error:", data);
      return NextResponse.json(
        { error: data?.error || "Failed to create order" },
        { status: res.status },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("[api/order/create] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

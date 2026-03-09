import { NextRequest, NextResponse } from "next/server";

const PAYMONGO_SECRET = process.env.PAYMONGO_SECRET_KEY || "";
const SOCKET_SERVER_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:8080";

export async function POST(req: NextRequest) {
  try {
    const APP_URL =
      process.env.NEXT_PUBLIC_APP_URL ||
      req.headers.get("origin") ||
      "https://rendezvouscafe.vercel.app";

    const body = await req.json();
    const { orderId, sessionId, amount, customerName, email, description } =
      body;

    if (!orderId || !amount) {
      return NextResponse.json(
        { error: "orderId and amount are required" },
        { status: 400 },
      );
    }

    if (!PAYMONGO_SECRET) {
      return NextResponse.json(
        { error: "PayMongo secret key not configured" },
        { status: 500 },
      );
    }

    // Create a GCash Source via PayMongo
    // Docs: https://developers.paymongo.com/reference/the-sources-object
    const response = await fetch("https://api.paymongo.com/v1/sources", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(PAYMONGO_SECRET + ":").toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: {
          attributes: {
            amount: Math.round(amount * 100), // PayMongo expects centavos
            currency: "PHP",
            type: "gcash",
            redirect: {
              success: `${APP_URL}/payment/success?orderId=${orderId}&sessionId=${sessionId || ""}`,
              failed: `${APP_URL}/payment/failed?orderId=${orderId}`,
            },
            billing: {
              name: customerName || "Customer",
              email: email || "guest@rendezvous.com",
            },
            description: description || `Order ${orderId}`,
          },
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("[payment/create] PayMongo error:", data);
      return NextResponse.json(
        {
          error: data?.errors?.[0]?.detail || "Failed to create GCash payment",
        },
        { status: response.status },
      );
    }

    const source = data.data;
    const checkoutUrl = source?.attributes?.redirect?.checkout_url;
    const sourceId = source?.id;

    return NextResponse.json({
      success: true,
      sourceId,
      checkoutUrl,
    });
  } catch (error) {
    console.error("[payment/create] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

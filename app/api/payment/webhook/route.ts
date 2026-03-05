import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const PAYMONGO_WEBHOOK_SECRET = process.env.PAYMONGO_WEBHOOK_SECRET || "";
const SOCKET_SERVER_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:8080";
const INTERNAL_SECRET = process.env.INTERNAL_SECRET || "";

function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string,
): boolean {
  if (!PAYMONGO_WEBHOOK_SECRET) return true; // Skip in dev if no secret set

  // PayMongo sends: t=<timestamp>,te=<signature>
  const parts = signatureHeader.split(",");
  const timestamp = parts.find((p) => p.startsWith("t="))?.split("=")[1];
  const signature = parts.find((p) => p.startsWith("te="))?.split("=")[1];

  if (!timestamp || !signature) return false;

  const toSign = `${timestamp}.${rawBody}`;
  const expectedSig = crypto
    .createHmac("sha256", PAYMONGO_WEBHOOK_SECRET)
    .update(toSign)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(expectedSig),
    Buffer.from(signature),
  );
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signatureHeader = req.headers.get("paymongo-signature") || "";

    // Verify webhook signature
    if (signatureHeader && !verifyWebhookSignature(rawBody, signatureHeader)) {
      console.warn("[webhook] Invalid PayMongo signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(rawBody);
    const eventType = event?.data?.attributes?.type;
    const sourceData = event?.data?.attributes?.data;

    console.log("[webhook] PayMongo event:", eventType);

    // We care about source.chargeable — means GCash payment was completed
    if (eventType === "source.chargeable") {
      const sourceId = sourceData?.id;
      const amount = sourceData?.attributes?.amount; // in centavos
      const currency = sourceData?.attributes?.currency;
      const metadata = sourceData?.attributes?.metadata || {};

      // Extract orderId from source description or metadata
      // The orderId was embedded in the description when creating the source
      const description: string = sourceData?.attributes?.description || "";
      const orderIdMatch = description.match(/Order (.+)/);
      const orderId =
        metadata?.orderId || (orderIdMatch ? orderIdMatch[1] : null);

      if (!orderId) {
        console.warn(
          "[webhook] Could not extract orderId from source:",
          sourceId,
        );
        return NextResponse.json({ received: true });
      }

      // Notify rendezvous-server to confirm the payment
      const notifyRes = await fetch(
        `${SOCKET_SERVER_URL}/internal/payment-confirmed`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-internal-secret": INTERNAL_SECRET,
          },
          body: JSON.stringify({
            orderId,
            paymentReference: sourceId,
          }),
        },
      );

      if (!notifyRes.ok) {
        console.error(
          "[webhook] Failed to notify server:",
          await notifyRes.text(),
        );
      } else {
        console.log(`[webhook] Payment confirmed for order ${orderId}`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[webhook] Error processing PayMongo event:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    );
  }
}

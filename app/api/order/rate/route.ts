import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { MONGODB } from "@/config/db";
import { verifyAnonymousSession } from "@/lib/anonymous-session";

/**
 * POST /api/order/rate
 *
 * Saves a 1-5 star rating (with optional comment) for a completed order.
 * Requires an authenticated Google session — anonymous/guest users are rejected.
 * One rating per user per order is enforced via a compound unique index fallback.
 */
export async function POST(request: NextRequest) {
  try {
    // ── Auth gate ─────────────────────────────────────────────────────────
    const session = await auth.api.getSession({ headers: request.headers });

    // Check if user is authenticated with Google
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    // Check if user is an anonymous session user (not logged in)
    const anonymousToken = request.cookies.get("anonymous-session")?.value;
    if (anonymousToken) {
      const anonymousUser = await verifyAnonymousSession(anonymousToken);
      if (anonymousUser) {
        return NextResponse.json(
          { error: "Please sign in with Google to rate your order" },
          { status: 403 },
        );
      }
    }

    // ── Validate body ─────────────────────────────────────────────────────
    const body = await request.json();
    const { orderId, rating, comment } = body;

    if (!orderId || typeof orderId !== "string") {
      return NextResponse.json(
        { error: "orderId is required" },
        { status: 400 },
      );
    }

    const ratingNum = Number(rating);
    if (!ratingNum || ratingNum < 1 || ratingNum > 5 || !Number.isInteger(ratingNum)) {
      return NextResponse.json(
        { error: "rating must be an integer between 1 and 5" },
        { status: 400 },
      );
    }

    // ── Duplicate check ───────────────────────────────────────────────────
    const ratingsCollection = MONGODB.collection("orderRatings");

    const existing = await ratingsCollection.findOne({
      orderId,
      userId: session.user.id,
    });

    if (existing) {
      return NextResponse.json(
        { error: "You have already rated this order" },
        { status: 409 },
      );
    }

    // ── Save rating ────────────────────────────────────────────────────────
    const doc = {
      orderId,
      userId: session.user.id,
      userName: session.user.name || "Customer",
      userEmail: session.user.email || null,
      rating: ratingNum,
      comment: comment ? String(comment).slice(0, 200).trim() : null,
      createdAt: new Date(),
    };

    await ratingsCollection.insertOne(doc);

    console.log(`⭐ Rating saved — order: ${orderId}, user: ${session.user.id}, stars: ${ratingNum}`);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("❌ POST /api/order/rate error:", error);
    return NextResponse.json(
      {
        error: "Failed to save rating",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { MONGODB } from "@/config/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { customerId } = body;

    if (!customerId) {
      return NextResponse.json(
        { error: "Customer ID is required" },
        { status: 400 },
      );
    }

    // Connect to the DB manually if the MONGODB promise isn't resolved directly,
    // although better-auth adapter likely ensures connection or we can await it.
    // The codebase typically exports MONGODB as a MongoClient or similar db interface.
    // Assuming MONGODB is the Db instance:
    const usersCollection = MONGODB.collection("user");
    const sessionCollection = MONGODB.collection("session");
    const accountCollection = MONGODB.collection("account");

    // We first check if the user is actually anonymous to prevent accidental deletion of actual users
    const user = await usersCollection.findOne({ id: customerId });
    if (!user) {
      return NextResponse.json({ success: true, message: "User not found" });
    }

    if (!user.isAnonymous) {
      return NextResponse.json(
        { error: "Cannot delete non-anonymous users via this endpoint" },
        { status: 403 },
      );
    }

    // Delete the anonymous user and their associated auth data
    await Promise.all([
      usersCollection.deleteOne({ id: customerId }),
      sessionCollection.deleteMany({ userId: customerId }),
      accountCollection.deleteMany({ userId: customerId }),
    ]);

    console.log(`🧹 Cleaned up anonymous customer data: ${customerId}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Error cleaning up anonymous customer:", error);
    return NextResponse.json(
      { error: "Failed to clean up customer" },
      { status: 500 },
    );
  }
}

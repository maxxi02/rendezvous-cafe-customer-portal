import { NextRequest, NextResponse } from "next/server";
import {
  createAnonymousSession,
  type AnonymousUser,
} from "@/lib/anonymous-session";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    // Create anonymous user object (NOT saved to database)
    const anonymousUser: Omit<AnonymousUser, "createdAt"> = {
      id: `anon-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      email,
      isAnonymous: true,
    };

    // Create JWT session token
    const token = await createAnonymousSession(anonymousUser);

    // Set cookie
    const response = NextResponse.json(
      {
        user: {
          ...anonymousUser,
          createdAt: new Date().toISOString(),
        },
        token,
      },
      { status: 200 }
    );

    response.cookies.set("anonymous-session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 86400,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("[api/auth/anonymous] Error:", error);
    return NextResponse.json(
      { error: "Failed to create anonymous session" },
      { status: 500 }
    );
  }
}

import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-change-in-production"
);

export interface AnonymousUser {
  id: string;
  name: string;
  email: string;
  isAnonymous: true;
  createdAt: string;
}

/**
 * Create an anonymous user session stored in a signed JWT cookie
 * This prevents anonymous users from being saved to the database
 */
export async function createAnonymousSession(
  user: Omit<AnonymousUser, "createdAt">
): Promise<string> {
  const token = await new SignJWT({
    ...user,
    createdAt: new Date().toISOString(),
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("24h")
    .sign(JWT_SECRET);

  return token;
}

/**
 * Verify and decode an anonymous user session from cookie
 */
export async function verifyAnonymousSession(
  token: string
): Promise<AnonymousUser | null> {
  try {
    const verified = await jwtVerify(token, JWT_SECRET);
    return verified.payload as unknown as AnonymousUser;
  } catch (error) {
    return null;
  }
}

/**
 * Get anonymous user from session cookie
 */
export async function getAnonymousUserFromSession(): Promise<AnonymousUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("anonymous-session")?.value;

  if (!token) return null;

  return verifyAnonymousSession(token);
}

/**
 * Set anonymous user session cookie
 */
export async function setAnonymousSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set("anonymous-session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 86400, // 24 hours
    path: "/",
  });
}

/**
 * Clear anonymous user session
 */
export async function clearAnonymousSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete("anonymous-session");
}

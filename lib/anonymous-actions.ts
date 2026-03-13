"use server";

import { cookies } from "next/headers";
import { verifyAnonymousSession, type AnonymousUser } from "./anonymous-session";

export async function getAnonymousUser(): Promise<AnonymousUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("anonymous-session")?.value;

  if (!token) return null;

  return verifyAnonymousSession(token);
}

export async function clearAnonymousUserSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete("anonymous-session");
}

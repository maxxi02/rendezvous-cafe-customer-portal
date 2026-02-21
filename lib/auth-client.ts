import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.API_URL as string,
});

export const { signIn, useSession, signOut } = authClient;

import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { auth } from "./auth";

export const authClient = createAuthClient({
  baseURL: process.env.API_URL as string,
  plugins: [inferAdditionalFields<typeof auth>()],
});

export const { signIn, useSession, signOut } = authClient;

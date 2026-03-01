import {
  inferAdditionalFields,
  anonymousClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { auth } from "./auth";

export const authClient = createAuthClient({
  baseURL: process.env.API_URL as string,
  plugins: [inferAdditionalFields<typeof auth>(), anonymousClient()],
});

export const { signIn, useSession, signOut } = authClient;

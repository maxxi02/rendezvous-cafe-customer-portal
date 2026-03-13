import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { anonymous } from "better-auth/plugins";
import { MONGODB } from "../config/db";

// In-memory storage for anonymous users
const anonymousUsersMemory = new Map<string, any>();

export const auth = betterAuth({
  advanced: {
    cookiePrefix: "customer-portal",
  },
  database: mongodbAdapter(MONGODB),
  baseURL: process.env.API_URL as string,
  plugins: [anonymous()],
  trustedOrigins: [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://rendezvous-cafe.vercel.app",
  ],
  rateLimit: {
    enabled: false,
  },
  socialProviders: {
    google: {
      prompt: "select_account",
      redirectURI: `${process.env.BETTER_AUTH_URL}/api/auth/callback/google`,
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      mapProfileToUser: () => {
        return {
          role: "customer",
        };
      },
    },
  },

  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "customer",
      },
    },
  },
});

export { anonymousUsersMemory };

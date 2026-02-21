import { betterAuth } from "better-auth";

export const auth = betterAuth({
  baseURL: process.env.API_URL as string,
  trustedOrigins: [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://rendezvous-cafe.vercel.app",
  ],
  rateLimit: {
    enabled: false, // 👈 disable during development/testing
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

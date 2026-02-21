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
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
});

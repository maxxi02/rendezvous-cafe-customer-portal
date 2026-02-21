import { betterAuth } from "better-auth";

export const auth = betterAuth({
  baseURL: process.env.API_URL as string,
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
});

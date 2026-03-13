import type { BetterAuthPlugin } from "better-auth";

// In-memory storage for anonymous users
const anonymousUsersMemory = new Map<string, any>();

/**
 * Plugin to store anonymous users in memory instead of database
 * This prevents the database from filling up with temporary anonymous user records
 */
export const anonymousMemoryPlugin = (): BetterAuthPlugin => {
  return {
    id: "anonymous-memory",
    hooks: {
      after: {
        signUpEmail: async (ctx) => {
          // Store anonymous users in memory
          if (ctx.user?.isAnonymous) {
            anonymousUsersMemory.set(ctx.user.id, ctx.user);
          }
          return ctx;
        },
      },
    },
  };
};

export { anonymousUsersMemory };

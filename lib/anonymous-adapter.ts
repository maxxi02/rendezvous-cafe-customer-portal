import type { Adapter } from "better-auth";

// In-memory storage for anonymous users
const anonymousUsersMemory = new Map<string, any>();

/**
 * Wraps a database adapter to prevent anonymous users from being persisted
 * while still allowing orders to reference them
 */
export function createAnonymousAdapter(baseAdapter: Adapter): Adapter {
  return {
    ...baseAdapter,
    createUser: async (user) => {
      // If anonymous user, store in memory only
      if (user.isAnonymous) {
        anonymousUsersMemory.set(user.id, user);
        return user;
      }
      // Regular users go to database
      return baseAdapter.createUser(user);
    },
    findUserById: async (id) => {
      // Check memory first for anonymous users
      if (anonymousUsersMemory.has(id)) {
        return anonymousUsersMemory.get(id);
      }
      // Fall back to database
      return baseAdapter.findUserById(id);
    },
    findUserByEmail: async (email) => {
      // Check memory for anonymous users
      for (const user of anonymousUsersMemory.values()) {
        if (user.email === email) {
          return user;
        }
      }
      // Fall back to database
      return baseAdapter.findUserByEmail(email);
    },
    updateUser: async (id, user) => {
      // Update in memory if anonymous
      if (anonymousUsersMemory.has(id)) {
        const updated = { ...anonymousUsersMemory.get(id), ...user };
        anonymousUsersMemory.set(id, updated);
        return updated;
      }
      // Update in database
      return baseAdapter.updateUser(id, user);
    },
    deleteUser: async (id) => {
      // Remove from memory if anonymous
      if (anonymousUsersMemory.has(id)) {
        anonymousUsersMemory.delete(id);
        return;
      }
      // Delete from database
      return baseAdapter.deleteUser(id);
    },
  };
}

export { anonymousUsersMemory };

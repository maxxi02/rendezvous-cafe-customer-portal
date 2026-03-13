import { MONGODB } from "../config/db";

// In-memory storage for anonymous users
const anonymousUsersMemory = new Map<string, any>();

/**
 * Setup MongoDB hooks to prevent anonymous users from being saved
 * Call this after auth is initialized
 */
export async function setupAnonymousUserHandling() {
  try {
    const usersCollection = MONGODB.collection("user");
    
    // Store reference to original insertOne
    const originalInsertOne = usersCollection.insertOne.bind(usersCollection);
    
    // Override insertOne to intercept anonymous users
    usersCollection.insertOne = async function(doc: any) {
      if (doc.isAnonymous) {
        // Store in memory instead of database
        anonymousUsersMemory.set(doc.id, doc);
        // Return a mock result
        return {
          insertedId: doc.id,
          acknowledged: true,
        } as any;
      }
      // Regular users go to database
      return originalInsertOne(doc);
    };

    // Override findOne to check memory first
    const originalFindOne = usersCollection.findOne.bind(usersCollection);
    usersCollection.findOne = async function(filter: any) {
      // Check if looking for anonymous user by id
      if (filter.id && anonymousUsersMemory.has(filter.id)) {
        return anonymousUsersMemory.get(filter.id);
      }
      // Check if looking for anonymous user by email
      if (filter.email) {
        for (const user of anonymousUsersMemory.values()) {
          if (user.email === filter.email && user.isAnonymous) {
            return user;
          }
        }
      }
      // Fall back to database
      return originalFindOne(filter);
    };

  } catch (error) {
    console.error("Failed to setup anonymous user handling:", error);
  }
}

export { anonymousUsersMemory };

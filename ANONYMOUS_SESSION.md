# Anonymous User Session System

This system stores anonymous user data in JWT-signed cookies instead of the database, preventing database bloat.

## How It Works

1. **Anonymous User Creation**: When a customer doesn't log in, call `/api/auth/anonymous` with their name and email
2. **Session Storage**: User data is stored in a signed JWT cookie (24-hour expiration)
3. **No Database Persistence**: Anonymous users are NEVER saved to MongoDB
4. **Order Processing**: Orders can still reference the anonymous user via the session

## Usage

### Client-Side: Create Anonymous User

```typescript
// In your component
const createAnonymousUser = async (name: string, email: string) => {
  const response = await fetch("/api/auth/anonymous", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email }),
  });

  const data = await response.json();
  // data.user contains the anonymous user object
  // Cookie is automatically set
  return data.user;
};
```

### Client-Side: Use Hook

```typescript
"use client";

import { useAnonymousSession } from "@/lib/use-anonymous-session";

export function MyComponent() {
  const { user, createAnonymousUser, isAnonymous } = useAnonymousSession();

  const handleStartAsGuest = () => {
    createAnonymousUser("TABLE-#1", "temp@example.com");
  };

  return (
    <div>
      {isAnonymous && <p>Welcome, {user?.name}!</p>}
      <button onClick={handleStartAsGuest}>Order as Guest</button>
    </div>
  );
}
```

### Server-Side: Get Anonymous User

```typescript
"use server";

import { getAnonymousUser } from "@/lib/anonymous-actions";

export async function processOrder() {
  const anonymousUser = await getAnonymousUser();
  
  if (anonymousUser) {
    // Use anonymousUser.id for order reference
    // This user is NOT in the database
  }
}
```

## Benefits

✅ No database bloat from temporary anonymous users
✅ Automatic session expiration after 24 hours
✅ Secure JWT-signed cookies
✅ Orders still work with anonymous users
✅ No need for cleanup jobs

## Environment Variables

Add to `.env`:
```
JWT_SECRET=your-secret-key-change-in-production
```

## Cookie Details

- **Name**: `anonymous-session`
- **Duration**: 24 hours
- **Secure**: Yes (HTTPS in production)
- **HttpOnly**: Yes (prevents XSS)
- **SameSite**: Lax

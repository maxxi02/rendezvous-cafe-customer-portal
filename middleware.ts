import { NextRequest, NextResponse } from "next/server";

// In-memory storage for anonymous users during their session
const anonymousUsersMemory = new Map<string, any>();

export async function middleware(request: NextRequest) {
  // Check if this is an auth request for anonymous user creation
  if (request.nextUrl.pathname.startsWith("/api/auth")) {
    const response = NextResponse.next();
    
    // Intercept response to check for anonymous user creation
    const clonedResponse = response.clone();
    const contentType = clonedResponse.headers.get("content-type");
    
    if (contentType?.includes("application/json")) {
      try {
        const data = await clonedResponse.json();
        
        // If this is an anonymous user response, store in memory
        if (data.user?.isAnonymous) {
          anonymousUsersMemory.set(data.user.id, data.user);
        }
      } catch (e) {
        // Ignore parsing errors
      }
    }
    
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/auth/:path*"],
};

export { anonymousUsersMemory };

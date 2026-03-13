"use client";

import { useEffect, useState } from "react";
import type { AnonymousUser } from "./anonymous-session";

/**
 * Hook to manage anonymous user session
 * Stores user data in localStorage and session storage, not in database
 */
export function useAnonymousSession() {
  const [user, setUser] = useState<AnonymousUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if there's an anonymous session in localStorage
    const stored = localStorage.getItem("anonymous-user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch (e) {
        localStorage.removeItem("anonymous-user");
      }
    }
    setIsLoading(false);
  }, []);

  const createAnonymousUser = (name: string, email: string) => {
    const newUser: AnonymousUser = {
      id: `anon-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      email,
      isAnonymous: true,
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem("anonymous-user", JSON.stringify(newUser));
    setUser(newUser);
    return newUser;
  };

  const clearAnonymousUser = () => {
    localStorage.removeItem("anonymous-user");
    setUser(null);
  };

  return {
    user,
    isLoading,
    createAnonymousUser,
    clearAnonymousUser,
    isAnonymous: user?.isAnonymous ?? false,
  };
}

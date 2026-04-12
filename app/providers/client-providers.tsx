"use client";

import { useSession } from "@/lib/auth-client";
import { useAnonymousSession } from "@/lib/use-anonymous-session";
import { SocketProvider } from "./socket-provider";
import { BrandingProvider } from "./BrandingProvider";
import { useEffect, useState } from "react";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();
  const { user: anonUser, isLoading: isAnonLoading } = useAnonymousSession();
  const [sessionId, setSessionId] = useState<string | undefined>();

  // Grab the session data from sessionStorage to figure out our room.
  // Use a storage event + one-time read — NOT a polling interval, which
  // would call setSessionId repeatedly and trigger socket reconnects.
  useEffect(() => {
    const readSession = () => {
      const stored = sessionStorage.getItem("orderSession");
      if (!stored) return;
      try {
        const sessionData: any = JSON.parse(stored);
        const sid =
          sessionData.sessionId ||
          sessionData.tableId ||
          "guest-session-" + sessionData.customerName;
        setSessionId((prev) => (prev === sid ? prev : sid));
      } catch (e) {
        console.error("Failed to parse session data", e);
      }
    };

    readSession();

    // Listen for sessionStorage writes from child components (e.g. after session init)
    const onStorage = (e: StorageEvent) => {
      if (e.key === "orderSession") readSession();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []); // run once on mount only

  if (isPending || isAnonLoading) {
    // Don't return null — that unmounts the entire app tree (including cart state).
    // Render children immediately; SocketProvider will connect once userId resolves.
  }

  const effectiveUserId = session?.user?.id || anonUser?.id;
  const effectiveUserName = session?.user?.name || anonUser?.name || "Guest";

  return (
    // BrandingProvider sits outermost so --brand-primary / --primary CSS vars
    // are injected globally before any page renders.
    <BrandingProvider>
      <SocketProvider
        userId={effectiveUserId}
        userName={effectiveUserName}
        userAvatar={session?.user?.image ?? undefined}
        sessionId={sessionId}
      >
        {children}
      </SocketProvider>
    </BrandingProvider>
  );
}

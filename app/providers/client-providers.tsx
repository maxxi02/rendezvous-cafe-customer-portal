"use client";

import { useSession } from "@/lib/auth-client";
import { useAnonymousSession } from "@/lib/use-anonymous-session";
import { SocketProvider } from "./socket-provider";
import { useEffect, useState } from "react";
import { Toaster } from "sonner";

interface SessionData {
  customerName: string;
  tableId?: string;
  qrType: string;
  isAnonymous: boolean;
  lastOrderId?: string;
  sessionId?: string;
}

export function ClientProviders({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();
  const { user: anonUser, isLoading: isAnonLoading } = useAnonymousSession();
  const [sessionId, setSessionId] = useState<string | undefined>();

  // Grab the session data from sessionStorage to figure out our room
  useEffect(() => {
    const syncSession = () => {
      const stored = sessionStorage.getItem("orderSession");
      if (stored) {
        try {
          const sessionData: any = JSON.parse(stored);
          // Priority: persistent sessionId -> tableId -> guest fallback
          const sid =
            sessionData.sessionId ||
            sessionData.tableId ||
            "guest-session-" + sessionData.customerName;

          if (sid !== sessionId) {
            setSessionId(sid);
          }
        } catch (e) {
          console.error("Failed to parse session data", e);
        }
      }
    };

    syncSession();
    // Re-check periodically to catch late-initialized sessions from child components
    const interval = setInterval(syncSession, 2000);
    return () => clearInterval(interval);
  }, [sessionId, session]); // depend on session so it might re-run after they log in

  if (isPending || isAnonLoading) {
    return null; // Or a minimal loading state while we check auth
  }

  const effectiveUserId = session?.user?.id || anonUser?.id;
  const effectiveUserName = session?.user?.name || anonUser?.name || "Guest";

  return (
    <SocketProvider
      userId={effectiveUserId}
      userName={effectiveUserName}
      userAvatar={session?.user?.image ?? undefined}
      sessionId={sessionId}
    >
      {children}
      {/* <Toaster position="" richColors /> */}
    </SocketProvider>
  );
}

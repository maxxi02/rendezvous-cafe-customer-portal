"use client";

import { useSession } from "@/lib/auth-client";
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

  if (isPending) {
    return null; // Or a minimal loading state while we check auth
  }

  return (
    <SocketProvider
      userId={session?.user?.id}
      userName={session?.user?.name || "Guest"}
      userAvatar={session?.user?.image ?? undefined}
      sessionId={sessionId}
    >
      {children}
      <Toaster position="bottom-center" richColors />
    </SocketProvider>
  );
}

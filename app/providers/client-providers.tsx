"use client";

import { useSession } from "@/lib/auth-client";
import { SocketProvider } from "./socket-provider";
import { useEffect, useState } from "react";

interface SessionData {
    customerName: string;
    tableId?: string;
    qrType: string;
    isAnonymous: boolean;
    lastOrderId?: string;
}

export function ClientProviders({ children }: { children: React.ReactNode }) {
    const { data: session, isPending } = useSession();
    const [sessionId, setSessionId] = useState<string | undefined>();

    // Grab the session data from sessionStorage to figure out our room
    useEffect(() => {
        const stored = sessionStorage.getItem("orderSession");
        if (stored) {
            try {
                const sessionData: SessionData = JSON.parse(stored);
                // Customers either join their table's room or a generic guest room
                setSessionId(sessionData.tableId || "guest-session-" + sessionData.customerName);
            } catch (e) {
                console.error("Failed to parse session data", e);
            }
        }
    }, [session]); // depend on session so it might re-run after they log in

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
        </SocketProvider>
    );
}

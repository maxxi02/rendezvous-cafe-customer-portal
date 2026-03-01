"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { QrCode, User, LogIn } from "lucide-react";
import { authClient, useSession } from "@/lib/auth-client";

function OrderLandingContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const tableId = searchParams.get("table");
    const qrType = searchParams.get("type") || "dine-in";

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingTable, setIsLoadingTable] = useState(true);
    const [tableLabel, setTableLabel] = useState<string | null>(null);

    const { data: session, isPending: sessionLoading } = useSession();

    // Fetch Table Info if tableId exists
    useEffect(() => {
        if (!tableId) {
            setIsLoadingTable(false);
            return;
        }

        const fetchTable = async () => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
                const res = await fetch(`${apiUrl}/api/tables`);
                if (res.ok) {
                    const tables = await res.json();
                    const table = tables.find((t: any) => t.tableId === tableId);
                    if (table) {
                        setTableLabel(table.label);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch tables", error);
            } finally {
                setIsLoadingTable(false);
            }
        };

        fetchTable();
    }, [tableId]);

    // Auto-redirect if logged in
    useEffect(() => {
        if (!sessionLoading && session?.user && !isLoadingTable) {
            // They are logged in, so we just set the pending order session and redirect
            // Name is automatically assigned based on table or type
            let automaticName = session.user.name;
            if (tableLabel) automaticName = `Customer ${tableLabel} (${session.user.name})`;
            else if (tableId) automaticName = `Customer ${tableId.replace("-", " #")} (${session.user.name})`;

            const sessionData = {
                customerName: automaticName,
                tableId: tableId || undefined,
                qrType,
                isAnonymous: false,
                userId: session.user.id
            };

            sessionStorage.setItem("orderSession", JSON.stringify(sessionData));
            router.push("/menu");
        }
    }, [session, sessionLoading, isLoadingTable, tableId, qrType, tableLabel, router]);

    const typeLabel =
        qrType === "walk-in"
            ? "Walk-In Order"
            : qrType === "drive-thru"
                ? "Drive-Thru Order"
                : tableLabel
                    ? `Table: ${tableLabel}`
                    : tableId
                        ? `Table: ${tableId.replace("-", " #")}`
                        : "Dine-In Order";

    const handleContinueAsGuest = async () => {
        setIsSubmitting(true);

        // Name is automatically assigned based on table or type
        let automaticName = "Guest";
        if (tableLabel) automaticName = `Customer ${tableLabel}`;
        else if (tableId) automaticName = `Customer ${tableId.replace("-", " #")}`;
        else if (qrType === "walk-in") automaticName = "Walk-In Customer";
        else if (qrType === "drive-thru") automaticName = "Drive-Thru Customer";

        try {
            // Create a real anonymous session using Better Auth
            const res = await authClient.signIn.anonymous();

            if (res.error) {
                console.error("Failed to create anonymous session:", res.error);
                setIsSubmitting(false);
                return;
            }

            // Immediately update their generated placeholder name to the correct guest name
            await authClient.updateUser({
                name: automaticName,
            });

            // Store qrType and tableId for the menu page to use
            sessionStorage.setItem(
                "pendingOrder",
                JSON.stringify({ tableId, qrType }),
            );

            router.push("/menu");
        } catch (error) {
            console.error("Error during anonymous sign in:", error);
            setIsSubmitting(false);
        }
    };

    const handleGoogleSignIn = async () => {
        // Store qrType and tableId for after auth redirect
        sessionStorage.setItem(
            "pendingOrder",
            JSON.stringify({ tableId, qrType }),
        );
        // Redirect to Google OAuth
        window.location.href = `/api/auth/signin/google?callbackUrl=${encodeURIComponent("/menu")}`;
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="w-full max-w-sm">
                {/* Logo & Type */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
                        <QrCode className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-white font-black text-2xl uppercase tracking-widest">
                        RENDEZVOUS<span className="text-primary">.</span>
                    </h1>
                    <p className="text-white/40 text-xs tracking-widest uppercase mt-1">
                        {isLoadingTable ? "Loading Table..." : typeLabel}
                    </p>
                </div>

                {/* Card */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-5">
                    <div>
                        <h2 className="text-white font-bold text-lg mb-1">Welcome!</h2>
                        <p className="text-white/50 text-sm">
                            Continue as a guest or sign in with Google to save points and history.
                        </p>
                    </div>

                    {/* Continue automatically */}
                    <button
                        onClick={handleContinueAsGuest}
                        disabled={isLoadingTable || isSubmitting}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-background font-bold text-sm uppercase tracking-widest hover:bg-white active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <User className="w-4 h-4" />
                        {isSubmitting ? "Starting..." : isLoadingTable ? "Loading..." : "Start Ordering"}
                    </button>

                    {/* Divider */}
                    <div className="flex items-center gap-3">
                        <div className="flex-1 h-px bg-white/10" />
                        <span className="text-white/30 text-xs uppercase tracking-wider">or</span>
                        <div className="flex-1 h-px bg-white/10" />
                    </div>

                    {/* Google Sign In */}
                    <button
                        onClick={handleGoogleSignIn}
                        className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-white/10 text-white font-semibold text-sm hover:bg-white/5 active:scale-[0.98] transition-all"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path
                                fill="#4285F4"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                            />
                            <path
                                fill="#34A853"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                                fill="#FBBC05"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                                fill="#EA4335"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                        </svg>
                        Sign in with Google
                    </button>
                </div>

                {/* Info */}
                <p className="text-center text-white/20 text-[10px] mt-6 uppercase tracking-wider">
                    Powered by Rendezvous POS
                </p>
            </div>
        </div>
    );
}

export default function OrderPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-background flex items-center justify-center">
                    <div className="animate-pulse text-white/30 text-sm">Loading...</div>
                </div>
            }
        >
            <OrderLandingContent />
        </Suspense>
    );
}

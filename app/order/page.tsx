"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function OrderRedirect() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        // Redirect to menu with all existing search params
        const params = searchParams.toString();
        router.replace(`/menu${params ? `?${params}` : ""}`);
    }, [router, searchParams]);

    return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="animate-pulse text-white/30 text-sm uppercase tracking-widest font-black">
                Redirecting to Menu...
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
            <OrderRedirect />
        </Suspense>
    );
}

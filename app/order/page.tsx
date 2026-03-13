"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

function OrderRedirect() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();

    useEffect(() => {
        // Don't redirect if we're on a sub-route like /order/waiting
        if (pathname !== "/order") {
            return;
        }

        // Redirect to menu with all existing search params
        const params = searchParams.toString();
        router.replace(`/menu${params ? `?${params}` : ""}`);
    }, [router, searchParams, pathname]);

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

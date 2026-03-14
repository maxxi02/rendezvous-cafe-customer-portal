"use client";

import Image from "next/image";
import { useSession, signOut } from "@/lib/auth-client";

interface MenuAuthActionsProps {
    openAuth: () => void;
}

export function MenuAuthActions({ openAuth }: MenuAuthActionsProps) {
    const { data: session, isPending } = useSession();

    if (isPending) return (
        <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse" />
    );

    if (session?.user) {
        return (
            <div className="flex items-center gap-3">
                {/* Google Avatar */}
                <Image
                    src={session.user.image ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(session.user.name ?? "U")}&background=064e3b&color=fbbf24`}
                    alt={session.user.name ?? "User"}
                    referrerPolicy="no-referrer"
                    className="w-9 h-9 rounded-full border-2 border-primary object-cover"
                    width={500}
                    height={500}
                />
                <button
                    onClick={() => signOut()}
                    className="hidden md:block border border-white/20 text-white/60 px-4 py-2 rounded-full font-black text-[10px] tracking-widest uppercase hover:border-red-400 hover:text-red-400 transition-all duration-300"
                >
                    Sign Out
                </button>
            </div>
        );
    }

    return (
        <button
            onClick={openAuth}
            className="border border-white/20 text-white/80 px-4 py-2 rounded-full font-black text-xs tracking-widest uppercase hover:border-primary hover:text-primary transition-all duration-300"
        >
            Log In
        </button>
    );
}

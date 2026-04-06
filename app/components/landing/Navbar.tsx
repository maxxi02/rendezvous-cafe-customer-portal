"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { ShoppingBag, Menu, X } from "lucide-react";
import { useSession, signOut } from "@/lib/auth-client";
import Image from "next/image";
import { AuthModal } from "@/app/components/shared/AuthModal";

function NavActions({ openAuth }: { openAuth: () => void }) {
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
                <span className="hidden md:block text-white/80 font-bold text-sm">
                    {session.user.name?.split(" ")[0]}
                </span>
                <button
                    onClick={() => signOut()}
                    className="hidden md:block border border-white/20 text-white/60 px-5 py-2.5 rounded-full font-black text-xs tracking-widest uppercase hover:border-red-400 hover:text-red-400 transition-all duration-300"
                >
                    Sign Out
                </button>
            </div>
        );
    }

    return (
        <button
            onClick={openAuth}
            className="hidden md:block px-5 py-2.5 rounded-full font-black text-xs tracking-widest uppercase transition-all duration-300 hover:text-primary"
            style={{
                border: "1px solid rgba(255,255,255,0.2)",
                color: "rgba(255,255,255,0.8)",
            }}
            onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "#E8621A";
                (e.currentTarget as HTMLButtonElement).style.color = "#E8621A";
            }}
            onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.2)";
                (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.8)";
            }}
        >
            Log In
        </button>
    );
}

function MobileNavActions({ openAuth, closeMenu }: { openAuth: () => void, closeMenu: () => void }) {
    const { data: session, isPending } = useSession();

    if (isPending) return (
        <div className="w-full h-12 rounded-full bg-white/10 animate-pulse mt-4" />
    );

    if (session?.user) {
        return (
            <button
                onClick={() => {
                    signOut();
                    closeMenu();
                }}
                className="border border-red-500/50 text-red-400 px-6 py-3 rounded-full font-black text-sm tracking-widest uppercase text-center hover:bg-red-500/10 hover:border-red-400 transition-all duration-300 mt-4"
            >
                Log Out
            </button>
        );
    }

    return (
        <button
            onClick={openAuth}
            className="border border-white/20 text-white/80 px-6 py-3 rounded-full font-black text-sm tracking-widest uppercase text-center hover:border-primary hover:text-primary transition-all duration-300 mt-4"
        >
            Log In
        </button>
    );
}

// ─── Nav links ─────────────────────────────────────────────────────────────────
const navLinks = [
    { label: "Home", href: "/" },
    { label: "Stories", href: "/stories" },
];

// ─── Inner navbar — uses useSearchParams, must be inside Suspense ──────────────
function NavbarInner() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [authOpen, setAuthOpen] = useState(false);

    const callbackURL = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const openAuth = () => {
        setAuthOpen(true);
        setMobileOpen(false);
    };

    return (
        <>
            <nav
                className={`fixed top-0 left-0 right-0 z-50 px-6 py-4 md:px-12 transition-all duration-500 ${
                    scrolled
                        ? "backdrop-blur-md shadow-lg shadow-black/30"
                        : ""
                }`}
                style={{
                    background: scrolled
                        ? "rgba(10,10,10,0.92)"
                        : "rgba(10,10,10,0.75)",
                    borderBottom: "1px solid rgba(232,98,26,0.12)",
                }}
            >
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2">
                        <span
                            className="font-black-han text-2xl tracking-wider uppercase text-white transition-all duration-300"
                        >
                            RENDEZVOUS<span style={{ color: "#E8621A" }}>.</span>
                        </span>
                    </Link>

                    {/* Desktop nav links */}
                    <div className="hidden md:flex items-center gap-10 text-[11px] font-black tracking-[0.2em] uppercase">
                        {navLinks.map((link) => (
                            <Link
                                key={link.label}
                                href={link.href}
                                className={`relative pb-1 transition-colors duration-300 hover:text-primary group ${
                                    pathname === link.href ? "text-primary" : "text-white/75"
                                }`}
                            >
                                {link.label}
                                <span
                                    className={`absolute bottom-0 left-0 h-0.5 transition-all duration-300 ${
                                        pathname === link.href
                                            ? "w-full"
                                            : "w-0 group-hover:w-full"
                                    }`}
                                    style={{ background: "#E8621A" }}
                                />
                            </Link>
                        ))}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                        <button
                            aria-label="Cart"
                            className="w-10 h-10 flex items-center justify-center rounded-full hover:scale-110 transition-all duration-300"
                            style={{ background: "#E8621A" }}
                        >
                            <ShoppingBag size={17} strokeWidth={2.5} className="text-white" />
                        </button>

                        <NavActions openAuth={openAuth} />

                        <button
                            className="md:hidden text-white ml-1"
                            onClick={() => setMobileOpen((v) => !v)}
                            aria-label="Toggle menu"
                        >
                            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile Drawer */}
            <div
                className={`fixed inset-0 z-40 md:hidden transition-all duration-500 ${mobileOpen ? "visible" : "invisible"
                    }`}
            >
                <div
                    className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-500 ${mobileOpen ? "opacity-100" : "opacity-0"
                        }`}
                    onClick={() => setMobileOpen(false)}
                />
                <div
                    className={`absolute top-0 right-0 h-full w-72 bg-background flex flex-col pt-24 px-8 gap-6 shadow-2xl transition-transform duration-500 ${mobileOpen ? "translate-x-0" : "translate-x-full"
                        }`}
                >
                    {navLinks.map((link) => (
                        <Link
                            key={link.label}
                            href={link.href}
                            onClick={() => setMobileOpen(false)}
                            className={`text-2xl font-black uppercase tracking-widest hover:text-primary transition-colors duration-300 border-b border-white/10 pb-4 ${pathname === link.href ? "text-primary" : "text-white"
                                }`}
                        >
                            {link.label}
                        </Link>
                    ))}

                    <div className="flex flex-col gap-3 mt-2">
                        <MobileNavActions
                            openAuth={openAuth}
                            closeMenu={() => setMobileOpen(false)}
                        />
                    </div>
                </div>
            </div>

            <AuthModal
                isOpen={authOpen}
                onClose={() => setAuthOpen(false)}
                callbackURL={callbackURL}
            />
        </>
    );
}

// ─── Navbar — wraps inner in Suspense so useSearchParams doesn't break SSG ────
export default function Navbar() {
    return (
        <Suspense fallback={null}>
            <NavbarInner />
        </Suspense>
    );
}
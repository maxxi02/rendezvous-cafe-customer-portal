"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { ShoppingBag, Menu, X, Coffee } from "lucide-react";
import { signIn } from "@/lib/auth-client";
import { useSession, signOut } from "@/lib/auth-client";
import Image from "next/image";

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
                    src={session.user.image ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(session.user.name ?? "U")}&background=064E3B&color=FBBF24`}
                    alt={session.user.name ?? "User"}
                    referrerPolicy="no-referrer"
                    className="w-9 h-9 rounded-full border-2 border-[#FBBF24] object-cover"
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
            className="hidden md:block border border-white/20 text-white/80 px-5 py-2.5 rounded-full font-black text-xs tracking-widest uppercase hover:border-[#FBBF24] hover:text-[#FBBF24] transition-all duration-300"
        >
            Log In
        </button>
    );
}


// ─── Google Icon ───────────────────────────────────────────────────────────────
function GoogleIcon() {
    return (
        <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
    );
}

// ─── Auth Modal ────────────────────────────────────────────────────────────────
interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

function AuthModal({ isOpen, onClose }: AuthModalProps) {
    // Lock body scroll
    useEffect(() => {
        document.body.style.overflow = isOpen ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal card */}
            <div className="relative w-full max-w-sm bg-[#064E3B] rounded-3xl shadow-2xl shadow-black/50 overflow-hidden border border-white/10">
                {/* Amber top bar */}
                <div className="h-1 w-full bg-linear-to-r from-[#FBBF24] via-amber-300 to-[#FBBF24]" />

                {/* Close button */}
                <button
                    onClick={onClose}
                    aria-label="Close"
                    className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors duration-200"
                >
                    <X size={16} />
                </button>

                <div className="px-8 pt-8 pb-10 flex flex-col items-center text-center">
                    {/* Brand mark */}
                    <div className="flex items-center gap-2 mb-8">
                        <div className="w-9 h-9 rounded-full bg-[#FBBF24] flex items-center justify-center shadow-lg shadow-amber-400/30">
                            <Coffee size={18} className="text-[#064E3B]" strokeWidth={2.5} />
                        </div>
                        <span className="text-xl font-black tracking-wider uppercase text-white">
                            RENDEZVOUS<span className="text-[#FBBF24]">.</span>
                        </span>
                    </div>

                    {/* Heading */}
                    <h2 className="text-2xl font-black uppercase tracking-tight text-white mb-2">
                        Welcome back.
                    </h2>
                    <p className="text-white/40 text-sm font-medium mb-8 leading-relaxed">
                        Sign in to access your orders and rewards.
                    </p>

                    {/* Google OAuth */}
                    <button
                        onClick={async () => {
                            await signIn.social({
                                provider: "google",
                                callbackURL: "/",
                            });
                        }}
                        className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 py-4 px-6 rounded-2xl font-bold text-sm hover:bg-gray-50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-lg shadow-black/20"
                    >
                        <GoogleIcon />
                        <span>Continue with Google</span>
                    </button>

                    {/* Fine print */}
                    <p className="text-white/20 text-xs mt-6 leading-relaxed">
                        By continuing, you agree to our{" "}
                        <Link href="/terms" className="underline hover:text-white/50 transition-colors">
                            Terms
                        </Link>{" "}
                        and{" "}
                        <Link href="/privacy" className="underline hover:text-white/50 transition-colors">
                            Privacy Policy
                        </Link>.
                    </p>
                </div>
            </div>
        </div>
    );
}

// ─── Nav links ─────────────────────────────────────────────────────────────────
const navLinks = [
    { label: "Home", href: "/" },
    { label: "Coffee", href: "/coffee" },
    { label: "Menu", href: "/menu" },
];

// ─── Navbar ────────────────────────────────────────────────────────────────────
export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [authOpen, setAuthOpen] = useState(false);

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
                className={`fixed top-0 left-0 right-0 z-50 px-6 py-5 md:px-12 transition-all duration-500 ${scrolled
                    ? "bg-[#064E3B]/90 backdrop-blur-md shadow-lg shadow-black/20"
                    : "bg-transparent"
                    }`}
            >
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2">
                        <span className="text-3xl font-black tracking-wider uppercase text-white transition-all duration-300">
                            RENDEZVOUS<span className="text-[#FBBF24]">.</span>
                        </span>
                    </Link>

                    {/* Desktop nav links */}
                    <div className="hidden md:flex items-center gap-8 text-sm font-bold tracking-widest uppercase">
                        {navLinks.map((link) => (
                            <Link
                                key={link.label}
                                href={link.href}
                                className={`relative pb-1 transition-colors duration-300 hover:text-[#FBBF24] group ${link.label === "Home" ? "text-[#FBBF24]" : "text-white/80"
                                    }`}
                            >
                                {link.label}
                                <span
                                    className={`absolute bottom-0 left-0 h-0.5 bg-[#FBBF24] transition-all duration-300 ${link.label === "Home" ? "w-full" : "w-0 group-hover:w-full"
                                        }`}
                                />
                            </Link>
                        ))}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                        {/* Cart */}
                        <button
                            aria-label="Cart"
                            className="w-10 h-10 flex items-center justify-center bg-[#FBBF24] text-[#064E3B] rounded-full hover:scale-110 hover:bg-white transition-all duration-300 shadow-lg shadow-amber-400/30"
                        >
                            <ShoppingBag size={18} strokeWidth={2.5} />
                        </button>

                        <NavActions openAuth={openAuth} />

                        {/* Mobile hamburger */}
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
                    className={`absolute top-0 right-0 h-full w-72 bg-[#064E3B] flex flex-col pt-24 px-8 gap-6 shadow-2xl transition-transform duration-500 ${mobileOpen ? "translate-x-0" : "translate-x-full"
                        }`}
                >
                    {navLinks.map((link) => (
                        <Link
                            key={link.label}
                            href={link.href}
                            onClick={() => setMobileOpen(false)}
                            className="text-2xl font-black uppercase tracking-widest text-white hover:text-[#FBBF24] transition-colors duration-300 border-b border-white/10 pb-4"
                        >
                            {link.label}
                        </Link>
                    ))}

                    {/* Mobile auth button */}
                    <div className="flex flex-col gap-3 mt-2">
                        <button
                            onClick={openAuth}
                            className="border border-white/20 text-white/80 px-6 py-3 rounded-full font-black text-sm tracking-widest uppercase text-center hover:border-[#FBBF24] hover:text-[#FBBF24] transition-all duration-300"
                        >
                            Log In
                        </button>
                    </div>
                </div>
            </div>

            {/* Auth Modal */}
            <AuthModal
                isOpen={authOpen}
                onClose={() => setAuthOpen(false)}
            />
        </>
    );
}
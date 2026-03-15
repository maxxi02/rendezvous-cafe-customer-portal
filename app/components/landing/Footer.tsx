import Link from "next/link";

const footerLinks = [
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
    { label: "Contact", href: "/contact" },
];

function FacebookIcon() {
    return (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
    );
}

function InstagramIcon() {
    return (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
        </svg>
    );
}

export default function Footer() {
    return (
        <footer className="bg-background py-12 px-6">
            <div className="max-w-7xl mx-auto">
                {/* Top divider */}
                <div className="border-t border-white/10 pt-12 flex flex-col md:flex-row justify-between items-center gap-8">
                    {/* Logo */}
                    <Link href="/" className="group">
                        <span className="text-2xl font-black tracking-wider uppercase text-white group-hover:text-primary transition-colors duration-300">
                            RENDEZVOUS<span className="text-primary">.</span>
                        </span>
                    </Link>

                    {/* Links */}
                    <div className="flex gap-8 text-sm font-bold text-white/50">
                        {footerLinks.map((link) => (
                            <Link
                                key={link.label}
                                href={link.href}
                                className="hover:text-primary transition-colors duration-300"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    {/* Social icons */}
                    <div className="flex gap-3">
                        <a
                            href="https://www.facebook.com/RendezvousCafePH"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Facebook"
                            className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 text-white hover:bg-primary hover:text-background transition-all duration-300"
                        >
                            <FacebookIcon />
                        </a>
                        <a
                            href="https://www.instagram.com/rendezvouscafeph?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Instagram"
                            className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 text-white hover:bg-primary hover:text-background transition-all duration-300"
                        >
                            <InstagramIcon />
                        </a>
                    </div>
                </div>

                {/* Bottom copyright */}
                <p className="text-center mt-10 text-xs font-bold text-white/25 uppercase tracking-[0.3em]">
                    © {new Date().getFullYear()} Rendezvous Cafe. All rights
                    reserved.
                </p>
            </div>
        </footer>
    );
}
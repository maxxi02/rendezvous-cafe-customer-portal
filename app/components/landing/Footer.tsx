"use client";

import { useState } from "react";
import { X } from "lucide-react";

// ─── Modal types ───────────────────────────────────────────────────────────────
type ModalType = "privacy" | "terms" | "contact" | null;

// ─── Policy content ────────────────────────────────────────────────────────────
const PRIVACY_CONTENT = (
  <div className="space-y-6 text-sm text-white/70 leading-relaxed">
    <p className="text-xs uppercase tracking-[0.3em] text-white/30 font-bold">Last updated: April 2025</p>

    <section className="space-y-2">
      <h3 className="text-white font-black uppercase tracking-wider text-base">1. Information We Collect</h3>
      <p>When you use the Rendezvous Café Customer Portal, we may collect the following types of information:</p>
      <ul className="list-disc list-inside space-y-1 pl-2">
        <li>Name and email address (when you log in via Google)</li>
        <li>Order history, preferences, and session data</li>
        <li>Device type, browser, and general location (for analytics)</li>
        <li>Feedback and ratings you submit</li>
      </ul>
    </section>

    <section className="space-y-2">
      <h3 className="text-white font-black uppercase tracking-wider text-base">2. How We Use Your Information</h3>
      <ul className="list-disc list-inside space-y-1 pl-2">
        <li>To process and fulfill your orders</li>
        <li>To personalize your experience and remember your preferences</li>
        <li>To communicate order updates and promotions</li>
        <li>To improve our services and customer experience</li>
      </ul>
    </section>

    <section className="space-y-2">
      <h3 className="text-white font-black uppercase tracking-wider text-base">3. Data Sharing</h3>
      <p>We do not sell, trade, or rent your personal information to third parties. We may share data with service providers strictly required to operate the portal (e.g., payment processors, cloud storage).</p>
    </section>

    <section className="space-y-2">
      <h3 className="text-white font-black uppercase tracking-wider text-base">4. Cookies & Sessions</h3>
      <p>We use session storage and cookies to maintain your ordering session and cart state. No tracking cookies are used for advertising purposes.</p>
    </section>

    <section className="space-y-2">
      <h3 className="text-white font-black uppercase tracking-wider text-base">5. Data Retention</h3>
      <p>Your order data is retained for a minimum of 12 months for operational and legal compliance purposes. Anonymous session data is purged within 24 hours of your session ending.</p>
    </section>

    <section className="space-y-2">
      <h3 className="text-white font-black uppercase tracking-wider text-base">6. Your Rights</h3>
      <p>You have the right to access, correct, or request deletion of your personal data. To exercise these rights, please contact us using the Contact form.</p>
    </section>

    <section className="space-y-2">
      <h3 className="text-white font-black uppercase tracking-wider text-base">7. Changes to This Policy</h3>
      <p>We reserve the right to update this Privacy Policy at any time. Changes are effective immediately upon posting. Continued use of the portal constitutes acceptance of the revised policy.</p>
    </section>
  </div>
);

const TERMS_CONTENT = (
  <div className="space-y-6 text-sm text-white/70 leading-relaxed">
    <p className="text-xs uppercase tracking-[0.3em] text-white/30 font-bold">Last updated: April 2025</p>

    <section className="space-y-2">
      <h3 className="text-white font-black uppercase tracking-wider text-base">1. Acceptance of Terms</h3>
      <p>By accessing or using the Rendezvous Café Customer Portal, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the portal.</p>
    </section>

    <section className="space-y-2">
      <h3 className="text-white font-black uppercase tracking-wider text-base">2. Ordering</h3>
      <ul className="list-disc list-inside space-y-1 pl-2">
        <li>All orders placed through the portal are subject to availability and confirmation</li>
        <li>Prices are displayed in Philippine Peso (₱) and are inclusive of applicable taxes</li>
        <li>We reserve the right to cancel or modify orders due to operational constraints</li>
        <li>By placing an order you confirm the accuracy of your provided details</li>
      </ul>
    </section>

    <section className="space-y-2">
      <h3 className="text-white font-black uppercase tracking-wider text-base">3. Payment</h3>
      <p>Payments are processed securely through our integrated payment gateway. Rendezvous Café does not store full card details. For GCash payments, you will be redirected to the GCash payment page.</p>
    </section>

    <section className="space-y-2">
      <h3 className="text-white font-black uppercase tracking-wider text-base">4. Refunds & Cancellations</h3>
      <p>Orders may be cancelled before preparation begins. Once preparation has started, cancellations are at the discretion of the café staff. Refunds for valid cancellations will be processed within 5–7 business days.</p>
    </section>

    <section className="space-y-2">
      <h3 className="text-white font-black uppercase tracking-wider text-base">5. User Accounts</h3>
      <p>You are responsible for maintaining the confidentiality of your account credentials. You agree not to use another person's account or share access to your account.</p>
    </section>

    <section className="space-y-2">
      <h3 className="text-white font-black uppercase tracking-wider text-base">6. Prohibited Conduct</h3>
      <ul className="list-disc list-inside space-y-1 pl-2">
        <li>Placing fraudulent or false orders</li>
        <li>Attempting to interfere with or disrupt the portal's operation</li>
        <li>Submitting offensive or abusive content in feedback or stories</li>
      </ul>
    </section>

    <section className="space-y-2">
      <h3 className="text-white font-black uppercase tracking-wider text-base">7. Limitation of Liability</h3>
      <p>Rendezvous Café shall not be liable for any indirect, incidental, or consequential damages arising from the use of this portal. Our liability is limited to the value of the order in question.</p>
    </section>

    <section className="space-y-2">
      <h3 className="text-white font-black uppercase tracking-wider text-base">8. Governing Law</h3>
      <p>These Terms are governed by the laws of the Republic of the Philippines. Any disputes shall be resolved in the appropriate courts of jurisdiction.</p>
    </section>
  </div>
);

const CONTACT_CONTENT = (
  <div className="space-y-6 text-sm text-white/70 leading-relaxed">
    <p>Have a question, concern, or feedback? We'd love to hear from you.</p>

    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-xs font-bold uppercase tracking-widest text-white/50">Name</label>
        <input
          type="text"
          placeholder="Your full name"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-[var(--brand-primary)] transition-colors duration-200 text-sm"
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-bold uppercase tracking-widest text-white/50">Email</label>
        <input
          type="email"
          placeholder="your@email.com"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-[var(--brand-primary)] transition-colors duration-200 text-sm"
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-bold uppercase tracking-widest text-white/50">Message</label>
        <textarea
          rows={4}
          placeholder="How can we help you?"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-[var(--brand-primary)] transition-colors duration-200 text-sm resize-none"
        />
      </div>
      <button
        className="w-full py-3 rounded-xl font-black text-xs uppercase tracking-widest text-white transition-all duration-300 active:scale-95"
        style={{ background: "var(--brand-gradient)" }}
      >
        Send Message
      </button>
    </div>

    <div className="pt-2 border-t border-white/10 space-y-2">
      <p className="text-xs text-white/40 uppercase tracking-widest font-bold">Or reach us directly</p>
      <p className="text-white/60">📍 Rendezvous Café, Philippines</p>
      <p className="text-white/60">📘 <a href="https://www.facebook.com/RendezvousCafePH" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--brand-primary)] transition-colors duration-200">facebook.com/RendezvousCafePH</a></p>
      <p className="text-white/60">📸 <a href="https://www.instagram.com/rendezvouscafeph" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--brand-primary)] transition-colors duration-200">instagram.com/rendezvouscafeph</a></p>
    </div>
  </div>
);

// ─── Modal titles ──────────────────────────────────────────────────────────────
const MODAL_CONFIG: Record<NonNullable<ModalType>, { title: string; content: React.ReactNode }> = {
  privacy:  { title: "Privacy Policy",    content: PRIVACY_CONTENT },
  terms:    { title: "Terms of Service",  content: TERMS_CONTENT },
  contact:  { title: "Contact Us",        content: CONTACT_CONTENT },
};

// ─── Policy Modal ──────────────────────────────────────────────────────────────
function PolicyModal({ type, onClose }: { type: NonNullable<ModalType>; onClose: () => void }) {
  const { title, content } = MODAL_CONFIG[type];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative w-full sm:max-w-2xl max-h-[90dvh] flex flex-col rounded-t-3xl sm:rounded-3xl overflow-hidden"
        style={{
          background: "rgba(12,10,8,0.97)",
          border: "1px solid rgba(var(--brand-primary-rgb),0.2)",
          boxShadow: "0 0 80px -10px rgba(var(--brand-primary-rgb),0.2)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
          <h2
            className="text-xl uppercase tracking-widest text-white"
            style={{ fontFamily: "var(--brand-logo-font)", fontWeight: 400 }}
          >
            {title}
            <span style={{ color: "var(--brand-primary)" }}>.</span>
          </h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all duration-200"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          {content}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl font-black text-xs uppercase tracking-widest text-white/70 border border-white/10 hover:border-white/30 hover:text-white transition-all duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Social icons ──────────────────────────────────────────────────────────────
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

// ─── Footer ────────────────────────────────────────────────────────────────────
export default function Footer() {
  const [modal, setModal] = useState<ModalType>(null);

  const footerLinks: { label: string; modal: NonNullable<ModalType> }[] = [
    { label: "Privacy",  modal: "privacy" },
    { label: "Terms",    modal: "terms" },
    { label: "Contact",  modal: "contact" },
  ];

  return (
    <>
      <footer className="bg-background py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="border-t border-white/10 pt-12 flex flex-col md:flex-row justify-between items-center gap-8">

            {/* Logo */}
            <a href="/" className="group">
              <span
                className="text-2xl tracking-wider uppercase text-white transition-colors duration-300 group-hover:text-[var(--brand-primary)]"
                style={{ fontFamily: "var(--brand-logo-font)", fontWeight: 400 }}
              >
                RENDEZVOUS<span style={{ color: "var(--brand-primary)" }}>.</span>
              </span>
            </a>

            {/* Links → open modals */}
            <div className="flex gap-8 text-sm font-bold text-white/50">
              {footerLinks.map((link) => (
                <button
                  key={link.label}
                  onClick={() => setModal(link.modal)}
                  className="hover:text-[var(--brand-primary)] transition-colors duration-300 cursor-pointer"
                >
                  {link.label}
                </button>
              ))}
            </div>

            {/* Social icons */}
            <div className="flex gap-3">
              <a
                href="https://www.facebook.com/RendezvousCafePH"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 text-white transition-all duration-300"
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.background = "var(--brand-primary)";
                  (e.currentTarget as HTMLAnchorElement).style.color = "#000";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.05)";
                  (e.currentTarget as HTMLAnchorElement).style.color = "white";
                }}
              >
                <FacebookIcon />
              </a>
              <a
                href="https://www.instagram.com/rendezvouscafeph?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 text-white transition-all duration-300"
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.background = "var(--brand-primary)";
                  (e.currentTarget as HTMLAnchorElement).style.color = "#000";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.05)";
                  (e.currentTarget as HTMLAnchorElement).style.color = "white";
                }}
              >
                <InstagramIcon />
              </a>
            </div>
          </div>

          {/* Copyright */}
          <p className="text-center mt-10 text-xs font-bold text-white/25 uppercase tracking-[0.3em]">
            © {new Date().getFullYear()} Rendezvous Cafe. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Policy / Contact Modal */}
      {modal && <PolicyModal type={modal} onClose={() => setModal(null)} />}
    </>
  );
}

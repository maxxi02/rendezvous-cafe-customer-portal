"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export interface Branding {
  primaryColor: string;
  accentColor:  string;
  logoText:     string;
  logoUrl:      string;
  logoFont:     string; // Google Font family name e.g. "Cardo"
}

export const DEFAULT_BRANDING: Branding = {
  primaryColor: "#E8621A",
  accentColor:  "#8B3A00",
  logoText:     "RENDEZVOUS",
  logoUrl:      "",
  logoFont:     "Cardo",
};

/** Map of curated font names → Google Fonts URL weight/variant string */
export const LOGO_FONTS: { name: string; label: string; variants: string }[] = [
  { name: "Cardo",              label: "Cardo (Serif)",            variants: "ital,wght@0,400;0,700;1,400" },
  { name: "Playfair Display",   label: "Playfair Display (Serif)", variants: "ital,wght@0,400;0,700;1,400" },
  { name: "Cormorant Garamond", label: "Cormorant Garamond",       variants: "ital,wght@0,300;0,400;0,600;1,400" },
  { name: "Lora",               label: "Lora (Serif)",             variants: "ital,wght@0,400;0,700;1,400" },
  { name: "Cinzel",             label: "Cinzel (Elegant)",         variants: "wght@400;700;900" },
  { name: "Bebas Neue",         label: "Bebas Neue (Bold)",        variants: "" },
  { name: "Montserrat",         label: "Montserrat (Modern)",      variants: "wght@400;700;900" },
  { name: "Raleway",            label: "Raleway (Geometric)",      variants: "wght@400;700;900" },
  { name: "Dancing Script",     label: "Dancing Script (Script)",  variants: "wght@600;700" },
  { name: "Pacifico",           label: "Pacifico (Friendly)",      variants: "" },
  { name: "Black Han Sans",     label: "Black Han Sans (Display)", variants: "" },
];

// ─── Context ──────────────────────────────────────────────────────────────────
const BrandingContext = createContext<Branding>(DEFAULT_BRANDING);

/** Hook to read branding from anywhere in the app */
export function useBranding(): Branding {
  return useContext(BrandingContext);
}

// ─── Utility: convert hex → "r g b" for CSS oklch fallback ───────────────────
function hexToRgbStr(hex: string): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return "232 98 26";
  return `${r} ${g} ${b}`;
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function BrandingProvider({ children }: { children: ReactNode }) {
  const [branding, setBranding] = useState<Branding>(DEFAULT_BRANDING);

  useEffect(() => {
    fetch(`${API_URL}/api/settings/portal`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.branding) {
          const merged = { ...DEFAULT_BRANDING, ...data.branding };
          setBranding(merged);
        }
      })
      .catch(() => {/* use defaults silently */});
  }, []);

  // ── Colour vars ────────────────────────────────────────────────────────────
  useEffect(() => {
    const root = document.documentElement;
    const p = branding.primaryColor || DEFAULT_BRANDING.primaryColor;
    const a = branding.accentColor  || DEFAULT_BRANDING.accentColor;

    root.style.setProperty("--brand-primary",     p);
    root.style.setProperty("--brand-accent",      a);
    root.style.setProperty("--brand-primary-rgb", hexToRgbStr(p));
    root.style.setProperty("--brand-accent-rgb",  hexToRgbStr(a));
    root.style.setProperty("--brand-gradient",    `linear-gradient(135deg, ${p} 0%, ${a} 100%)`);
    root.style.setProperty("--primary",           `rgb(${hexToRgbStr(p)})`);
  }, [branding.primaryColor, branding.accentColor]);

  // ── Logo font ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const fontName = branding.logoFont || DEFAULT_BRANDING.logoFont;
    const fontEntry = LOGO_FONTS.find((f) => f.name === fontName);

    // Dynamically load the Google Font (if not already present)
    const linkId = "brand-logo-font-link";
    let link = document.getElementById(linkId) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.id   = linkId;
      link.rel  = "stylesheet";
      document.head.appendChild(link);
    }

    const slug = fontName.replace(/ /g, "+");
    const variants = fontEntry?.variants;
    link.href = variants
      ? `https://fonts.googleapis.com/css2?family=${slug}:${variants}&display=swap`
      : `https://fonts.googleapis.com/css2?family=${slug}&display=swap`;

    // Set the CSS var — components use fontFamily: "var(--brand-logo-font)"
    document.documentElement.style.setProperty(
      "--brand-logo-font",
      `'${fontName}', Georgia, serif`
    );
  }, [branding.logoFont]);

  return (
    <BrandingContext.Provider value={branding}>
      {children}
    </BrandingContext.Provider>
  );
}

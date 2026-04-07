"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { X, ChevronLeft, ChevronRight, ShoppingBag } from "lucide-react";
import { AddonModal } from "@/app/menu/_components/AddonModal";
import type { SelectedAddon } from "@/app/types/order.type";
import { useLenisRef } from "@/app/providers/LenisProvider";

interface AddonItem { name: string; price: number; }
interface AddonGroup { name: string; required: boolean; multiSelect: boolean; items: AddonItem[]; }

interface FeaturedProduct {
  _id?: string;
  name: string;
  label: string;
  description: string;
  price?: number;
  imageUrl: string;
  addonGroups?: AddonGroup[];
}

// ─── Fallback configs ─────────────────────────────────────────────────────────
const TARGET_CONFIGS = [
  { search: "crispy chicksilog",                                 defaultLabel: "CHICKSILOG", defaultName: "Crispy" },
  { search: "jumbo hungarian sausilog|jumbo hangarian sausilog", defaultLabel: "SAUSILOG",   defaultName: "Jumbo Hungarian" },
  { search: "special taal tapsilog",                             defaultLabel: "TAPSILOG",   defaultName: "Special Taal" },
];

const FALLBACK_IMAGES: Record<string, string> = {
  "crispy chicksilog":
    "https://lh3.googleusercontent.com/aida-public/AB6AXuDKshH7TVmaJgSQVcCh_YWiz7WORk1TkgnQzRPXzJVw009BYbaa9YnjlChT1eyvP-WU-MhHtQfKZ_kBpCDiBgke0XUFrNyixSWgpoRFVeZczVJJrw0okoxN2l4Qw--7aFrJpVP1fBHYHqMX9oiH9ndsFbmjaO91IrY1-DInqWFxj9e0lVWIS-ThjtgjoHwREdUzP5va3nVKc9jq1fvyduE1t5ejM9PbWxUZyypbDKOfGqNyZY_YjjnH6nC4vmog4ARysZPNqLS11Vw",
  "jumbo hungarian sausilog":
    "https://lh3.googleusercontent.com/aida-public/AB6AXuDYNq7NwMy2hzIp6v1QafoeQ8EGNjOBLMDIgN9F7roxor8sLJ_GATFQ0fyTQybRMt0Y0vlbvZEyFUCbY6K4cX2xB0bt3o6MoztrvjDvzoZTP5e8QBfHH8YWVwWdVPUjynpIK8BNkVFH8yLE5aW1sBJg050yr5dexvcizU_70Wi5ZwZ5yC5pmBPLZLLCLAZpfImej7HHTMKPs1L_cy0T5AvePUr5g7bk3xcIw3tzX2M-d3l1RjzP4gBwIO7bVhUOT_NGTHCZRPoYoa8",
  "special taal tapsilog":
    "https://lh3.googleusercontent.com/aida-public/AB6AXuBvqTwZc8qcN-AzHK5_aTvSbiHvEJA6pLWO5WlUK2JReZpVPaFn1GMdQS_2CaWWam5GDfAO-N0Q9-TsuOD10x-XgkECYs9MrsqziKdowQeRzWTcKdpTDphjAgEN0YBieGWjs19aCYChPi7HRdmvYEpRJmzUJPhNQ2z6k-IkT9n3-pZDigBSwlURyDdKwO5vjoXIN-OBXrw98v-m9xOOQbgRrM9VnU4GcZkzdrbcrYlRUkd6C8u2_x9CtoR-SGNoFLkeJIpS3L_uG0U",
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

function splitProductName(fullName: string): { name: string; label: string } {
  const parts = fullName.trim().split(" ");
  const label = parts.length > 1 ? parts[parts.length - 1].toUpperCase() : "";
  // name is always the FULL product name — we never truncate it for display
  return { name: fullName, label };
}

async function fetchFallbackProducts(): Promise<FeaturedProduct[]> {
  const res = await fetch(`${API_URL}/api/products/categories`);
  if (!res.ok) return [];
  const categories = await res.json();
  let allProducts: any[] = [];
  if (Array.isArray(categories)) {
    categories.forEach((cat: any) => {
      if (Array.isArray(cat.products)) allProducts = [...allProducts, ...cat.products];
    });
  }
  return TARGET_CONFIGS.map((config) => {
    const matched = allProducts.find((p) => {
      const pName = p.name?.toLowerCase() || "";
      return config.search.split("|").some((s) => pName.includes(s));
    });
    if (matched) {
      const { label } = splitProductName(matched.name);
      return {
        _id: matched._id,
        name: matched.name,
        label: label || config.defaultLabel,
        description: matched.description || "",
        price: matched.price,
        imageUrl: matched.imageUrl || FALLBACK_IMAGES[config.search.split("|")[0]] || "",
        addonGroups: matched.addonGroups || [],
      };
    }
    return { name: `${config.defaultName} ${config.defaultLabel}`, label: config.defaultLabel, description: "", imageUrl: FALLBACK_IMAGES[config.search.split("|")[0]] || "" };
  });
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function HeroSection() {
  const router = useRouter();
  const lenisRef = useLenisRef();
  const [queryString, setQueryString] = useState("");
  const [products, setProducts] = useState<FeaturedProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [scrollY, setScrollY] = useState(0);

  // Carousel state (infinite — we duplicate items)
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragDelta, setDragDelta] = useState(0);
  const animatingRef = useRef(false);

  // Lightbox
  const [selectedProduct, setSelectedProduct] = useState<FeaturedProduct | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMounted, setModalMounted] = useState(false);

  // Addon modal
  const [addonProduct, setAddonProduct] = useState<FeaturedProduct | null>(null);
  const [addonModalOpen, setAddonModalOpen] = useState(false);
  const pendingNavRef = useRef<string>("");

  // ── Data fetch ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setQueryString(window.location.search);
    const load = async () => {
      try {
        const res = await fetch(`${API_URL}/api/settings/portal`);
        // Always fetch categories so we can enrich with addonGroups
        const catRes = await fetch(`${API_URL}/api/products/categories`);
        let addonMap: Record<string, any[]> = {};
        if (catRes.ok) {
          const cats = await catRes.json();
          if (Array.isArray(cats)) {
            cats.forEach((cat: any) => {
              (cat.products || []).forEach((p: any) => {
                if (p._id) addonMap[p._id] = p.addonGroups || [];
                // also index by lowercased name as fallback
                if (p.name) addonMap[p.name.toLowerCase()] = p.addonGroups || [];
              });
            });
          }
        }

        if (res.ok) {
          const s = await res.json();
          if (Array.isArray(s.featuredProducts) && s.featuredProducts.length > 0) {
            setProducts(
              s.featuredProducts.map((p: any) => {
                const { name, label } = splitProductName(p.name ?? "");
                // Enrich addonGroups from live categories data
                const addonGroups =
                  (p._id && addonMap[p._id]) ??
                  addonMap[(p.name ?? "").toLowerCase()] ??
                  p.addonGroups ??
                  [];
                return { _id: p._id, name, label, description: p.description || "", price: p.price, imageUrl: p.imageUrl || "", addonGroups };
              })
            );
            return;
          }
        }
        setProducts(await fetchFallbackProducts());
      } catch {
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  // ── Addon modal helpers ────────────────────────────────────────────────────
  /** Try to add a featured product: show addon modal if it has addons, else navigate directly */
  const handleOrderNow = useCallback((product: FeaturedProduct, qs: string) => {
    const hasAddons = (product.addonGroups?.length ?? 0) > 0;
    if (hasAddons) {
      pendingNavRef.current = `/menu${qs}`;
      // Close lightbox first to avoid z-index conflict, then open addon modal
      setModalVisible(false);
      setTimeout(() => {
        setModalMounted(false);
        setSelectedProduct(null);
        document.body.style.overflow = '';
        setAddonProduct(product);
        setAddonModalOpen(true);
      }, 200);
    } else {
      // No addons — save item and go straight to menu
      sessionStorage.setItem(
        "pendingCartItem",
        JSON.stringify({
          _id: product._id || product.name,
          name: product.name,
          price: product.price ?? 0,
          imageUrl: product.imageUrl,
          description: product.description,
          quantity: 1,
          selectedAddons: [],
        })
      );
      closeModal();
      router.push(`/menu${qs}`);
    }
  }, [router]);

  const handleAddonConfirm = useCallback(
    (product: FeaturedProduct, selectedAddons: SelectedAddon[], quantity: number) => {
      const addonTotal = selectedAddons.reduce((s, a) => s + a.price, 0);
      sessionStorage.setItem(
        "pendingCartItem",
        JSON.stringify({
          _id: product._id || product.name,
          name: product.name,
          price: (product.price ?? 0) + addonTotal,
          imageUrl: product.imageUrl,
          description: product.description,
          quantity,
          selectedAddons,
        })
      );
      setAddonModalOpen(false);
      closeModal();
      router.push(pendingNavRef.current || `/menu${queryString}`);
    },
    [router, queryString]
  );

  // ── Carousel helpers ───────────────────────────────────────────────────────
  const count = products.length;

  const goTo = useCallback(
    (idx: number) => {
      if (animatingRef.current || count === 0) return;
      animatingRef.current = true;
      setActiveIndex(((idx % count) + count) % count);
      setTimeout(() => { animatingRef.current = false; }, 500);
    },
    [count]
  );

  const prev = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo]);
  const next = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo]);

  // Touch / Mouse drag
  const onPointerDown = (clientX: number) => {
    setIsDragging(true);
    setDragStartX(clientX);
    setDragDelta(0);
  };
  const onPointerMove = (clientX: number) => {
    if (!isDragging) return;
    setDragDelta(clientX - dragStartX);
  };
  const onPointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (dragDelta < -60) next();
    else if (dragDelta > 60) prev();
    setDragDelta(0);
  };

  // Keyboard nav
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [prev, next]);

  // ── Modal ─────────────────────────────────────────────────────────────────
  const openModal = (p: FeaturedProduct) => {
    setSelectedProduct(p);
    setModalMounted(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setModalVisible(true)));
    document.body.style.overflow = "hidden";
    lenisRef.current?.stop();
  };
  const closeModal = () => {
    setModalVisible(false);
    setTimeout(() => { setModalMounted(false); setSelectedProduct(null); lenisRef.current?.start(); document.body.style.overflow = ""; }, 350);
  };

  // ── Card layout ────────────────────────────────────────────────────────────
  // Each card gets a slot offset from active: -2, -1, 0, +1, +2
  // We show slots -1, 0, +1 visibly; further slots are hidden
  function getSlot(idx: number): number {
    if (count === 0) return 0;
    let slot = idx - activeIndex;
    // Wrap to [-count/2, count/2]
    while (slot > Math.floor(count / 2)) slot -= count;
    while (slot < -Math.floor(count / 2)) slot += count;
    return slot;
  }

  const FALLBACK_IMG = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=400&auto=format&fit=crop";

  return (
    <>
      <main
        className="relative min-h-screen flex flex-col pt-28 pb-0 overflow-hidden"
        style={{ background: "#0a0a0a" }}
      >
        {/* Ambient radial glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(232,98,26,0.12) 0%, transparent 70%)" }}
        />

        {/* Ghost watermark parallax */}
        <div
          className="absolute inset-x-0 top-1/2 -translate-y-1/2 pointer-events-none select-none z-0 overflow-hidden"
          style={{ opacity: 0.045 }}
        >
          <span
            className="font-black-han whitespace-nowrap text-white leading-none block"
            style={{
              fontSize: "clamp(6rem, 18vw, 18rem)",
              letterSpacing: "-0.02em",
              transform: `translateX(${-scrollY * 0.4}px)`,
              willChange: "transform",
            }}
          >
            RENDEZVOUS
          </span>
        </div>

        <div className="relative z-10 container mx-auto px-6 flex flex-col items-center">

          {/* Sidebar tagline */}
          <div className="absolute left-6 xl:left-10 top-1/2 -translate-y-1/2 hidden xl:flex flex-col max-w-[160px] animate-stagger-1">
            <div className="relative pl-4 border-l-2" style={{ borderColor: "#E8621A" }}>
              <span className="absolute -left-1.5 top-0 w-2.5 h-2.5 rounded-full" style={{ background: "#E8621A" }} />
              <p className="text-[9px] leading-relaxed tracking-widest uppercase font-semibold" style={{ color: "rgba(255,255,255,0.45)" }}>
                Discover the taste of freshly cooked meals and savory flavors in every bite.
              </p>
            </div>
          </div>

          {/* Headline */}
          <div className="relative text-center mb-10 animate-stagger-2">
            <h1
              className="font-black-han uppercase leading-[0.88] tracking-tight text-white"
              style={{ fontSize: "clamp(3.5rem, 10vw, 9rem)" }}
            >
              BEST SELLERS
              <br />
              IN TOWN
            </h1>
            <span
              className="absolute font-dancing animate-wobble-pulse pointer-events-none"
              style={{
                color: "#E8621A",
                fontSize: "clamp(2rem, 5.5vw, 4.5rem)",
                bottom: "-0.6em",
                right: "clamp(-1rem, 2vw, 3rem)",
                textShadow: "0 0 30px rgba(232,98,26,0.5)",
                transformOrigin: "center center",
              }}
            >
              Order Now!
            </span>
          </div>

          {/* Subtitle */}
          <p
            className="text-xs font-bold tracking-[0.35em] uppercase mb-12 animate-stagger-3"
            style={{ color: "rgba(255,255,255,0.4)" }}
          >
            Our top dishes served fresh and hot
          </p>

          {/* ── Coverflow Carousel ─────────────────────────────────────────── */}
          <div
            className="relative w-full flex items-center justify-center animate-stagger-3"
            style={{ height: 400, perspective: "1200px" }}
            // Touch events
            onTouchStart={(e) => onPointerDown(e.touches[0].clientX)}
            onTouchMove={(e) => onPointerMove(e.touches[0].clientX)}
            onTouchEnd={onPointerUp}
            // Mouse drag
            onMouseDown={(e) => onPointerDown(e.clientX)}
            onMouseMove={(e) => onPointerMove(e.clientX)}
            onMouseUp={onPointerUp}
            onMouseLeave={onPointerUp}
          >
            {isLoading
              ? /* Skeletons */
                [-1, 0, 1].map((slot) => (
                  <div
                    key={slot}
                    className="absolute rounded-3xl animate-pulse"
                    style={{
                      width: slot === 0 ? 260 : 200,
                      height: slot === 0 ? 360 : 290,
                      background: "#1a1008",
                      transform: `translateX(${slot * 220}px) scale(${slot === 0 ? 1 : 0.82}) translateZ(${slot === 0 ? 0 : -80}px)`,
                      opacity: slot === 0 ? 1 : 0.4,
                      transition: "all 0.5s ease",
                    }}
                  />
                ))
              : products.map((product, idx) => {
                  const slot = getSlot(idx);
                  const isActive = slot === 0;
                  const isVisible = Math.abs(slot) <= 1;
                  // Side cards shift left/right
                  const horizontalShift = slot * 230 + (isDragging ? dragDelta * 0.4 : 0);
                  const scale = isActive ? 1 : 0.8;
                  const opacity = isActive ? 1 : Math.abs(slot) === 1 ? 0.55 : 0;
                  const zIndex = isActive ? 20 : Math.abs(slot) === 1 ? 10 : 0;
                  const rotateY = slot === -1 ? 12 : slot === 1 ? -12 : 0;
                  const tz = isActive ? 0 : -60;

                  return (
                    <div
                      key={idx}
                      onClick={() => { if (isActive && !isDragging && Math.abs(dragDelta) < 10) openModal(product); else if (!isActive) goTo(idx); }}
                      className="absolute rounded-3xl overflow-hidden cursor-pointer select-none"
                      style={{
                        width: 260,
                        height: 360,
                        transform: `translateX(${horizontalShift}px) scale(${scale}) rotateY(${rotateY}deg) translateZ(${tz}px)`,
                        opacity,
                        zIndex,
                        transition: isDragging ? "opacity 0.15s ease, box-shadow 0.2s ease" : "all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                        background: "#140c06",
                        border: isActive ? "2px solid rgba(232,98,26,0.6)" : "1px solid rgba(255,255,255,0.07)",
                        boxShadow: isActive
                          ? "0 0 60px -10px rgba(232,98,26,0.55), 0 30px 60px -20px rgba(0,0,0,0.8)"
                          : "none",
                        visibility: isVisible ? "visible" : "hidden",
                        pointerEvents: isVisible ? "auto" : "none",
                        willChange: "transform, opacity",
                      }}
                    >
                      {/* Image */}
                      <div className="relative w-full" style={{ height: 260 }}>
                        <img
                          src={product.imageUrl || FALLBACK_IMG}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          draggable={false}
                          onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }}
                        />
                        {/* Gradient overlay */}
                        <div
                          className="absolute inset-0"
                          style={{ background: "linear-gradient(to top, rgba(20,12,6,0.98) 0%, rgba(20,12,6,0.15) 50%, transparent 100%)" }}
                        />
                        {/* Active glow from bottom */}
                        {isActive && (
                          <div
                            className="absolute inset-0"
                            style={{ background: "radial-gradient(ellipse at 50% 110%, rgba(232,98,26,0.35) 0%, transparent 60%)" }}
                          />
                        )}
                        {/* "Tap to view" */}
                        {isActive && (
                          <div
                            className="absolute inset-0 flex items-end justify-center pb-4 opacity-0 hover:opacity-100 transition-opacity duration-300"
                          >
                            <span
                              className="text-white text-[11px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full"
                              style={{ background: "rgba(232,98,26,0.85)" }}
                            >
                              View Details
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Card footer */}
                      <div className="px-5 pt-3 pb-4 flex flex-col items-start gap-1.5">
                        <span className="font-black uppercase tracking-tight text-white text-sm sm:text-base leading-snug">
                          {product.name}
                        </span>
                        <span
                          className="px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border"
                          style={{ color: "#E8621A", borderColor: "#E8621A", background: "rgba(232,98,26,0.08)" }}
                        >
                          {product.label}
                        </span>
                        {product.price !== undefined && product.price > 0 && (
                          <span className="text-sm font-bold" style={{ color: "rgba(232,98,26,0.85)" }}>
                            ₱{product.price.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}

            {/* ── Arrow Buttons ──────────────────────────────────────────── */}
            {!isLoading && count > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); prev(); }}
                  aria-label="Previous"
                  className="absolute left-2 md:left-6 z-30 flex items-center justify-center w-10 h-10 rounded-full border transition-all duration-200 hover:scale-110"
                  style={{ background: "rgba(20,12,6,0.85)", borderColor: "rgba(232,98,26,0.4)", color: "#E8621A" }}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); next(); }}
                  aria-label="Next"
                  className="absolute right-2 md:right-6 z-30 flex items-center justify-center w-10 h-10 rounded-full border transition-all duration-200 hover:scale-110"
                  style={{ background: "rgba(20,12,6,0.85)", borderColor: "rgba(232,98,26,0.4)", color: "#E8621A" }}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
          </div>

          {/* Dot indicators */}
          {!isLoading && count > 1 && (
            <div className="flex gap-2 mt-6">
              {products.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  className="rounded-full transition-all duration-300"
                  style={{
                    width: i === activeIndex ? 24 : 8,
                    height: 8,
                    background: i === activeIndex ? "#E8621A" : "rgba(255,255,255,0.2)",
                  }}
                />
              ))}
            </div>
          )}

          {/* CTA Button */}
          <div className="mt-12 mb-4 z-20 animate-stagger-5">
            <Link
              href={`/menu${queryString}`}
              className="inline-block px-14 py-5 rounded-full font-black text-white text-base uppercase tracking-widest transition-all duration-300 hover:scale-105 active:scale-95"
              style={{
                background: "linear-gradient(135deg, #E8621A 0%, #8B3A00 100%)",
                boxShadow: "0 0 40px rgba(232,98,26,0.35)",
              }}
            >
              ORDER NOW
            </Link>
          </div>
        </div>

        {/* Wavy SVG divider */}
        <div className="relative w-full overflow-hidden leading-none mt-auto" style={{ height: 120 }}>
          <svg viewBox="0 0 1440 120" preserveAspectRatio="none" className="absolute bottom-0 left-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,60 C180,110 360,10 540,60 C720,110 900,10 1080,60 C1260,110 1380,30 1440,60 L1440,120 L0,120 Z" fill="#E8621A" opacity="0.18" />
            <path d="M0,80 C200,30 400,120 600,70 C800,20 1000,110 1200,65 C1320,40 1400,90 1440,80 L1440,120 L0,120 Z" fill="#8B3A00" opacity="0.55" />
          </svg>
        </div>
      </main>

      {/* ── Lightbox Modal ─────────────────────────────────────────────────── */}
      {modalMounted && selectedProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            transition: "opacity 0.35s ease",
            opacity: modalVisible ? 1 : 0,
            backdropFilter: modalVisible ? "blur(18px) brightness(0.3)" : "blur(0px) brightness(1)",
            background: modalVisible ? "rgba(0,0,0,0.75)" : "rgba(0,0,0,0)",
          }}
          onClick={closeModal}
        >
          <div
            className="relative w-full max-w-lg rounded-3xl overflow-hidden"
            style={{
              background: "#140c06",
              border: "1.5px solid rgba(232,98,26,0.45)",
              boxShadow: "0 0 100px -10px rgba(232,98,26,0.65)",
              transition: "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.35s ease",
              transform: modalVisible ? "scale(1) translateY(0)" : "scale(0.88) translateY(28px)",
              opacity: modalVisible ? 1 : 0,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 z-10 flex items-center justify-center w-9 h-9 rounded-full transition-all duration-200 hover:scale-110"
              style={{ background: "rgba(232,98,26,0.15)", border: "1px solid rgba(232,98,26,0.3)", color: "#E8621A" }}
            >
              <X className="w-4 h-4" />
            </button>

            {/* Image */}
            <div className="relative w-full" style={{ height: 290 }}>
              <img
                src={selectedProduct.imageUrl || FALLBACK_IMG}
                alt={selectedProduct.name}
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }}
              />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(20,12,6,1) 0%, rgba(20,12,6,0.18) 60%, transparent 100%)" }} />
              <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 100%, rgba(232,98,26,0.32) 0%, transparent 65%)" }} />
            </div>

            {/* Body */}
            <div className="px-7 py-6 space-y-4">
              <span className="inline-block px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border" style={{ color: "#E8621A", borderColor: "#E8621A", background: "rgba(232,98,26,0.08)" }}>
                {selectedProduct.label || "Best Seller"}
              </span>

              <h2 className="font-black-han uppercase text-white leading-tight" style={{ fontSize: "clamp(1.6rem, 4vw, 2.4rem)" }}>
                {selectedProduct.name}
              </h2>

              {selectedProduct.description && (
                <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
                  {selectedProduct.description}
                </p>
              )}

              <div className="flex items-center justify-between pt-2">
                {selectedProduct.price !== undefined && selectedProduct.price > 0 && (
                  <span className="text-2xl font-black" style={{ color: "#E8621A" }}>
                    ₱{selectedProduct.price.toFixed(2)}
                  </span>
                )}
                <button
                  onClick={() => {
                    if (selectedProduct) {
                      handleOrderNow(selectedProduct, queryString);
                    }
                  }}
                  className="ml-auto inline-flex items-center gap-2 px-6 py-3 rounded-full font-black text-white text-sm uppercase tracking-widest transition-all duration-300 hover:scale-105 active:scale-95"
                  style={{ background: "linear-gradient(135deg, #E8621A 0%, #8B3A00 100%)", boxShadow: "0 0 30px rgba(232,98,26,0.3)" }}
                >
                  <ShoppingBag className="w-4 h-4" />
                  Order Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Addon Selection Modal — shown when a featured product has addons */}
      <AddonModal
        product={addonProduct as any}
        open={addonModalOpen}
        onClose={() => setAddonModalOpen(false)}
        onConfirm={handleAddonConfirm as any}
      />
    </>
  );
}

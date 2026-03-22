"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface FeaturedProduct {
  name: string;
  label: string;
  imageUrl: string;
  featured: boolean;
}

const TARGET_CONFIGS = [
  {
    search: "crispy chicksilog",
    featured: false,
    defaultLabel: "CHICKSILOG",
    defaultName: "Crispy",
  },
  {
    search: "jumbo hungarian sausilog|jumbo hangarian sausilog",
    featured: true,
    defaultLabel: "SAUSILOG",
    defaultName: "Jumbo Hungarian",
  },
  {
    search: "special taal tapsilog",
    featured: false,
    defaultLabel: "TAPSILOG",
    defaultName: "Special Taal",
  },
];

const FALLBACK_IMAGES: Record<string, string> = {
  "crispy chicksilog":
    "https://lh3.googleusercontent.com/aida-public/AB6AXuDKshH7TVmaJgSQVcCh_YWiz7WORk1TkgnQzRPXzJVw009BYbaa9YnjlChT1eyvP-WU-MhHtQfKZ_kBpCDiBgke0XUFrNyixSWgpoRFVeZczVJJrw0okoxN2l4Qw--7aFrJpVP1fBHYHqMX9oiH9ndsFbmjaO91IrY1-DInqWFxj9e0lVWIS-ThjtgjoHwREdUzP5va3nVKc9jq1fvyduE1t5ejM9PbWxUZyypbDKOfGqNyZY_YjjnH6nC4vmog4ARysZPNqLS11Vw",
  "jumbo hungarian sausilog":
    "https://lh3.googleusercontent.com/aida-public/AB6AXuDYNq7NwMy2hzIp6v1QafoeQ8EGNjOBLMDIgN9F7roxor8sLJ_GATFQ0fyTQybRMt0Y0vlbvZEyFUCbY6K4cX2xB0bt3o6MoztrvjDvzoZTP5e8QBfHH8YWVwWdVPUjynpIK8BNkVFH8yLE5aW1sBJg050yr5dexvcizU_70Wi5ZwZ5yC5pmBPLZLLCLAZpfImej7HHTMKPs1L_cy0T5AvePUr5g7bk3xcIw3tzX2M-d3l1RjzP4gBwIO7bVhUOT_NGTHCZRPoYoa8",
  "special taal tapsilog":
    "https://lh3.googleusercontent.com/aida-public/AB6AXuBvqTwZc8qcN-AzHK5_aTvSbiHvEJA6pLWO5WlUK2JReZpVPaFn1GMdQS_2CaWWam5GDfAO-N0Q9-TsuOD10x-XgkECYs9MrsqziKdowQeRzWTcKdpTDphjAgEN0YBieGWjs19aCYChPi7HRdmvYEpRJmzUJPhNQ2z6k-IkT9n3-pZDigBSwlURyDdKwO5vjoXIN-OBXrw98v-m9xOOQbgRrM9VnU4GcZkzdrbcrYlRUkd6C8u2_x9CtoR-SGNoFLkeJIpS3L_uG0U",
};

export default function HeroSection() {
  const [queryString, setQueryString] = useState("");
  const [featuredProducts, setFeaturedProducts] = useState<FeaturedProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setQueryString(window.location.search);

    const fetchProducts = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/api/products/categories`
        );
        if (res.ok) {
          const categories = await res.json();
          let allProducts: any[] = [];
          if (Array.isArray(categories)) {
            categories.forEach((cat: any) => {
              if (Array.isArray(cat.products)) allProducts = [...allProducts, ...cat.products];
            });
          }

          const mapped = TARGET_CONFIGS.map((config) => {
            const matched = allProducts.find((p) => {
              const pName = p.name?.toLowerCase() || "";
              return config.search.split("|").some((s) => pName.includes(s));
            });

            let displayName = config.defaultName;
            let displayLabel = config.defaultLabel;
            if (matched) {
              const parts = matched.name.split(" ");
              if (parts.length > 1) {
                displayLabel = parts[parts.length - 1].toUpperCase();
                displayName = parts.slice(0, -1).join(" ");
              } else {
                displayName = matched.name;
              }
            }

            return {
              name: displayName,
              label: displayLabel,
              imageUrl:
                matched?.imageUrl ||
                FALLBACK_IMAGES[config.search.split("|")[0]] ||
                "",
              featured: config.featured,
            };
          });

          setFeaturedProducts(mapped);
        }
      } catch (e) {
        console.error("Failed to fetch products for landing page", e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <main
      className="relative min-h-screen flex flex-col pt-28 pb-0 overflow-hidden"
      style={{ background: "#0a0a0a" }}
    >
      {/* Ambient radial glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(232,98,26,0.12) 0%, transparent 70%)",
        }}
      />

      {/* Ghost watermark — scroll-linked horizontal parallax */}
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

        {/* Left sidebar tagline */}
        <div className="absolute left-6 xl:left-10 top-1/2 -translate-y-1/2 hidden xl:flex flex-col max-w-[160px] animate-stagger-1">
          <div className="relative pl-4 border-l-2" style={{ borderColor: "#E8621A" }}>
            <span
              className="absolute -left-1.5 top-0 w-2.5 h-2.5 rounded-full"
              style={{ background: "#E8621A" }}
            />
            <p
              className="text-[9px] leading-relaxed tracking-widest uppercase font-semibold"
              style={{ color: "rgba(255,255,255,0.45)" }}
            >
              Discover the taste of freshly cooked meals and savory flavors in every bite.
            </p>
          </div>
        </div>

        {/* Headline block */}
        <div className="relative text-center mb-10 animate-stagger-2">
          <h1
            className="font-black-han uppercase leading-[0.88] tracking-tight text-white"
            style={{ fontSize: "clamp(3.5rem, 10vw, 9rem)" }}
          >
            BEST SELLERS
            <br />
            IN TOWN
          </h1>

          {/* Cursive "Order Now!" stamp */}
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

        {/* Food Cards */}
        <div className="flex flex-col md:flex-row items-end justify-center gap-6 w-full max-w-5xl relative z-10 min-h-[380px]">
          {isLoading
            ? [0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={`animate-pulse rounded-3xl ${
                    i === 1 ? "w-4/5 md:w-[36%] md:-translate-y-8" : "w-3/4 md:w-[30%]"
                  }`}
                  style={{ background: "#1a1008", height: i === 1 ? 340 : 290 }}
                />
              ))
            : featuredProducts.map((product, idx) => (
                <FoodCard key={product.label} product={product} index={idx} />
              ))}
        </div>

        {/* CTA Button */}
        <div className="mt-16 mb-4 z-20 animate-stagger-5">
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
        <svg
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
          className="absolute bottom-0 left-0 w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0,60 C180,110 360,10 540,60 C720,110 900,10 1080,60 C1260,110 1380,30 1440,60 L1440,120 L0,120 Z"
            fill="#E8621A"
            opacity="0.18"
          />
          <path
            d="M0,80 C200,30 400,120 600,70 C800,20 1000,110 1200,65 C1320,40 1400,90 1440,80 L1440,120 L0,120 Z"
            fill="#8B3A00"
            opacity="0.55"
          />
        </svg>
      </div>
    </main>
  );
}

/* ─── Food Card ─────────────────────────────────────────────────────────────── */
function FoodCard({
  product,
  index,
}: {
  product: FeaturedProduct;
  index: number;
}) {
  const staggerClass = ["animate-stagger-3", "animate-stagger-4", "animate-stagger-3"][index];

  return (
    <div
      className={`group relative flex flex-col rounded-3xl overflow-hidden cursor-pointer transition-all duration-500 hover:scale-105 ${staggerClass} ${
        product.featured
          ? "w-4/5 md:w-[36%] md:-translate-y-8 z-20"
          : "w-3/4 md:w-[30%]"
      }`}
      style={{
        background: "#140c06",
        border: product.featured
          ? "2px solid rgba(232,98,26,0.45)"
          : "1px solid rgba(255,255,255,0.06)",
        boxShadow: product.featured
          ? "0 0 50px -10px rgba(232,98,26,0.35)"
          : "none",
        transition: "box-shadow 0.4s ease, transform 0.4s ease, border-color 0.4s ease",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow =
          "0 0 60px -8px rgba(232,98,26,0.55)";
        (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(232,98,26,0.7)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = product.featured
          ? "0 0 50px -10px rgba(232,98,26,0.35)"
          : "none";
        (e.currentTarget as HTMLDivElement).style.borderColor = product.featured
          ? "rgba(232,98,26,0.45)"
          : "rgba(255,255,255,0.06)";
      }}
    >
      {/* Food image */}
      <div className={`relative w-full overflow-hidden ${product.featured ? "h-64" : "h-52"}`}>
        <img
          src={product.imageUrl}
          alt={`${product.name} ${product.label}`}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=400&auto=format&fit=crop";
          }}
        />
        {/* Warm gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, rgba(20,12,6,0.95) 0%, rgba(20,12,6,0.3) 50%, transparent 100%)",
          }}
        />
      </div>

      {/* Card footer */}
      <div className="px-5 pt-3 pb-5 flex flex-col items-start gap-2">
        <span
          className="font-black uppercase tracking-tight text-white"
          style={{ fontSize: product.featured ? "1.35rem" : "1.1rem" }}
        >
          {product.name}
        </span>
        <span
          className="px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border"
          style={{
            color: "#E8621A",
            borderColor: "#E8621A",
            background: "rgba(232,98,26,0.08)",
          }}
        >
          {product.label}
        </span>
      </div>
    </div>
  );
}

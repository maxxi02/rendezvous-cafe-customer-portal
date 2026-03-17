"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface FeaturedProduct {
  name: string;
  label: string;
  imageUrl: string;
  size: string;
  lift: string;
  shadow: string;
  featured: boolean;
}

const TARGET_CONFIGS = [
  {
    search: "crispy chicksilog",
    size: "w-24 h-24",
    lift: "group-hover:-translate-y-4",
    shadow: "drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-4 border-white/10",
    featured: false,
    defaultLabel: "CHICKSILOG",
    defaultName: "Crispy"
  },
  {
    search: "jumbo hungarian sausilog|jumbo hangarian sausilog",
    size: "w-28 h-28",
    lift: "group-hover:-translate-y-6",
    shadow: "drop-shadow-[0_30px_60px_rgba(0,0,0,0.6)] border-4 border-primary/50",
    featured: true,
    defaultLabel: "SAUSILOG",
    defaultName: "Jumbo Hungarian"
  },
  {
    search: "special taal tapsilog",
    size: "w-24 h-24",
    lift: "group-hover:-translate-y-4",
    shadow: "drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-4 border-white/10",
    featured: false,
    defaultLabel: "TAPSILOG",
    defaultName: "Special Taal"
  },
];

const FALLBACK_IMAGES: Record<string, string> = {
  "crispy chicksilog": "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?q=80&w=400&auto=format&fit=crop",
  "jumbo hungarian sausilog": "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?q=80&w=400&auto=format&fit=crop",
  "special taal tapsilog": "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=400&auto=format&fit=crop"
};

export default function HeroSection() {
  const [scrollOffset, setScrollOffset] = useState(0);
  const [queryString, setQueryString] = useState("");
  const [featuredProducts, setFeaturedProducts] = useState<FeaturedProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setQueryString(window.location.search);
    const handleScroll = () => {
      setScrollOffset(window.scrollY);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    
    const fetchProducts = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/products/categories`);
            if (res.ok) {
                const categories = await res.json();
                let allProducts: any[] = [];
                if (Array.isArray(categories)) {
                     categories.forEach((cat: any) => {
                         if (Array.isArray(cat.products)) {
                             allProducts = [...allProducts, ...cat.products];
                         }
                     });
                }
                
                const mapped = TARGET_CONFIGS.map(config => {
                    const matched = allProducts.find(p => {
                        const pName = p.name?.toLowerCase() || "";
                        return config.search.split('|').some(s => pName.includes(s));
                    });

                    // Logic to split the name into Display Name and Label
                    let displayName = config.defaultName;
                    let displayLabel = config.defaultLabel;

                    if (matched) {
                        const fullName = matched.name;
                        const parts = fullName.split(' ');
                        if (parts.length > 1) {
                            displayLabel = parts[parts.length - 1].toUpperCase();
                            displayName = parts.slice(0, -1).join(' ');
                        } else {
                            displayName = fullName;
                        }
                    }

                    return {
                        name: displayName,
                        label: displayLabel,
                        imageUrl: matched?.imageUrl || FALLBACK_IMAGES[config.search.split('|')[0]] || "",
                        size: config.size,
                        lift: config.lift,
                        shadow: config.shadow,
                        featured: config.featured
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
    
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const WatermarkMarquee = ({ direction = 1, speed = 1, opacity = 0.06 }) => (
    <div
      className="marquee-container w-full py-4 overflow-hidden"
      style={{ opacity }}
    >
      <div
        className="marquee-track whitespace-nowrap"
        style={{
          transform: `translateX(calc(-50% + ${scrollOffset * speed * direction}px))`,
        }}
      >
        {[...Array(8)].map((_, i) => (
          <span
            key={i}
            className="text-[14vw] font-black uppercase leading-none tracking-tighter text-white inline-block px-10"
          >
            RENDEZVOUS
          </span>
        ))}
      </div>
    </div>
  );

  return (
    <main className="relative min-h-screen flex flex-col pt-32 overflow-hidden bg-background">
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Scroll-Linked Marquee Watermark */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex flex-col pointer-events-none select-none z-0">
        <WatermarkMarquee direction={-1} speed={0.6} opacity={0.06} />
      </div>

      <div className="relative z-10 container mx-auto px-6 flex flex-col items-center">
        {/* Hero Title */}
        <div className="relative text-center mb-12 animate-fade-in-up">
          <h1 className="text-6xl md:text-[80px] font-black uppercase leading-[0.9] tracking-tighter text-white">
            BEST SELLERS
          </h1>
          <div className="relative -mt-2 md:-mt-6">
            <span className="text-6xl md:text-[80px] font-black uppercase leading-[0.9] tracking-tighter text-white block">
              IN TOWN
            </span>
            {/* Cursive accent */}
            <span
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary whitespace-nowrap -rotate-6 pointer-events-none"
              style={{
                fontFamily: "'Caveat', cursive",
                fontSize: "clamp(2.5rem, 7vw, 5rem)",
              }}
            >
              Order Now!
            </span>
          </div>

          {/* Subtitle */}
          <p className="mt-6 text-white/50 text-sm font-semibold tracking-[0.3em] uppercase">
            Our top dishes served fresh and hot
          </p>
        </div>

        {/* Left sidebar description */}
        <div className="absolute left-8 xl:left-12 top-1/2 -translate-y-1/2 hidden xl:flex flex-col gap-5 max-w-[180px]">
          <div className="relative pl-5 border-l-2 border-primary">
            <span className="absolute -left-1.5 -top-1.5 w-3 h-3 bg-primary rounded-full" />
            <p className="text-[10px] leading-relaxed tracking-wider uppercase text-foreground/50 font-medium font-sans">
              Discover the taste of freshly cooked meals and savory flavors
              in every bite.
            </p>
          </div>
        </div>

        {/* Products */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 w-full max-w-5xl mt-6 relative z-10 min-h-[400px]">
          {isLoading ? (
            // Skeleton State
            [0, 1, 2].map((i) => (
              <div
                key={i}
                className={`relative flex flex-col items-center animate-pulse ${
                  i === 1 ? "w-4/5 md:w-2/5" : "w-3/4 md:w-[30%]"
                }`}
              >
                <div className={`aspect-square w-full rounded-[3rem] bg-white/5 border border-white/10`} />
                <div className="mt-8 w-2/3 h-8 bg-white/5 rounded-lg" />
                <div className="mt-2 w-1/3 h-6 bg-primary/20 rounded-full" />
              </div>
            ))
          ) : (
            featuredProducts.map((product) => (
              <div
                key={product.name}
                className={`relative group cursor-pointer flex flex-col items-center transition-all duration-500 ${
                  product.featured ? "w-4/5 md:w-2/5 z-20" : "w-3/4 md:w-[30%]"
                }`}
              >
                <div
                  className={`relative transition-transform duration-500 w-full aspect-square ${product.lift}`}
                >
                  <img
                    src={product.imageUrl}
                    alt={`${product.name} ${product.label}`}
                    className={`w-full h-full object-cover rounded-[3rem] ${product.shadow}`}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=400&auto=format&fit=crop";
                    }}
                  />
                  <div className="absolute inset-x-0 -bottom-6 flex flex-col items-center text-center px-4">
                    <span
                      className={`font-black uppercase tracking-tight text-white drop-shadow-xl transition-all duration-300 ${
                        product.featured
                          ? "text-3xl lg:text-4xl"
                          : "text-2xl lg:text-3xl"
                      }`}
                    >
                      {product.name}
                    </span>
                    <div
                      className={`mt-2 border-2 border-primary rounded-full flex items-center justify-center bg-background/90 backdrop-blur-md shadow-lg shadow-black/50 transition-all duration-300 group-hover:bg-primary ${
                        product.featured ? "px-6 py-2" : "px-4 py-1.5"
                      }`}
                    >
                      <span
                        className={`font-black tracking-widest text-primary group-hover:text-background transition-colors ${
                          product.featured ? "text-sm" : "text-xs"
                        }`}
                      >
                        {product.label}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Order Now Button */}
        <div className="mt-20 z-20 animate-fade-in-up pb-10">
          <Link 
            href={`/menu${queryString}`}
            className="px-10 py-5 bg-primary text-background rounded-full font-black text-lg uppercase tracking-widest hover:bg-white hover:scale-105 active:scale-95 transition-all duration-300 shadow-[0_0_40px_rgba(255,160,0,0.3)] hover:shadow-[0_0_60px_rgba(255,255,255,0.4)] block text-center"
          >
            Order Now
          </Link>
        </div>
      </div>

      {/* Wave transition */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none z-0 translate-y-px">
        <svg
          className="relative block w-[200%] h-[100px] md:h-[180px] animate-wave"
          preserveAspectRatio="none"
          viewBox="0 0 1200 120"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0,0 C150,120 300,0 450,120 C600,0 750,120 900,0 C1050,120 1200,0 1350,120 L1350,120 L0,120 Z"
            fill="var(--primary)"
            opacity="0.4"
          />
          <path
            d="M0,30 C150,150 300,30 450,150 C600,30 750,150 900,30 C1050,150 1200,30 1350,150 L1350,150 L0,150 Z"
            fill="var(--primary)"
          />
        </svg>
      </div>
    </main>
  );
}


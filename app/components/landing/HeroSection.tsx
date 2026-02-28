"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const coffeeProducts = [
    {
        name: "Vanilla",
        label: "VANILLA",
        src: "https://lh3.googleusercontent.com/aida-public/AB6AXuDmRxJBry45FwdjzwhG1lT_B2ZU2XB2KPDUVSZ69tmxcCqrSnnXQYNPPGQdWZfBICKScBe0CNHfu2QPYetBHgllB98ce-gfuwfMA2dOuW7oNFg4CYZFghncdGFleh0KEsBnDoxcfMsXapKmz2ilZtYoKJOA5uGQOjj8F5s2jaZuLHBajUqg-9B3MDWotsV1amT9vg_2wryQl7PI6YT0iGwzXLH2mR-sH7EaCmwWwuF-1cs_wCCZe3TnPGodxFePO_wVzmhyFfRIUtg",
        size: "w-24 h-24",
        lift: "group-hover:-translate-y-4",
        shadow: "drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]",
    },
    {
        name: "Caramel",
        label: "CARAMEL",
        src: "https://lh3.googleusercontent.com/aida-public/AB6AXuDAoYNb0hVsJgFG6Ijarf1YB4ZEgSOgf1YmD1u2pfkh_1JKxekJaF3BhSMWijuaDiTMKRQsDW7KsN8vmcK_lMKuJWzKA5J6p8GhSe1gjazmEpe4E9MV1AM6jqffZzKHSM9Oa72dT3w1w5iET8ILxQUnQZXcLlRmiRUSbm3U1AzZp6QSuHpJw9Ew-AMm0s4Mm7Uf4P_EJKokfZBq5K6qu8e6ciG3ByGLVxV3ALyWUxpF7U7s47lJ4L3xjwVLkLJK1mvfMUOaO1jXUAg",
        size: "w-28 h-28",
        lift: "group-hover:-translate-y-6",
        shadow: "drop-shadow-[0_30px_60px_rgba(0,0,0,0.6)]",
        featured: true,
    },
    {
        name: "Chocolate",
        label: "CHOCOLATE",
        src: "https://lh3.googleusercontent.com/aida-public/AB6AXuD5glhjfB5Ez6H7LTGFtE065sSvB0Mg4uhJY9NElpHhTAnYEJdbHftsZVqZjsbrBux8i3Ja7vjOvoB1PCU_LYYYFkYm-Afl0Pa-ue5r_oKEvw6gHsMkIeh_m_GbFwDJaNSjOOgZLjCT25iBweV_ghDFOTquQ-7JwDjauJxYQbTf9OTdekuReKC4PtyM2nb_O0_RAbAP9i4Z0F1hbQIuuejjZzA_LZY__1dJUXIDOhLZChNI7dK-U4ofSpiQjQNciT8DuC99-CB8dEs",
        size: "w-24 h-24",
        lift: "group-hover:-translate-y-4",
        shadow: "drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]",
    },
];

export default function HeroSection() {
    const [scrollOffset, setScrollOffset] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            setScrollOffset(window.scrollY);
        };
        window.addEventListener("scroll", handleScroll, { passive: true });
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
                    transform: `translateX(calc(-50% + ${scrollOffset * speed * direction}px))`
                }}
            >
                {[...Array(8)].map((_, i) => (
                    <span key={i} className="text-[14vw] font-black uppercase leading-none tracking-tighter text-white inline-block px-10">
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
                    <h1 className="text-6xl md:text-[100px] font-black uppercase leading-[0.9] tracking-tighter text-white">
                        FRESHLY BREWED
                    </h1>
                    <div className="relative -mt-2 md:-mt-6">
                        <span className="text-6xl md:text-[100px] font-black uppercase leading-[0.9] tracking-tighter text-white block">
                            MOMENTS
                        </span>
                        {/* Cursive accent */}
                        <span
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary whitespace-nowrap -rotate-6 pointer-events-none"
                            style={{
                                fontFamily: "'Caveat', cursive",
                                fontSize: "clamp(2.5rem, 7vw, 5rem)",
                            }}
                        >
                            Oyeah!
                        </span>
                    </div>

                    {/* Subtitle */}
                    <p className="mt-6 text-white/50 text-sm font-semibold tracking-[0.3em] uppercase">
                        Crafted for the extraordinary
                    </p>
                </div>

                {/* Left sidebar description */}
                <div className="absolute left-8 xl:left-12 top-1/2 -translate-y-1/2 hidden xl:flex flex-col gap-5 max-w-[180px]">
                    <div className="relative pl-5 border-l-2 border-primary">
                        <span className="absolute -left-1.5 -top-1.5 w-3 h-3 bg-primary rounded-full" />
                        <p className="text-[10px] leading-relaxed tracking-wider uppercase text-foreground/50 font-medium font-sans">
                            Discover the taste of freshly roasted beans and handcrafted coffee
                            in every sip.
                        </p>
                        <Link
                            href="/coffee"
                            className="inline-block mt-4 text-[10px] font-black text-primary underline underline-offset-4 tracking-widest uppercase hover:text-foreground transition-colors"
                        >
                            More Details
                        </Link>
                    </div>
                </div>

                {/* Coffee Products */}
                <div className="flex flex-col md:flex-row items-end justify-center gap-4 lg:gap-8 w-full max-w-5xl mt-8">
                    {coffeeProducts.map((product) => (
                        <div
                            key={product.name}
                            className={`relative group cursor-pointer flex flex-col items-center ${product.featured ? "w-full md:w-2/5 z-10" : "w-full md:w-[30%]"
                                }`}
                        >
                            <div
                                className={`relative transition-transform duration-500 ${product.lift}`}
                            >
                                <img
                                    src={product.src}
                                    alt={`${product.name} Frappe Coffee`}
                                    className={`w-full h-auto object-contain rounded-t-3xl ${product.shadow}`}
                                />
                                {/* Label overlay */}
                                <div className="absolute inset-x-0 bottom-6 flex flex-col items-center text-center px-4">
                                    <span
                                        className={`font-black uppercase tracking-tight text-white/30 ${product.featured ? "text-5xl lg:text-6xl" : "text-4xl lg:text-5xl"
                                            }`}
                                    >
                                        {product.name}
                                    </span>
                                    <div
                                        className={`mt-2 border-2 border-white/40 rounded-full flex items-center justify-center bg-black/10 backdrop-blur-sm transition-all duration-300 group-hover:border-primary group-hover:bg-primary/10 ${product.featured ? "w-24 h-24" : "w-20 h-20"
                                            }`}
                                    >
                                        <span
                                            className={`font-black tracking-widest text-white group-hover:text-primary transition-colors ${product.featured ? "text-sm" : "text-xs"
                                                }`}
                                        >
                                            {product.label}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
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

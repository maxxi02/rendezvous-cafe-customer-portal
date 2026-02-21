"use client";

import { useEffect, useRef } from "react";

interface ScrollRevealProps {
    children: React.ReactNode;
    className?: string;
    delay?: number; // in ms
}

/**
 * Wraps children in a div that fades + slides up into view
 * when it enters the viewport.
 */
export default function ScrollReveal({
    children,
    className = "",
    delay = 0,
}: ScrollRevealProps) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        el.classList.remove("opacity-0", "translate-y-8");
                        el.classList.add("opacity-100", "translate-y-0");
                    }, delay);
                    observer.unobserve(el);
                }
            },
            { threshold: 0.1 }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, [delay]);

    return (
        <div
            ref={ref}
            className={`opacity-0 translate-y-8 transition-all duration-700 ease-out ${className}`}
        >
            {children}
        </div>
    );
}
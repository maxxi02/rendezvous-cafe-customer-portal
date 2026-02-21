const features = [
    {
        icon: "local_cafe",
        title: "Premium Beans",
        description: "Sourced from the finest highland estates globally.",
    },
    {
        icon: "auto_fix_high",
        title: "Handcrafted",
        description: "Every cup prepared with artisanal precision and care.",
    },
    {
        icon: "local_shipping",
        title: "Fast Delivery",
        description: "Freshness delivered right to your doorstep.",
    },
    {
        icon: "eco",
        title: "Sustainable",
        description: "Supporting farmers and the environment.",
    },
];

export default function FeaturesSection() {
    return (
        <section className="bg-[#FBBF24] py-24 relative z-10">
            <div className="max-w-7xl mx-auto px-6 text-[#064E3B]">
                {/* Section header */}
                <div className="text-center mb-16">
                    <p className="text-xs font-black tracking-[0.4em] uppercase opacity-60 mb-2">
                        Why Rendezvous
                    </p>
                    <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight">
                        What Sets Us Apart
                    </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
                    {features.map((feature, i) => (
                        <div
                            key={feature.title}
                            className="group flex flex-col items-center text-center gap-4 p-6 rounded-2xl hover:bg-[#064E3B]/10 transition-all duration-300 cursor-default"
                        >
                            {/* Icon circle */}
                            <div className="w-16 h-16 rounded-full bg-[#064E3B] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                                <span className="material-icons text-[#FBBF24] text-3xl">
                                    {feature.icon}
                                </span>
                            </div>

                            <h3 className="font-black text-xl uppercase tracking-wider">
                                {feature.title}
                            </h3>
                            <p className="text-sm font-medium opacity-70 leading-relaxed">
                                {feature.description}
                            </p>

                            {/* Decorative line */}
                            <div className="w-8 h-0.5 bg-[#064E3B]/30 group-hover:w-16 transition-all duration-500" />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
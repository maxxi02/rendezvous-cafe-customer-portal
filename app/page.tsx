import {
  Navbar,
  HeroSection,
  FeaturesSection,
  Footer,
  ScrollReveal,
} from "@/app/components/landing/index";

function LandingPage() {
  return (
    <div className="bg-[#064E3B] text-white font-sans antialiased overflow-x-hidden">
      {/* Fixed navigation */}
      <Navbar />

      {/* Hero — full screen */}
      <HeroSection />

      {/* Features — scroll-revealed */}
      <ScrollReveal>
        <FeaturesSection />
      </ScrollReveal>

      {/* Footer — scroll-revealed with slight delay */}
      <ScrollReveal delay={100}>
        <Footer />
      </ScrollReveal>
    </div>
  );
}


export default LandingPage
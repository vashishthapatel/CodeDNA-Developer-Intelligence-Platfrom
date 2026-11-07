import { Navbar } from './sections/Navbar';
import { Hero } from './sections/Hero';
import { ProductIntro } from './sections/ProductIntro';
import { DashboardSection } from './sections/Dashboard';
import { HowItWorks } from './sections/HowItWorks';
import { FinalCTA } from './sections/FinalCTA';
import { Footer } from './sections/Footer';
import { useSmoothScroll } from './hooks/useSmoothScroll';

export function LandingApp() {
  // Initialize Lenis smooth scroll + GSAP ScrollTrigger integration
  useSmoothScroll();

  return (
    <div className="relative min-h-screen bg-[#FFFDF2] text-[#24301B] overflow-x-hidden selection:bg-[#4B7D21]/30 selection:text-[#24301B]">
      <Navbar />
      <main className="relative z-10 w-full overflow-x-hidden">
        <Hero />
        <ProductIntro />
        <DashboardSection />
        <HowItWorks />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}

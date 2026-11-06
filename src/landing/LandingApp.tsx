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
    <div className="relative min-h-screen bg-[#0B100D] text-[#F1EEE5] overflow-x-hidden selection:bg-[#B99A5D]/30 selection:text-[#F1EEE5]">
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

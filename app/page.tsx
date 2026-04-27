import Navbar from "./components/landing/Navbar";
import AuroraBackground from "./components/landing/AuroraBackground";
import ScrollProgress from "./components/landing/ScrollProgress";
import Hero from "./components/landing/Hero";
import MetricsStrip from "./components/landing/MetricsStrip";
import HowItWorks from "./components/landing/HowItWorks";
import FeaturesBento from "./components/landing/FeaturesBento";
import InteractiveDemo from "./components/landing/InteractiveDemo";
import Testimonials from "./components/landing/Testimonials";
import Footer from "./components/landing/Footer";

export const metadata = {
  title: "Heart2Heart — AI-Powered Daily Couple Activities",
  description:
    "Heart2Heart learns what makes your relationship unique, then generates personalised daily couple activities using NVIDIA MiniMax AI. Strengthen your bond one task at a time.",
};

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#FAFAF8] text-[#0D0D12] relative overflow-x-hidden">
      <AuroraBackground />
      <ScrollProgress />
      <Navbar />
      <Hero />
      <MetricsStrip />
      <HowItWorks />
      <FeaturesBento />
      <InteractiveDemo />
      <Testimonials />
      <Footer />
    </main>
  );
}

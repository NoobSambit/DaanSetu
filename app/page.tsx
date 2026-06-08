import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import FeatureCards from "@/components/landing/FeatureCards";
import HowItWorks from "@/components/landing/HowItWorks";
import CausesSection from "@/components/landing/CausesSection";
import TrustSection from "@/components/landing/TrustSection";
import ImpactWays from "@/components/landing/ImpactWays";
import ImpactDashboard from "@/components/landing/ImpactDashboard";
import StorySection from "@/components/landing/StorySection";
import CommunityCTA from "@/components/landing/CommunityCTA";
import Footer from "@/components/landing/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <FeatureCards />
        <HowItWorks />
        <CausesSection />
        <TrustSection />
        <ImpactWays />
        <ImpactDashboard />
        <StorySection />
      </main>

      {/* Footer Area with Monument & Wave Background Image */}
      <div className="relative bg-[#09112e] overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-no-repeat pointer-events-none"
          style={{ backgroundImage: "url('/landing_page_images/footer_image.png')", backgroundPosition: "center 80%" }}
        />
        {/* Smooth transition from white StorySection into the sky-blue image top */}
        <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-white to-transparent pointer-events-none" />

        {/* Rich dark overlay at the bottom to increase contrast for footer links */}
        <div className="absolute bottom-0 left-0 right-0 h-[55%] bg-gradient-to-t from-[#060b1e] via-[#060b1e]/85 to-transparent pointer-events-none" />

        <div className="relative z-10">
          <CommunityCTA />
          <Footer />
        </div>
      </div>
    </>
  );
}

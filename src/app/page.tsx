import { LandingNav } from "@/components/landing/LandingNav";
import { LandingHero } from "@/components/landing/LandingHero";
import { EnterpriseBanner } from "@/components/landing/EnterpriseBanner";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { InteractiveDemo } from "@/components/landing/InteractiveDemo";
import { ValueProps } from "@/components/landing/ValueProps";
import { MetricsSection } from "@/components/landing/MetricsSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { LandingFooter } from "@/components/landing/LandingFooter";

export const metadata = {
  title: "Generative AI Refacto | Autonomous Requirements & Traceability Platform",
  description:
    "Transform PDFs, specs, and screenshots into fully linked Use Cases, Requirements, and Test Cases with 100% bi-directional traceability.",
};

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink font-sans selection:bg-emerald-500/20 selection:text-emerald-600">
      <LandingNav />
      <main className="flex-1">
        <LandingHero />
        <EnterpriseBanner />
        <HowItWorks />
        <InteractiveDemo />
        <ValueProps />
        <MetricsSection />
        <PricingSection />
        <FinalCTA />
      </main>
      <LandingFooter />
    </div>
  );
}
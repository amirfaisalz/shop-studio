import {
  LandingHeader,
  LandingHero,
  LandingShowcase,
  LandingFeatures,
  LandingWorkflow,
  LandingPricing,
  LandingFAQ,
  LandingCTA,
  LandingFooter,
} from '@/components/landing';

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-white text-neutral-950 selection:bg-[#FF4500]/20 selection:text-[#FF4500]">
      <LandingHeader />
      <main>
        <LandingHero />
        <LandingShowcase />
        <LandingFeatures />
        <LandingWorkflow />
        <LandingPricing />
        <LandingFAQ />
        <LandingCTA />
      </main>
      <LandingFooter />
    </div>
  );
}

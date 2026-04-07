import PublicLayout from "@/components/layout/PublicLayout";
import HeroSection from "@/components/assessment/hero/HeroSection";
import DimensionsSection from "@/components/assessment/landing/DimensionsSection";
import ProcessSection from "@/components/assessment/landing/ProcessSection";
import StartAssessmentSection from "@/components/assessment/landing/StartAssessmentSection";

export default function AssessmentLandingPage() {
  return (
    <PublicLayout>
      <HeroSection />
      <DimensionsSection />
      <ProcessSection />
      <StartAssessmentSection />
    </PublicLayout>
  );
}
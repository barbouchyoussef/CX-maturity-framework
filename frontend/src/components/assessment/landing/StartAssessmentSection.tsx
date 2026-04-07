import { CheckCircle2 } from "lucide-react";
import FadeUp from "@/components/ui/FadeUp";
import AssessmentStartForm from "../forms/AssessmentStartForm";
import SectionHeader from "./SectionHeader";

export default function StartAssessmentSection() {
  return (
    <section id="start" className="px-5 py-16 md:px-8 md:py-24 lg:px-10 lg:py-28">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.08fr_0.92fr]">
        <div>
          <FadeUp>
            <SectionHeader
              eyebrow="Start the assessment"
              title="Begin with a concise and professional first step"
              description="This is not a contact-us page. It is the entry point to a structured maturity assessment, so the first form should collect only the essential information needed to begin."
            />
          </FadeUp>

          <FadeUp delay="delay-1">
            <div className="mt-10 rounded-3xl border border-[#E5E7EB] bg-white p-6 shadow-[0_16px_40px_rgba(0,0,0,0.05)] md:p-8">
              <AssessmentStartForm />
            </div>
          </FadeUp>
        </div>

        <div>
          <FadeUp delay="delay-2">
            <div className="rounded-[24px] border border-[#E5E7EB] bg-white p-6 shadow-[0_14px_34px_rgba(0,0,0,0.05)] md:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#C5A04F]">
                Why this first step matters
              </p>

              <h3 className="mt-4 text-[1.75rem] font-semibold leading-tight tracking-[-0.03em] text-[#1A1A1A]">
                Set the right context before scoring maturity
              </h3>

              <p className="mt-5 text-[1rem] leading-8 text-[#4B5563]">
                A strong maturity assessment should feel guided, not overwhelming. This
                first page helps establish profile, business context, and assessment scope
                before moving into the detailed evaluation flow.
              </p>

              <div className="mt-8 space-y-4">
                {[
                  "Simple and professional first interaction",
                  "Only essential data collected upfront",
                  "Clear transition into the questionnaire",
                  "Responsive layout for desktop and mobile",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-3 rounded-2xl border border-[#E5E7EB] bg-[#FCFCFC] px-4 py-4"
                  >
                    <div className="mt-0.5 rounded-full bg-[#F5F8F4] p-1.5 text-[#2D7A3A]">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <p className="text-sm leading-7 text-[#1A1A1A]">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}

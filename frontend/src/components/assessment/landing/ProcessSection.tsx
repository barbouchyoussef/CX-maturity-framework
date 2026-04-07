import FadeUp from "@/components/ui/FadeUp";
import SectionHeader from "./SectionHeader";

type Step = {
  number: string;
  title: string;
  description: string;
};

const steps: Step[] = [
  {
    number: "01",
    title: "Share your context",
    description:
      "Start with a few essential profile details so the assessment can be framed properly.",
  },
  {
    number: "02",
    title: "Answer guided questions",
    description:
      "Complete a structured maturity flow designed to evaluate your current capabilities.",
  },
  {
    number: "03",
    title: "Get actionable output",
    description:
      "Receive a maturity view, key findings, and practical recommendations to guide next steps.",
  },
];

export default function ProcessSection() {
  return (
    <section id="process" className="px-5 py-16 md:px-8 md:py-24 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <FadeUp>
          <SectionHeader
            eyebrow="How it works"
            title="A clean and guided flow from introduction to assessment"
            description="The page should feel structured and serious, not overwhelming. The user understands the process quickly, then enters the maturity journey with confidence."
          />
        </FadeUp>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {steps.map((step, index) => (
            <FadeUp
              key={step.number}
              delay={`delay-${Math.min(index + 1, 3)}`}
            >
              <div className="h-full rounded-3xl border border-[#E5E7EB] bg-white p-6 shadow-[0_10px_28px_rgba(0,0,0,0.04)]">
                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#E5E7EB] bg-[#FAFAFA] text-sm font-semibold text-[#1A1A1A]">
                  {step.number}
                </div>

                <h3 className="mt-5 text-[1.15rem] font-semibold text-[#1A1A1A]">
                  {step.title}
                </h3>

                <p className="mt-4 text-[0.98rem] leading-8 text-[#4B5563]">
                  {step.description}
                </p>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

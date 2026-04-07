import { ArrowRight, CheckCircle2 } from "lucide-react";
import FadeUp from "@/components/ui/FadeUp";
import AssessmentPreviewCard from "./AssessmentPreviewCard";

export default function HeroSection() {
  return (
    <section id="overview" className="px-5 py-16 md:px-8 md:py-24 lg:px-10 lg:py-28">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.12fr_0.88fr] lg:items-start">
        <div className="max-w-3xl">
          <FadeUp>
            <p className="mb-4 inline-flex items-center rounded-full border border-[#E5E7EB] bg-white px-3 py-1 text-[0.75rem] font-semibold uppercase tracking-[0.22em] text-[#C5A04F] shadow-[0_6px_20px_rgba(0,0,0,0.04)]">
              CX maturity assessment
            </p>
          </FadeUp>

          <FadeUp delay="delay-1">
            <h1 className="max-w-4xl text-[2.75rem] font-semibold leading-[0.98] tracking-[-0.05em] text-[#1A1A1A] md:text-[4.25rem]">
              Measure your customer experience maturity with clarity
            </h1>
          </FadeUp>

          <FadeUp delay="delay-2">
            <p className="mt-7 max-w-2xl text-[1.05rem] leading-8 text-[#4B5563] md:text-[1.2rem]">
              A structured enterprise assessment designed to evaluate your current CX
              capabilities, identify the most important gaps, and guide improvement
              priorities with a practical and executive-ready output.
            </p>
          </FadeUp>

          <FadeUp delay="delay-3">
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a
                href="#start"
                className="inline-flex min-h-13 items-center justify-center gap-2 rounded-xl bg-[#1A1A1A] px-6 py-3 text-sm font-semibold text-white transition hover:translate-y-[-1px] hover:shadow-[0_12px_30px_rgba(0,0,0,0.08)]"
              >
                Start assessment
                <ArrowRight className="h-4 w-4" />
              </a>

              <a
                href="#dimensions"
                className="inline-flex min-h-13 items-center justify-center rounded-xl border border-[#E5E7EB] bg-white px-6 py-3 text-sm font-semibold text-[#1A1A1A] transition hover:bg-[#FFFDF0]"
              >
                See framework
              </a>
            </div>
          </FadeUp>

          <FadeUp delay="delay-3">
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                "Structured scoring",
                "Actionable recommendations",
                "Executive-ready output",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-[0_10px_30px_rgba(0,0,0,0.04)]"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-full bg-[#F5F8F4] p-1.5 text-[#2D7A3A]">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <p className="text-sm font-medium leading-6 text-[#1A1A1A]">
                      {item}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </FadeUp>
        </div>

        <div className="lg:sticky lg:top-24">
          <FadeUp delay="delay-2">
            <AssessmentPreviewCard />
          </FadeUp>
        </div>
      </div>
    </section>
  );
}

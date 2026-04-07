import type { ReactNode } from "react";
import { BarChart3, LineChart, ShieldCheck, Users } from "lucide-react";
import FadeUp from "@/components/ui/FadeUp";
import SectionHeader from "./SectionHeader";

type Pillar = {
  title: string;
  description: string;
  icon: ReactNode;
};

const pillars: Pillar[] = [
  {
    title: "Strategy & Governance",
    description:
      "Evaluate how clearly CX priorities, ownership, and decision structures are defined across the organization.",
    icon: <ShieldCheck className="h-5 w-5" />,
  },
  {
    title: "Customer Understanding",
    description:
      "Measure how customer needs, feedback, and insight are captured and translated into operational action.",
    icon: <Users className="h-5 w-5" />,
  },
  {
    title: "Journey Design",
    description:
      "Assess how customer journeys are structured, improved, and aligned across channels and teams.",
    icon: <BarChart3 className="h-5 w-5" />,
  },
  {
    title: "Measurement & Improvement",
    description:
      "Review how KPIs, outcomes, and improvement loops support CX performance over time.",
    icon: <LineChart className="h-5 w-5" />,
  },
];

export default function DimensionsSection() {
  return (
    <section id="dimensions" className="px-5 py-16 md:px-8 md:py-24 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <FadeUp>
          <SectionHeader
            eyebrow="Assessment dimensions"
            title="A practical view of the capabilities that shape CX maturity"
            description="Inspired by the elegant editorial tone of the reference screenshots, this section keeps a calm consulting style while presenting the framework in a structured and responsive format."
          />
        </FadeUp>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {pillars.map((pillar, index) => (
            <FadeUp
              key={pillar.title}
              delay={index % 2 === 0 ? "delay-1" : "delay-2"}
            >
              <div className="h-full rounded-3xl border border-[#E5E7EB] bg-white p-6 shadow-[0_12px_30px_rgba(0,0,0,0.04)] md:p-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#E5E7EB] bg-[#FFFDF0] text-[#C5A04F]">
                  {pillar.icon}
                </div>

                <h3 className="mt-5 text-[1.3rem] font-semibold tracking-[-0.02em] text-[#1A1A1A]">
                  {pillar.title}
                </h3>

                <p className="mt-4 text-[0.98rem] leading-8 text-[#4B5563]">
                  {pillar.description}
                </p>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

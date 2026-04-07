import { ClipboardList } from "lucide-react";

export default function AssessmentPreviewCard() {
  return (
    <div className="rounded-3xl border border-[#E5E7EB] bg-white p-6 shadow-[0_16px_40px_rgba(0,0,0,0.06)] md:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#C5A04F]">
            Assessment preview
          </p>

          <h3 className="mt-4 text-[1.75rem] font-semibold leading-tight tracking-[-0.03em] text-[#1A1A1A]">
            What decision-makers will get
          </h3>
        </div>

        <div className="rounded-2xl border border-[#E5E7EB] bg-[#FFFDF0] p-3 text-[#C5A04F]">
          <ClipboardList className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-8 space-y-4">
        {[
          ["Estimated duration", "10-15 minutes"],
          ["Assessment type", "Guided and structured"],
          ["Primary output", "Score + findings + recommendations"],
          ["Audience", "CX, operations, transformation leaders"],
        ].map(([label, value]) => (
          <div
            key={label}
            className="flex items-center justify-between rounded-2xl border border-[#E5E7EB] bg-[#FCFCFC] px-4 py-4"
          >
            <span className="text-sm text-[#6B7280]">{label}</span>
            <span className="text-sm font-semibold text-[#1A1A1A]">{value}</span>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-[#E5E7EB] bg-[#FAFAFA] p-5">
        <p className="text-sm font-medium text-[#6B7280]">Sample maturity view</p>

        <div className="mt-5 space-y-5">
          {[
            ["Governance", "62%"],
            ["Customer Insight", "78%"],
            ["Journey Design", "51%"],
            ["Measurement", "68%"],
          ].map(([label, value], index) => (
            <div key={label}>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-[#1A1A1A]">{label}</span>
                <span className="font-semibold text-[#1A1A1A]">{value}</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-[#ECEFF1]">
                <div
                  className={`progress-fill h-full rounded-full ${
                    index === 1
                      ? "bg-[#2D7A3A]"
                      : index === 2
                        ? "bg-[#FFE600]"
                        : "bg-[#C5A04F]"
                  }`}
                  style={{ width: value }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-6 text-sm leading-7 text-[#6B7280]">
        The first page should create confidence immediately: clear value,
        structured scope, and a simple entry point into the assessment flow.
      </p>
    </div>
  );
}

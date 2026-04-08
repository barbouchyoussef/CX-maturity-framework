import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

const resultsLoadingSteps = [
  "Aggregating weighted dimension scores",
  "Mapping subdimension strengths and friction points",
  "Preparing deterministic recommendation themes",
];

const assessmentLoadingSteps = [
  "Resolving the configured industry",
  "Loading dimensions and subdimensions",
  "Tailoring the visible questionnaire",
];

export default function AssessmentGeneratingPage() {
  const { assessmentId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [progress, setProgress] = useState(18);
  const [stepIndex, setStepIndex] = useState(0);
  const next = searchParams.get("next") ?? "results";
  const sectorId = searchParams.get("sectorId");
  const isAssessmentPreparation = next === "form";
  const loadingSteps = isAssessmentPreparation
    ? assessmentLoadingSteps
    : resultsLoadingSteps;
  const redirectTarget = isAssessmentPreparation
    ? `/assessment/${assessmentId}${sectorId ? `?sectorId=${sectorId}` : ""}`
    : `/assessment/${assessmentId}/results`;

  useEffect(() => {
    const progressTimer = window.setInterval(() => {
      setProgress((current) => Math.min(current + 4, 96));
    }, 140);

    const stepTimer = window.setInterval(() => {
      setStepIndex((current) => Math.min(current + 1, loadingSteps.length - 1));
    }, 760);

    const redirectTimer = window.setTimeout(() => {
      navigate(redirectTarget, { replace: true });
    }, 2900);

    return () => {
      window.clearInterval(progressTimer);
      window.clearInterval(stepTimer);
      window.clearTimeout(redirectTimer);
    };
  }, [loadingSteps.length, navigate, redirectTarget]);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F8F8FA] px-6 py-12 text-[#111827]">
      <style>
        {`
          @keyframes resultOrbPulse {
            0%, 100% { transform: scale(1); opacity: 0.95; }
            50% { transform: scale(1.08); opacity: 1; }
          }

          @keyframes orbitSpin {
            to { transform: rotate(360deg); }
          }

          @keyframes softFloat {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-14px); }
          }
        `}
      </style>

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_15%,rgba(56,88,233,0.15),transparent_34%),linear-gradient(135deg,rgba(214,244,237,0.65),rgba(255,240,230,0.72)_55%,rgba(255,255,255,0.95))]" />
      <div className="absolute left-[-10%] top-[10%] h-72 w-72 rounded-full bg-[#BFE4C6]/35 blur-3xl" />
      <div className="absolute bottom-[-12%] right-[-8%] h-96 w-96 rounded-full bg-[#F0DFAC]/50 blur-3xl" />

      <section className="relative z-10 mx-auto w-full max-w-3xl text-center">
        <div className="relative mx-auto mb-10 h-44 w-44" style={{ animation: "softFloat 4s ease-in-out infinite" }}>
          <div className="absolute inset-0 rounded-full border border-[#3858E9]/15" />
          <div
            className="absolute inset-5 rounded-full border border-[#3858E9]/20"
            style={{ animation: "orbitSpin 6s linear infinite" }}
          >
            <span className="absolute right-2 top-5 h-3 w-3 rounded-full bg-[#3858E9]" />
            <span className="absolute bottom-6 left-3 h-2 w-2 rounded-full bg-[#C5A04F]" />
          </div>
          <div className="absolute inset-12 rounded-full bg-white shadow-[0_24px_60px_rgba(17,24,39,0.18)]" />
          <div
            className="absolute inset-[4.65rem] rounded-full bg-[radial-gradient(circle,#6C45FF_0%,#5135D8_60%,#3858E9_100%)] shadow-[0_0_44px_rgba(81,53,216,0.42)]"
            style={{ animation: "resultOrbPulse 2.2s ease-in-out infinite" }}
          />
        </div>

        <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#C5A04F]">
          {isAssessmentPreparation
            ? "Assessment preparation in progress"
            : "Maturity synthesis in progress"}
        </p>
        <h1 className="mt-5 text-4xl font-semibold tracking-[-0.05em] text-[#111827] md:text-6xl">
          {isAssessmentPreparation
            ? "Generating your custom CX maturity assessment..."
            : "Generating your CX maturity results..."}
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-[#667085]">
          {isAssessmentPreparation
            ? "We are preparing the configured sector questionnaire, visible dimensions, and required progress logic."
            : "We are consolidating the scored answers into weighted dimensions, subdimensions, strengths, pain points, and recommendation themes."}
        </p>

        <div className="mx-auto mt-12 max-w-xl text-left">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.22em] text-[#667085]">
            <span>
              {isAssessmentPreparation ? "Assessment preparation" : "Score preparation"}
            </span>
            <span className="text-[#3858E9]">{progress}%</span>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white shadow-inner">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,#3858E9,#6C45FF,#C5A04F)] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="mt-5 grid gap-3 text-sm text-[#667085] sm:grid-cols-3">
            {loadingSteps.map((step, index) => (
              <div
                key={step}
                className={`rounded-2xl border px-4 py-3 ${
                  index <= stepIndex
                    ? "border-[#C5A04F]/50 bg-white text-[#111827] shadow-[0_12px_28px_rgba(17,24,39,0.06)]"
                    : "border-white/70 bg-white/45"
                }`}
              >
                <span className="mr-2 text-[#C5A04F]">-</span>
                {step}
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

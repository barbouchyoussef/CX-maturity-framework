import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  Compass,
  Flag,
  Target,
} from "lucide-react";
import { getAssessmentResults } from "@/features/assessment/api/assessmentApi";
import type {
  AssessmentAreaHighlight,
  AssessmentRecommendation,
  AssessmentResults,
} from "@/features/assessment/types/assessment.types";

const priorityOrder = ["Now", "Next", "Later"];

function clampScore(score: number | null | undefined) {
  if (score === null || score === undefined || Number.isNaN(score)) return 0;
  return Math.min(Math.max(score, 0), 100);
}

function formatScore(score: number | null | undefined) {
  if (score === null || score === undefined || Number.isNaN(score)) return "-";
  return `${score.toFixed(1)}%`;
}

function formatBand(band: string | null | undefined) {
  if (!band) return "Not calculated";
  return band
    .replace(/_/g, " ")
    .split(" ")
    .map((item) => item.charAt(0).toUpperCase() + item.slice(1))
    .join(" ");
}

function toneForScore(score: number | null | undefined) {
  const safeScore = clampScore(score);
  if (safeScore >= 75) return "#2D7A3A";
  if (safeScore >= 50) return "#C5A04F";
  return "#B42318";
}

function narrativeForScore(score: number | null | undefined) {
  if (score === null || score === undefined) {
    return "The assessment has been captured, but the weighted maturity score is not available yet.";
  }

  if (score >= 75) {
    return "Your CX operating model shows a strong maturity base. The immediate opportunity is to scale the strongest practices across journeys and protect consistency as the organization grows.";
  }

  if (score >= 50) {
    return "Your CX maturity is developing with visible pockets of strength. The next step is to standardize ownership, evidence, metrics, and repeatable routines across the priority journeys.";
  }

  return "Your CX maturity is still forming. The best path is to stabilize a smaller number of critical journeys, assign clear owners, and remove the highest-friction customer pain points first.";
}

function weightedContribution(score: number | null, weight: number) {
  if (score === null) return null;
  return (score * weight) / 100;
}

function WeightedBar({
  label,
  score,
  weight,
  caption,
}: {
  label: string;
  score: number | null;
  weight: number;
  caption?: string;
}) {
  const safeScore = clampScore(score);
  const tone = toneForScore(score);
  const contribution = weightedContribution(score, weight);

  return (
    <div className="rounded-[1.4rem] border border-[#E5E7EB] bg-white p-5 shadow-[0_12px_32px_rgba(17,24,39,0.04)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-[#111827]">{label}</h3>
          {caption ? (
            <p className="mt-1 text-sm leading-6 text-[#667085]">{caption}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="rounded-full border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-1 text-xs font-semibold text-[#667085]">
            Weight {weight.toFixed(1)}%
          </span>
          <span className="rounded-full bg-[#111827] px-3 py-1 text-xs font-semibold text-white">
            {formatScore(score)}
          </span>
        </div>
      </div>

      <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-[#EEF2F7]">
        <div
          className="weighted-result-bar h-full rounded-full"
          style={
            {
              "--bar-target": `${safeScore}%`,
              background: `linear-gradient(90deg, ${tone}, #C5A04F)`,
            } as CSSProperties
          }
        />
      </div>

      <div className="mt-3 flex justify-between text-xs text-[#667085]">
        <span>Weighted contribution</span>
        <span>{contribution === null ? "-" : `${contribution.toFixed(1)} pts`}</span>
      </div>
    </div>
  );
}

function HighlightCard({
  item,
  kind,
}: {
  item: AssessmentAreaHighlight;
  kind: "strength" | "pain";
}) {
  const accent = kind === "strength" ? "#2D7A3A" : "#B42318";
  const soft = kind === "strength" ? "#F0F9F2" : "#FFF5F5";

  return (
    <article className="rounded-[1.4rem] border border-[#E5E7EB] bg-white p-5 shadow-[0_12px_32px_rgba(17,24,39,0.04)]">
      <div
        className="inline-flex rounded-full px-3 py-1 text-xs font-semibold"
        style={{ backgroundColor: soft, color: accent }}
      >
        {kind === "strength" ? "Strength" : "Pain point"}
      </div>
      <h3 className="mt-4 text-lg font-semibold text-[#111827]">
        {item.subdimension_name}
      </h3>
      <p className="mt-2 text-sm leading-6 text-[#667085]">
        {item.dimension_name} / {formatBand(item.maturity_band)}
      </p>
      <div className="mt-5 text-3xl font-semibold tracking-[-0.04em]" style={{ color: accent }}>
        {formatScore(item.score_percent)}
      </div>
    </article>
  );
}

function RecommendationCard({
  recommendation,
}: {
  recommendation: AssessmentRecommendation;
}) {
  return (
    <article className="rounded-[1.4rem] border border-[#E5E7EB] bg-white p-5 shadow-[0_12px_32px_rgba(17,24,39,0.04)]">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-[#111827] px-3 py-1 text-xs font-semibold text-white">
          {recommendation.priority_level}
        </span>
        <span className="rounded-full bg-[#FFF8CC] px-3 py-1 text-xs font-semibold text-[#8A6B10]">
          {formatBand(recommendation.source_theme_type)} maturity theme
        </span>
      </div>
      <h3 className="mt-4 text-lg font-semibold text-[#111827]">
        {recommendation.recommendation_title}
      </h3>
      <p className="mt-3 text-sm leading-7 text-[#667085]">
        {recommendation.recommendation_text}
      </p>
    </article>
  );
}

export default function AssessmentResultsPage() {
  const { assessmentId } = useParams();
  const numericAssessmentId = Number(assessmentId);
  const [results, setResults] = useState<AssessmentResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadResults() {
      if (!Number.isFinite(numericAssessmentId) || numericAssessmentId <= 0) {
        setError("Invalid assessment result link.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        setResults(await getAssessmentResults(numericAssessmentId));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load assessment results.");
      } finally {
        setLoading(false);
      }
    }

    loadResults();
  }, [numericAssessmentId]);

  const allSubdimensions = useMemo(() => {
    if (!results) return [];
    return results.dimensions.flatMap((dimension) =>
      dimension.subdimensions.map((subdimension) => ({
        ...subdimension,
        dimensionName: dimension.name,
      }))
    );
  }, [results]);

  const recommendations = useMemo(() => {
    if (!results) return [];
    const source =
      results.recommendations.length > 0
        ? results.recommendations
        : allSubdimensions.flatMap((subdimension) => subdimension.recommendations);

    return [...source].sort((a, b) => {
      const priorityDiff =
        priorityOrder.indexOf(a.priority_level) - priorityOrder.indexOf(b.priority_level);
      return priorityDiff || a.subdimension_id - b.subdimension_id;
    });
  }, [allSubdimensions, results]);

  const strengths = useMemo(() => {
    if (!results) return [];
    if (results.strengths.length > 0) return results.strengths;

    return allSubdimensions
      .filter((item) => item.normalized_score_percent !== null)
      .sort((a, b) => (b.normalized_score_percent ?? 0) - (a.normalized_score_percent ?? 0))
      .slice(0, 3)
      .map((item) => ({
        dimension_id: 0,
        dimension_name: item.dimensionName,
        subdimension_id: item.subdimension_id,
        subdimension_name: item.name,
        score_percent: item.normalized_score_percent,
        maturity_band: item.maturity_band,
      }));
  }, [allSubdimensions, results]);

  const painPoints = useMemo(() => {
    if (!results) return [];
    if (results.pain_points.length > 0) return results.pain_points.slice(0, 3);

    return allSubdimensions
      .filter((item) => item.normalized_score_percent !== null)
      .sort((a, b) => (a.normalized_score_percent ?? 0) - (b.normalized_score_percent ?? 0))
      .slice(0, 3)
      .map((item) => ({
        dimension_id: 0,
        dimension_name: item.dimensionName,
        subdimension_id: item.subdimension_id,
        subdimension_name: item.name,
        score_percent: item.normalized_score_percent,
        maturity_band: item.maturity_band,
      }));
  }, [allSubdimensions, results]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F8F8FA] px-6 py-12 text-[#111827]">
        <div className="mx-auto max-w-6xl rounded-[2rem] border border-[#E5E7EB] bg-white p-8 text-sm text-[#667085] shadow-[0_20px_60px_rgba(17,24,39,0.06)]">
          Loading the structured results model...
        </div>
      </main>
    );
  }

  if (error || !results) {
    return (
      <main className="min-h-screen bg-[#F8F8FA] px-6 py-12 text-[#111827]">
        <div className="mx-auto max-w-6xl rounded-[2rem] border border-[#F3D6D6] bg-[#FFF5F5] p-8 text-sm text-[#B42318]">
          {error ?? "No result was found for this assessment."}
        </div>
      </main>
    );
  }

  const overallScore = results.overall_score;
  const overallTone = toneForScore(overallScore);

  return (
    <main className="min-h-screen bg-[#F8F8FA] text-[#111827]">
      <style>
        {`
          @keyframes resultBarGrow {
            from { width: 0; }
            to { width: var(--bar-target); }
          }

          @keyframes resultFadeUp {
            from { opacity: 0; transform: translateY(18px); }
            to { opacity: 1; transform: translateY(0); }
          }

          .weighted-result-bar {
            width: var(--bar-target);
            animation: resultBarGrow 1.1s cubic-bezier(0.22, 1, 0.36, 1) both;
          }

          .results-fade-up {
            animation: resultFadeUp 0.7s ease both;
          }
        `}
      </style>

      <header className="border-b border-[#E5E7EB] bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 md:px-8 lg:px-10">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#667085] transition hover:text-[#111827]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to landing
          </Link>
          <span className="text-sm font-semibold text-[#667085]">
            Assessment #{results.assessment_id}
          </span>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-[#E5E7EB] bg-white">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(214,244,237,0.72),rgba(255,240,230,0.84)_55%,rgba(255,255,255,0.96))]" />
        <div className="absolute inset-0 opacity-[0.26] [background-image:linear-gradient(#E5E7EB_1px,transparent_1px),linear-gradient(90deg,#E5E7EB_1px,transparent_1px)] [background-size:42px_42px]" />

        <div className="relative mx-auto grid max-w-7xl gap-10 px-5 py-16 md:px-8 lg:grid-cols-[0.68fr_0.32fr] lg:px-10 lg:py-20">
          <div className="results-fade-up">
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#C5A04F]">
              CX maturity assessment
            </p>
            <h1 className="mt-5 max-w-4xl text-5xl font-semibold tracking-[-0.06em] text-[#111827] md:text-7xl">
              Your CX maturity results
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-[#667085]">
              {narrativeForScore(overallScore)}
            </p>

            <div className="mt-8 flex flex-wrap gap-3 text-sm font-semibold">
              <span className="rounded-full border border-white bg-white/70 px-4 py-2 text-[#111827] shadow-sm">
                Sector: {results.sector_name ?? "Not configured"}
              </span>
              <span className="rounded-full border border-white bg-white/70 px-4 py-2 text-[#111827] shadow-sm">
                Band: {formatBand(results.maturity_level)}
              </span>
              <span className="rounded-full border border-white bg-white/70 px-4 py-2 text-[#111827] shadow-sm">
                Company: {results.company_name ?? "Assessment"}
              </span>
            </div>
          </div>

          <div className="results-fade-up rounded-[2rem] border border-white bg-white/80 p-6 shadow-[0_24px_70px_rgba(17,24,39,0.10)] backdrop-blur">
            <div
              className="mx-auto flex h-56 w-56 items-center justify-center rounded-full"
              style={{
                background: `conic-gradient(${overallTone} ${clampScore(
                  overallScore
                )}%, #EEF2F7 0)`,
              }}
            >
              <div className="flex h-40 w-40 flex-col items-center justify-center rounded-full bg-white text-center shadow-inner">
                <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[#667085]">
                  Overall
                </span>
                <span className="mt-2 text-4xl font-semibold tracking-[-0.06em] text-[#111827]">
                  {formatScore(overallScore)}
                </span>
              </div>
            </div>
            <p className="mt-6 text-center text-sm leading-6 text-[#667085]">
              Weighted maturity score across scored visible questions, subdimensions,
              and active dimensions.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-10 md:grid-cols-3 md:px-8 lg:px-10">
        <div className="rounded-[1.4rem] border border-[#E5E7EB] bg-white p-5 shadow-[0_12px_32px_rgba(17,24,39,0.04)]">
          <BarChart3 className="h-6 w-6 text-[#C5A04F]" />
          <p className="mt-5 text-sm font-semibold text-[#667085]">Dimensions scored</p>
          <p className="mt-2 text-4xl font-semibold tracking-[-0.05em]">
            {results.dimensions.filter((dimension) => dimension.score_percent !== null).length}
          </p>
        </div>
        <div className="rounded-[1.4rem] border border-[#E5E7EB] bg-white p-5 shadow-[0_12px_32px_rgba(17,24,39,0.04)]">
          <Target className="h-6 w-6 text-[#2D7A3A]" />
          <p className="mt-5 text-sm font-semibold text-[#667085]">Top strength</p>
          <p className="mt-2 text-xl font-semibold tracking-[-0.03em]">
            {strengths[0]?.subdimension_name ?? "Not available"}
          </p>
        </div>
        <div className="rounded-[1.4rem] border border-[#E5E7EB] bg-white p-5 shadow-[0_12px_32px_rgba(17,24,39,0.04)]">
          <Compass className="h-6 w-6 text-[#B42318]" />
          <p className="mt-5 text-sm font-semibold text-[#667085]">
            Priority pain point
          </p>
          <p className="mt-2 text-xl font-semibold tracking-[-0.03em]">
            {painPoints[0]?.subdimension_name ?? "Not available"}
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-5 pb-12 md:px-8 lg:grid-cols-[0.62fr_0.38fr] lg:px-10">
        <div>
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#C5A04F]">
              Dimension overview
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.05em]">
              Weighted performance by CX capability
            </h2>
          </div>

          <div className="grid gap-4">
            {results.dimensions.map((dimension) => (
              <WeightedBar
                key={dimension.dimension_id}
                label={dimension.name}
                score={dimension.score_percent}
                weight={dimension.weight}
                caption={`Dimension ${dimension.code}`}
              />
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-[#E5E7EB] bg-white p-6 shadow-[0_20px_60px_rgba(17,24,39,0.06)]">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#C5A04F]">
            Interpretation
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em]">
            What the story says
          </h2>
          <p className="mt-4 text-sm leading-7 text-[#667085]">
            Strengths show the capabilities that can be used as accelerators.
            Pain points are deliberately limited to the top three lowest-scoring
            subdimensions so the plan stays focused and actionable.
          </p>
          <div className="mt-6 space-y-3">
            {recommendations.slice(0, 3).map((recommendation) => (
              <div
                key={`${recommendation.subdimension_id}-${recommendation.recommendation_title}`}
                className="rounded-2xl bg-[#F8FAFC] p-4 text-sm leading-6 text-[#667085]"
              >
                <span className="font-semibold text-[#111827]">
                  {recommendation.priority_level}:
                </span>{" "}
                {recommendation.recommendation_title}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-5 pb-12 md:px-8 lg:grid-cols-2 lg:px-10">
        <div>
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#2D7A3A]">
                Strengths
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.05em]">
                What is working well
              </h2>
            </div>
          </div>
          <div className="grid gap-4">
            {strengths.map((item) => (
              <HighlightCard
                key={`strength-${item.subdimension_id}`}
                item={item}
                kind="strength"
              />
            ))}
          </div>
        </div>

        <div>
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#B42318]">
                Pain points
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.05em]">
                Top 3 priority gaps
              </h2>
            </div>
            <span className="rounded-full border border-[#E5E7EB] bg-white px-3 py-1 text-xs font-semibold text-[#667085]">
              Limited view
            </span>
          </div>
          <div className="grid gap-4">
            {painPoints.map((item) => (
              <HighlightCard
                key={`pain-${item.subdimension_id}`}
                item={item}
                kind="pain"
              />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-12 md:px-8 lg:px-10">
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#C5A04F]">
            Recommendation roadmap
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-[-0.05em]">
            Score-driven actions by maturity theme
          </h2>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {priorityOrder.map((priority) => {
            const items = recommendations.filter(
              (recommendation) => recommendation.priority_level === priority
            );

            return (
              <div key={priority} className="rounded-[2rem] border border-[#E5E7EB] bg-[#FCFCFC] p-4">
                <div className="mb-4 flex items-center gap-2 px-1">
                  <Flag className="h-4 w-4 text-[#C5A04F]" />
                  <h3 className="text-lg font-semibold">{priority}</h3>
                  <span className="ml-auto rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-[#667085]">
                    {items.length}
                  </span>
                </div>
                <div className="grid gap-4">
                  {items.length > 0 ? (
                    items.map((recommendation) => (
                      <RecommendationCard
                        key={`${priority}-${recommendation.subdimension_id}-${recommendation.recommendation_title}`}
                        recommendation={recommendation}
                      />
                    ))
                  ) : (
                    <div className="rounded-[1.4rem] border border-dashed border-[#D0D5DD] bg-white p-5 text-sm leading-6 text-[#667085]">
                      No {priority.toLowerCase()} actions were generated from the
                      current score profile.
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-16 md:px-8 lg:px-10">
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#C5A04F]">
            Subdimension detail
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-[-0.05em]">
            Evidence base for the next page
          </h2>
        </div>

        <div className="grid gap-6">
          {results.dimensions.map((dimension) => (
            <div
              key={`detail-${dimension.dimension_id}`}
              className="rounded-[2rem] border border-[#E5E7EB] bg-white p-6 shadow-[0_18px_52px_rgba(17,24,39,0.05)]"
            >
              <div className="flex flex-col gap-2 border-b border-[#E5E7EB] pb-5 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-xl font-semibold">{dimension.name}</h3>
                <span className="rounded-full bg-[#F8FAFC] px-3 py-1 text-xs font-semibold text-[#667085]">
                  {formatScore(dimension.score_percent)}
                </span>
              </div>

              <div className="mt-5 grid gap-4">
                {dimension.subdimensions.map((subdimension) => (
                  <div
                    key={subdimension.subdimension_id}
                    className="rounded-[1.4rem] border border-[#E5E7EB] bg-[#FCFCFC] p-5"
                  >
                    <WeightedBar
                      label={subdimension.name}
                      score={subdimension.normalized_score_percent}
                      weight={subdimension.weight}
                      caption={`${subdimension.code} / ${formatBand(
                        subdimension.maturity_band
                      )}`}
                    />
                    {subdimension.recommendations.length > 0 ? (
                      <div className="mt-4 rounded-2xl bg-white p-4 text-sm leading-6 text-[#667085]">
                        <CheckCircle2 className="mb-2 h-4 w-4 text-[#2D7A3A]" />
                        {subdimension.recommendations[0].recommendation_text}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

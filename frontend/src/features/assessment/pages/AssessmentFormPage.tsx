import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { CheckCircle2, Trophy } from "lucide-react";
import {
  getAssessment,
  submitAssessment,
} from "@/features/assessment/api/assessmentApi";
import type {
  Assessment,
  AssessmentAnswerSubmit,
} from "@/features/assessment/types/assessment.types";
import { getDimensions } from "@/features/dimensions/api/dimensionsApi";
import type { Dimension } from "@/features/dimensions/types/dimension.types";
import { getQuestions } from "@/features/questions/api/questionsApi";
import type {
  AnswerOption,
  DisplayRule,
  Question,
} from "@/features/questions/types/question.types";
import { getSectors } from "@/features/sectors/api/sectorsApi";
import type { Sector } from "@/features/sectors/types/sector.types";
import { getSubdimensions } from "@/features/subdimensions/api/subdimensionsApi";
import type { Subdimension } from "@/features/subdimensions/types/subdimension.types";

type AnswerValue = string | string[];
type AnswerState = Record<number, AnswerValue>;

const dimensionThemes = [
  {
    accent: "#C5A04F",
    soft: "#FFF8CC",
    border: "#F0DFAC",
    label: "Gold path",
  },
  {
    accent: "#2D7A3A",
    soft: "#F0F9F2",
    border: "#BFE4C6",
    label: "Growth path",
  },
  {
    accent: "#3858E9",
    soft: "#EEF2FF",
    border: "#C7D2FE",
    label: "Focus path",
  },
  {
    accent: "#9A3412",
    soft: "#FFF7ED",
    border: "#FED7AA",
    label: "Momentum path",
  },
];

function sortByOrder<T extends { display_order: number; id?: number }>(items: T[]) {
  return [...items].sort(
    (a, b) => a.display_order - b.display_order || (a.id ?? 0) - (b.id ?? 0)
  );
}

function getOptionScore(question: Question, value: string) {
  return question.options.find((option) => option.option_value === value)?.score;
}

function getAnswerScore(question: Question, value: AnswerValue | undefined) {
  if (!value) return null;

  if (Array.isArray(value)) {
    const scores = value
      .map((item) => getOptionScore(question, item))
      .filter((score): score is number => typeof score === "number");

    if (scores.length === 0) return null;
    return Math.max(...scores);
  }

  return getOptionScore(question, value) ?? null;
}

function isRuleSatisfied(
  rule: DisplayRule,
  questionsById: Map<number, Question>,
  answers: AnswerState
) {
  const sourceQuestion = questionsById.get(rule.depends_on_question_id);
  if (!sourceQuestion) return false;

  const answer = answers[rule.depends_on_question_id];
  const score = getAnswerScore(sourceQuestion, answer);

  if (score === null) return false;

  if (rule.operator === "score_gte") {
    return score >= (rule.min_score ?? 0);
  }

  if (rule.operator === "score_lte") {
    return score <= (rule.max_score ?? rule.min_score ?? 0);
  }

  if (rule.operator === "score_between") {
    const min = rule.min_score ?? Number.NEGATIVE_INFINITY;
    const max = rule.max_score ?? Number.POSITIVE_INFINITY;
    return score >= min && score <= max;
  }

  return true;
}

function getMaturityRuleType(rule: DisplayRule) {
  const group = rule.rule_group?.toLowerCase() ?? "";
  if (group === "low" || group.includes("low_maturity")) return "low";
  if (group === "high" || group.includes("high_maturity")) return "high";
  return null;
}

function getDimensionMaturityScore(
  targetQuestion: Question,
  questions: Question[],
  subdimensionsById: Map<number, Subdimension>,
  answers: AnswerState
) {
  const targetSubdimension = subdimensionsById.get(targetQuestion.subdimension_id);
  if (!targetSubdimension) return null;

  const dimensionQuestionScores = questions
    .filter((question) => {
      const questionSubdimension = subdimensionsById.get(question.subdimension_id);

      return (
        question.id !== targetQuestion.id &&
        question.is_active &&
        question.is_scored &&
        question.is_mandatory &&
        question.display_rules.filter((rule) => rule.is_active).length === 0 &&
        questionSubdimension?.dimension_id === targetSubdimension.dimension_id
      );
    })
    .map((question) => getAnswerScore(question, answers[question.id]));

  const answeredScores = dimensionQuestionScores.filter(
    (score): score is number => score !== null
  );

  if (
    dimensionQuestionScores.length === 0 ||
    answeredScores.length !== dimensionQuestionScores.length
  ) {
    return null;
  }

  const total = answeredScores.reduce((sum, score) => sum + score, 0);

  return total / answeredScores.length;
}

function isQuestionVisible(
  question: Question,
  questions: Question[],
  questionsById: Map<number, Question>,
  subdimensionsById: Map<number, Subdimension>,
  answers: AnswerState
) {
  const activeRules = question.display_rules.filter((rule) => rule.is_active);
  if (activeRules.length === 0) return true;

  return activeRules.every((rule) => {
    const maturityRuleType = getMaturityRuleType(rule);

    if (maturityRuleType) {
      const dimensionScore = getDimensionMaturityScore(
        question,
        questions,
        subdimensionsById,
        answers
      );

      if (dimensionScore === null) return false;

      return maturityRuleType === "low"
        ? dimensionScore <= (rule.max_score ?? 1)
        : dimensionScore >= (rule.min_score ?? 3);
    }

    return isRuleSatisfied(rule, questionsById, answers);
  });
}

function isAnswered(question: Question, answers: AnswerState) {
  const answer = answers[question.id];

  if (Array.isArray(answer)) return answer.length > 0;
  return typeof answer === "string" && answer.trim().length > 0;
}

function getVisibleHelperText(helperText: string | null) {
  const hiddenSeedLabels = new Set([
    "Seed data for dynamic assessment form.",
    "Seed follow-up for dynamic assessment form.",
    "Seed optional text area for dynamic assessment form.",
  ]);

  if (!helperText || hiddenSeedLabels.has(helperText.trim())) return null;
  return helperText;
}

export default function AssessmentFormPage() {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [dimensions, setDimensions] = useState<Dimension[]>([]);
  const [subdimensions, setSubdimensions] = useState<Subdimension[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<AnswerState>({});
  const [currentDimensionIndex, setCurrentDimensionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const numericAssessmentId = Number(assessmentId);
  const querySectorId = Number(searchParams.get("sectorId"));
  const sectorId =
    Number.isFinite(querySectorId) && querySectorId > 0
      ? querySectorId
      : assessment?.sector_id ?? null;

  useEffect(() => {
    async function loadAssessmentForm() {
      if (!numericAssessmentId) {
        setError("Invalid assessment link.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const assessmentData = await getAssessment(numericAssessmentId);
        const resolvedSectorId =
          Number.isFinite(querySectorId) && querySectorId > 0
            ? querySectorId
            : assessmentData.sector_id;

        if (!resolvedSectorId) {
          throw new Error("This assessment does not have a configured sector.");
        }

        const [sectorData, dimensionData, subdimensionData, questionData] =
          await Promise.all([
            getSectors(),
            getDimensions(),
            getSubdimensions(),
            getQuestions({ sectorId: resolvedSectorId }),
          ]);

        setAssessment(assessmentData);
        setSectors(sectorData);
        setDimensions(dimensionData);
        setSubdimensions(subdimensionData);
        setQuestions(questionData);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load assessment form"
        );
      } finally {
        setLoading(false);
      }
    }

    loadAssessmentForm();
  }, [numericAssessmentId, querySectorId]);

  const questionsById = useMemo(
    () => new Map(questions.map((question) => [question.id, question])),
    [questions]
  );

  const subdimensionsById = useMemo(
    () =>
      new Map(
        subdimensions.map((subdimension) => [subdimension.id, subdimension])
      ),
    [subdimensions]
  );

  const activeDimensions = useMemo(
    () => sortByOrder(dimensions.filter((dimension) => dimension.is_active)),
    [dimensions]
  );

  const visibleQuestions = useMemo(
    () =>
      questions.filter(
        (question) =>
          question.is_active &&
          isQuestionVisible(
            question,
            questions,
            questionsById,
            subdimensionsById,
            answers
          )
      ),
    [answers, questions, questionsById, subdimensionsById]
  );

  const requiredVisibleQuestions = visibleQuestions.filter(
    (question) => question.is_mandatory
  );
  const totalQuestions = requiredVisibleQuestions.length;
  const answeredQuestions = requiredVisibleQuestions.filter((question) =>
    isAnswered(question, answers)
  ).length;
  const progress =
    totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;

  const currentDimension =
    activeDimensions[currentDimensionIndex] ?? activeDimensions[0] ?? null;
  const currentTheme =
    dimensionThemes[currentDimensionIndex % dimensionThemes.length] ??
    dimensionThemes[0];
  const selectedSector =
    sectors.find((sector) => sector.id === sectorId)?.name ?? "Selected sector";

  const dimensionProgress = activeDimensions.map((dimension) => {
    const subdimensionIds = subdimensions
      .filter((subdimension) => subdimension.dimension_id === dimension.id)
      .map((subdimension) => subdimension.id);
    const dimensionQuestions = visibleQuestions.filter(
      (question) =>
        question.is_mandatory &&
        subdimensionIds.includes(question.subdimension_id)
    );
    const completed = dimensionQuestions.filter((question) =>
      isAnswered(question, answers)
    ).length;

    return {
      dimension,
      completed,
      total: dimensionQuestions.length,
    };
  });
  const completedSteps = dimensionProgress.filter(
    (item) => item.total > 0 && item.completed === item.total
  ).length;

  const handleSingleSelect = (questionId: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleMultiSelect = (questionId: number, value: string) => {
    setAnswers((prev) => {
      const existing = Array.isArray(prev[questionId])
        ? (prev[questionId] as string[])
        : [];
      const next = existing.includes(value)
        ? existing.filter((item) => item !== value)
        : [...existing, value];

      return { ...prev, [questionId]: next };
    });
  };

  const handleTextAnswer = (questionId: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const buildSubmissionAnswers = () => {
    const payloadAnswers: AssessmentAnswerSubmit[] = [];

    visibleQuestions.forEach((question) => {
      const answer = answers[question.id];

      if (question.answer_type === "text_area") {
        const answerText = typeof answer === "string" ? answer : "";
        if (question.is_mandatory || answerText.trim().length > 0) {
          payloadAnswers.push({
            question_id: question.id,
            answer_text: answerText,
          });
        }
        return;
      }

      if (question.answer_type === "multi_select") {
        const selectedValues = Array.isArray(answer) ? answer : [];
        const selectedOptionIds = question.options
          .filter(
            (option) =>
              option.is_active &&
              option.id &&
              selectedValues.includes(option.option_value)
          )
          .map((option) => option.id as number);

        if (question.is_mandatory || selectedOptionIds.length > 0) {
          payloadAnswers.push({
            question_id: question.id,
            selected_option_ids: selectedOptionIds,
          });
        }
        return;
      }

      const selectedOption = question.options.find(
        (option) =>
          option.is_active &&
          option.id &&
          typeof answer === "string" &&
          option.option_value === answer
      );

      if (question.is_mandatory || selectedOption?.id) {
        payloadAnswers.push({
          question_id: question.id,
          selected_option_id: selectedOption?.id ?? null,
        });
      }
    });

    return payloadAnswers;
  };

  const handleSubmitAssessment = async () => {
    const unansweredMandatoryQuestions = visibleQuestions.filter(
      (question) => question.is_mandatory && !isAnswered(question, answers)
    );

    if (unansweredMandatoryQuestions.length > 0) {
      alert("Please answer all mandatory visible questions before calculating the score.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await submitAssessment(numericAssessmentId, {
        answers: buildSubmissionAnswers(),
      });

      setAssessment((prev) =>
        prev
          ? {
              ...prev,
              status: "completed",
              overall_score: result.overall_score,
              maturity_level: result.maturity_level,
            }
          : prev
      );

      navigate(`/assessment/${numericAssessmentId}/generating?next=results`);
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Failed to submit and calculate the assessment."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] px-5 py-10 text-[#1A1A1A]">
        <div className="mx-auto max-w-5xl rounded-3xl border border-[#E5E7EB] bg-white p-8 text-sm text-[#6B7280]">
          Loading your assessment...
        </div>
      </div>
    );
  }

  if (error || !currentDimension) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] px-5 py-10 text-[#1A1A1A]">
        <div className="mx-auto max-w-5xl rounded-3xl border border-[#F3D6D6] bg-[#FFF5F5] p-8 text-sm text-[#B42318]">
          {error ?? "No active assessment dimensions were found."}
        </div>
      </div>
    );
  }

  const currentSubdimensions = sortByOrder(
    subdimensions.filter(
      (subdimension) =>
        subdimension.is_active &&
        subdimension.dimension_id === currentDimension.id
    )
  );

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#1A1A1A]">
      <header className="border-b border-[#E5E7EB] bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-5 md:flex-row md:items-center md:justify-between md:px-8 lg:px-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#C5A04F]">
              CX maturity assessment
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
              {assessment?.company_name ?? "Assessment"} questionnaire
            </h1>
          </div>

          <div className="rounded-2xl border border-[#E5E7EB] bg-[#FCFCFC] px-4 py-3 text-sm text-[#4B5563]">
            {selectedSector} / Assessment #{numericAssessmentId}
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-5 py-8 md:px-8 lg:grid-cols-[0.72fr_0.28fr] lg:px-10">
        <section className="space-y-6">
          <div
            className="rounded-3xl border bg-white p-6 shadow-[0_14px_34px_rgba(0,0,0,0.05)] md:p-8"
            style={{ borderColor: currentTheme.border }}
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <span
                  className="inline-flex rounded-full px-3 py-1 text-xs font-semibold"
                  style={{
                    backgroundColor: currentTheme.soft,
                    color: currentTheme.accent,
                  }}
                >
                  {currentTheme.label}
                </span>
                <h2 className="mt-4 text-[2rem] font-semibold leading-tight tracking-[-0.04em]">
                  {currentDimension.name}
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-[#6B7280]">
                  {currentDimension.description ??
                    "Answer each question based on your current CX practices."}
                </p>
              </div>

              <div
                className="rounded-2xl px-4 py-3 text-sm font-semibold"
                style={{
                  backgroundColor: currentTheme.soft,
                  color: currentTheme.accent,
                }}
              >
                Step {currentDimensionIndex + 1} of {activeDimensions.length}
              </div>
            </div>
          </div>

          {currentSubdimensions.map((subdimension) => {
            const subdimensionQuestions = sortByOrder(
              visibleQuestions.filter(
                (question) => question.subdimension_id === subdimension.id
              )
            );

            if (subdimensionQuestions.length === 0) return null;

            return (
              <div
                key={subdimension.id}
                className="rounded-3xl border border-[#E5E7EB] bg-white p-5 shadow-[0_10px_28px_rgba(0,0,0,0.04)] md:p-6"
              >
                <div className="border-b border-[#E5E7EB] pb-4">
                  <h3 className="text-lg font-semibold">{subdimension.name}</h3>
                  <p className="mt-1 text-sm text-[#6B7280]">
                    {
                      subdimensionQuestions.filter((question) => question.is_mandatory)
                        .length
                    }{" "}
                    required /{" "}
                    {
                      subdimensionQuestions.filter((question) => !question.is_mandatory)
                        .length
                    }{" "}
                    optional
                  </p>
                </div>

                <div className="mt-5 grid gap-4">
                  {subdimensionQuestions.map((question, index) => {
                    const options = sortByOrder(
                      question.options.filter((option) => option.is_active)
                    );
                    const answer = answers[question.id];
                    const helperText = getVisibleHelperText(question.helper_text);

                    return (
                      <article
                        key={question.id}
                        className="rounded-2xl border border-[#E5E7EB] bg-[#FCFCFC] p-5"
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                            style={{
                              backgroundColor: currentTheme.soft,
                              color: currentTheme.accent,
                            }}
                          >
                            {index + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-semibold leading-7">
                              {question.question_text}
                              {question.is_mandatory ? (
                                <span className="ml-1 text-[#B42318]" aria-label="required">
                                  *
                                </span>
                              ) : null}
                            </h4>
                            {helperText ? (
                              <p className="mt-2 text-sm leading-6 text-[#6B7280]">
                                {helperText}
                              </p>
                            ) : null}

                            <div className="mt-4 grid gap-3">
                              {question.answer_type === "text_area" ? (
                                <textarea
                                  value={typeof answer === "string" ? answer : ""}
                                  onChange={(event) =>
                                    handleTextAnswer(
                                      question.id,
                                      event.target.value
                                    )
                                  }
                                  rows={4}
                                  className="w-full rounded-2xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#C5A04F] focus:shadow-[0_0_0_4px_rgba(197,160,79,0.10)]"
                                  placeholder="Add your context here..."
                                />
                              ) : (
                                options.map((option: AnswerOption) => {
                                  const isSelected = Array.isArray(answer)
                                    ? answer.includes(option.option_value)
                                    : answer === option.option_value;

                                  return (
                                    <button
                                      key={option.option_value}
                                      type="button"
                                      onClick={() =>
                                        question.answer_type === "multi_select"
                                          ? handleMultiSelect(
                                              question.id,
                                              option.option_value
                                            )
                                          : handleSingleSelect(
                                              question.id,
                                              option.option_value
                                            )
                                      }
                                      className="flex items-center justify-between gap-4 rounded-2xl border bg-white px-4 py-3 text-left text-sm transition hover:translate-y-[-1px]"
                                      style={{
                                        borderColor: isSelected
                                          ? currentTheme.accent
                                          : "#E5E7EB",
                                        boxShadow: isSelected
                                          ? `0 0 0 3px ${currentTheme.soft}`
                                          : "none",
                                      }}
                                    >
                                      <span className="font-medium text-[#1A1A1A]">
                                        {option.option_label}
                                      </span>
                                      {isSelected ? (
                                        <CheckCircle2
                                          className="h-5 w-5 shrink-0"
                                          style={{ color: currentTheme.accent }}
                                        />
                                      ) : (
                                        <span className="h-5 w-5 shrink-0 rounded-full border border-[#D1D5DB]" />
                                      )}
                                    </button>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
            <button
              type="button"
              onClick={() =>
                setCurrentDimensionIndex((prev) => Math.max(prev - 1, 0))
              }
              disabled={currentDimensionIndex === 0 || submitting}
              className="rounded-xl border border-[#E5E7EB] bg-white px-5 py-3 text-sm font-semibold text-[#1A1A1A] disabled:opacity-50"
            >
              Previous dimension
            </button>

            <button
              type="button"
              onClick={() =>
                currentDimensionIndex === activeDimensions.length - 1
                  ? handleSubmitAssessment()
                  : setCurrentDimensionIndex((prev) =>
                      Math.min(prev + 1, activeDimensions.length - 1)
                    )
              }
              disabled={submitting}
              className="rounded-xl bg-[#1A1A1A] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {submitting
                ? "Calculating..."
                : currentDimensionIndex === activeDimensions.length - 1
                  ? "Calculate score"
                  : "Next dimension"}
            </button>
          </div>
        </section>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-3xl border border-[#E5E7EB] bg-white p-6 shadow-[0_14px_34px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-4">
              <div
                className="flex h-24 w-24 items-center justify-center rounded-full"
                style={{
                  background: `conic-gradient(${currentTheme.accent} ${progress}%, #EEF2F7 0)`,
                }}
              >
                <div className="flex h-18 w-18 items-center justify-center rounded-full bg-white text-xl font-semibold">
                  {progress}%
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Trophy className="h-4 w-4 text-[#C5A04F]" />
                  Progress
                </div>
                <p className="mt-2 text-sm leading-6 text-[#6B7280]">
                  {answeredQuestions} of {totalQuestions} visible required questions
                  answered.{" "}
                  Optional questions are excluded from progress.
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl bg-[#FCFCFC] p-4">
              <p className="text-sm font-semibold text-[#1A1A1A]">
                {completedSteps} of {activeDimensions.length} steps completed
              </p>
              <div className="mt-4 grid gap-3">
                {dimensionProgress.map((item, index) => {
                  const theme = dimensionThemes[index % dimensionThemes.length];
                  const isActive = index === currentDimensionIndex;
                  const done = item.total > 0 && item.completed === item.total;

                  return (
                    <button
                      key={item.dimension.id}
                      type="button"
                      onClick={() => setCurrentDimensionIndex(index)}
                      className="flex items-center justify-between gap-3 rounded-2xl border bg-white px-3 py-3 text-left text-sm transition hover:bg-[#FAFAFA]"
                      style={{
                        borderColor: isActive ? theme.accent : "#E5E7EB",
                      }}
                    >
                      <span className="font-medium text-[#1A1A1A]">
                        {item.dimension.name}
                      </span>
                      <span
                        className="rounded-full px-2.5 py-1 text-xs font-semibold"
                        style={{
                          backgroundColor: done ? theme.soft : "#F3F4F6",
                          color: done ? theme.accent : "#6B7280",
                        }}
                      >
                        {item.completed}/{item.total}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}

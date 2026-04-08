import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import type { Dimension } from "@/features/dimensions/types/dimension.types";
import type { AnswerOption, AnswerType, DisplayRule, Question, QuestionPayload } from "@/features/questions/types/question.types";
import type { Sector } from "@/features/sectors/types/sector.types";
import type { Subdimension } from "@/features/subdimensions/types/subdimension.types";

type DefaultContext = {
  sectorId: number;
  subdimensionId: number;
} | null;

type Props = {
  isOpen: boolean;
  mode: "create" | "edit";
  initialQuestion: Question | null;
  defaultContext: DefaultContext;
  sectors: Sector[];
  dimensions: Dimension[];
  subdimensions: Subdimension[];
  questions: Question[];
  submitting: boolean;
  onClose: () => void;
  onSubmit: (payload: QuestionPayload) => Promise<void>;
};

type FormContentProps = Omit<Props, "isOpen">;

const standardOptions: AnswerOption[] = [
  "Not in place",
  "Ad hoc / informal",
  "Defined but inconsistent",
  "Managed consistently",
  "Optimized",
].map((label, index) => ({
  option_label: label,
  option_value: toOptionValue(label),
  score: index,
  maturity_level: index,
  display_order: index,
  is_active: true,
}));

function toOptionValue(label: string) {
  return (
    label
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || "option"
  );
}

function scoringStrategyFor(answerType: AnswerType, isScored: boolean) {
  if (!isScored || answerType === "text_area") return "none";
  if (answerType === "multi_select") return "multi_max";
  return "single_option_score";
}

function getInitialForm(
  mode: "create" | "edit",
  question: Question | null,
  defaultContext: DefaultContext,
  sectors: Sector[],
  subdimensions: Subdimension[]
): QuestionPayload {
  if (mode === "edit" && question) {
    return {
      sector_id: question.sector_id,
      subdimension_id: question.subdimension_id,
      question_text: question.question_text,
      helper_text: question.helper_text || "",
      answer_type: question.answer_type,
      is_mandatory: question.is_mandatory,
      is_scored: question.is_scored,
      scoring_strategy: question.scoring_strategy,
      weight: question.weight,
      display_order: question.display_order,
      is_active: question.is_active,
      options: question.options,
      display_rules: question.display_rules,
    };
  }

  return {
    sector_id: defaultContext?.sectorId ?? sectors[0]?.id ?? 0,
    subdimension_id: defaultContext?.subdimensionId ?? subdimensions[0]?.id ?? 0,
    question_text: "",
    helper_text: "",
    answer_type: "single_select",
    is_mandatory: true,
    is_scored: true,
    scoring_strategy: "single_option_score",
    weight: null,
    display_order: 0,
    is_active: true,
    options: standardOptions,
    display_rules: [],
  };
}

function QuestionFormContent({
  mode,
  initialQuestion,
  defaultContext,
  sectors,
  dimensions,
  subdimensions,
  questions,
  submitting,
  onClose,
  onSubmit,
}: FormContentProps) {
  const [form, setForm] = useState<QuestionPayload>(() =>
    getInitialForm(mode, initialQuestion, defaultContext, sectors, subdimensions)
  );

  const selectedSubdimension = subdimensions.find(
    (subdimension) => subdimension.id === form.subdimension_id
  );
  const selectedDimension = dimensions.find(
    (dimension) => dimension.id === selectedSubdimension?.dimension_id
  );
  const selectedSector = sectors.find((sector) => sector.id === form.sector_id);
  const selectedDimensionSubdimensionIds = subdimensions
    .filter(
      (subdimension) =>
        subdimension.dimension_id === selectedDimension?.id
    )
    .map((subdimension) => subdimension.id);
  const candidateRuleQuestions = questions.filter(
    (question) =>
      question.id !== initialQuestion?.id &&
      question.sector_id === form.sector_id &&
      selectedDimensionSubdimensionIds.includes(question.subdimension_id) &&
      question.is_scored
  );

  const maturityRuleSummary = useMemo(() => {
    const firstRule = form.display_rules[0];
    if (!firstRule) return "Always shown";
    if (firstRule.rule_group === "low") return "Shown for low maturity";
    if (firstRule.rule_group === "high") return "Shown for high maturity";
    return "Shown based on another answer";
  }, [form.display_rules]);

  const handleFieldChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    setForm((prev) => {
      const nextValue =
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : ["sector_id", "subdimension_id"].includes(name)
            ? Number(value)
            : name === "weight"
              ? value === ""
                ? null
                : Number(value)
              : value;
      const next = { ...prev, [name]: nextValue };

      if (name === "answer_type") {
        next.answer_type = value as AnswerType;
        next.is_scored = value === "text_area" ? false : next.is_scored;
        next.scoring_strategy = scoringStrategyFor(next.answer_type, next.is_scored);
        next.options = value === "text_area" ? [] : next.options.length ? next.options : standardOptions;
      }

      if (name === "is_scored") {
        next.is_scored = Boolean(nextValue);
        next.is_mandatory = next.is_scored ? true : next.is_mandatory;
        next.scoring_strategy = scoringStrategyFor(next.answer_type, next.is_scored);
      }

      return next;
    });
  };

  const updateOption = (
    index: number,
    field: keyof AnswerOption,
    value: string | number | boolean | null
  ) => {
    setForm((prev) => ({
      ...prev,
      options: prev.options.map((option, optionIndex) =>
        optionIndex === index ? { ...option, [field]: value } : option
      ),
    }));
  };

  const addOption = () => {
    setForm((prev) => ({
      ...prev,
      options: [
        ...prev.options,
        {
          option_label: "",
          option_value: "",
          score: prev.options.length,
          maturity_level: prev.options.length,
          display_order: prev.options.length,
          is_active: true,
        },
      ],
    }));
  };

  const setFollowUpMode = (mode: "always" | "low" | "high" | "answer") => {
    if (mode === "always") {
      setForm((prev) => ({ ...prev, display_rules: [] }));
      return;
    }

    const dependsOn = candidateRuleQuestions[0]?.id ?? 0;
    const rule: DisplayRule = {
      depends_on_question_id: dependsOn,
      operator: mode === "low" ? "score_lte" : "score_gte",
      expected_option_id: null,
      expected_value: null,
      min_score: mode === "high" ? 3 : mode === "answer" ? 2 : null,
      max_score: mode === "low" ? 1 : null,
      rule_group: mode,
      is_active: true,
    };
    setForm((prev) => ({ ...prev, display_rules: [rule] }));
  };

  const updateRule = (field: keyof DisplayRule, value: string | number | null) => {
    setForm((prev) => ({
      ...prev,
      display_rules: prev.display_rules.map((rule, index) =>
        index === 0 ? { ...rule, [field]: value } : rule
      ),
    }));
  };

  const firstRule = form.display_rules[0];
  const followUpMode = firstRule?.rule_group ?? "always";

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!e.currentTarget.checkValidity()) {
      e.currentTarget.reportValidity();
      return;
    }

    await onSubmit({
      ...form,
      helper_text: form.helper_text?.trim() || null,
      question_text: form.question_text.trim(),
      scoring_strategy: scoringStrategyFor(form.answer_type, form.is_scored),
      options:
        form.answer_type === "text_area"
          ? []
          : form.options.map((option, index) => ({
              option_label: option.option_label.trim(),
              option_value: option.option_value?.trim() || toOptionValue(option.option_label),
              score: form.is_scored ? option.score : null,
              maturity_level: option.maturity_level,
              display_order: index,
              is_active: option.is_active,
            })),
      display_rules: form.display_rules.filter(
        (rule) => rule.depends_on_question_id > 0
      ),
    });
  };

  return (
    <div className="w-full max-w-4xl rounded-3xl border border-[#E5E7EB] bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.12)] md:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#C5A04F]">
            {mode === "create" ? "Add question" : "Edit question"}
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-[#1A1A1A]">
            Configure the consultant-facing question
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm text-[#4B5563] hover:bg-[#FAFAFA]"
        >
          Close
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 grid max-h-[75vh] gap-6 overflow-y-auto pr-2">
        <section className="rounded-2xl border border-[#E5E7EB] bg-[#FCFCFC] p-4">
          <h3 className="font-semibold text-[#1A1A1A]">Context</h3>
          <p className="mt-2 text-sm text-[#6B7280]">
            {selectedSector?.name ?? "Select a sector"} / {selectedDimension?.name ?? "Select a dimension"} / {selectedSubdimension?.name ?? "Select a subdimension"}
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#C5A04F]">
                Sector
              </p>
              <p className="mt-1 text-sm font-medium text-[#1A1A1A]">
                {selectedSector?.name ?? "No sector selected"}
              </p>
            </div>
            <div className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#C5A04F]">
                Dimension
              </p>
              <p className="mt-1 text-sm font-medium text-[#1A1A1A]">
                {selectedDimension?.name ?? "No dimension selected"}
              </p>
            </div>
            <div className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#C5A04F]">
                Subdimension
              </p>
              <p className="mt-1 text-sm font-medium text-[#1A1A1A]">
                {selectedSubdimension?.name ?? "No subdimension selected"}
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4">
          <h3 className="font-semibold text-[#1A1A1A]">Question</h3>
          <textarea
            name="question_text"
            value={form.question_text}
            onChange={handleFieldChange}
            required
            rows={3}
            placeholder="Write the question as the assessment respondent will see it"
            className="rounded-xl border border-[#E5E7EB] bg-[#FCFCFC] px-4 py-3 text-sm"
          />
          <textarea
            name="helper_text"
            value={form.helper_text || ""}
            onChange={handleFieldChange}
            rows={2}
            placeholder="Optional help text or consultant clarification"
            className="rounded-xl border border-[#E5E7EB] bg-[#FCFCFC] px-4 py-3 text-sm"
          />
          <div className="grid gap-4 md:grid-cols-3">
            <select
              name="answer_type"
              value={form.answer_type}
              onChange={handleFieldChange}
              className="h-12 rounded-xl border border-[#E5E7EB] bg-[#FCFCFC] px-4 text-sm"
            >
              <option value="single_select">Single select</option>
              <option value="multi_select">Multi select</option>
              <option value="text_area">Optional text area</option>
            </select>
            <label className="flex items-center gap-3 rounded-xl border border-[#E5E7EB] bg-[#FCFCFC] px-4 text-sm">
              <input
                type="checkbox"
                name="is_mandatory"
                checked={form.is_mandatory}
                onChange={handleFieldChange}
                disabled={form.is_scored}
              />
              Required in assessment
            </label>
            <label className="flex items-center gap-3 rounded-xl border border-[#E5E7EB] bg-[#FCFCFC] px-4 text-sm">
              <input
                type="checkbox"
                name="is_scored"
                checked={form.is_scored}
                onChange={handleFieldChange}
                disabled={form.answer_type === "text_area"}
              />
              Included in score
            </label>
          </div>
        </section>

        {form.answer_type !== "text_area" ? (
          <section className="rounded-2xl border border-[#E5E7EB] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold text-[#1A1A1A]">Options and scores</h3>
                <p className="mt-1 text-sm text-[#6B7280]">
                  Scores are simple maturity points. Adjust them only when the option meaning requires it.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, options: standardOptions }))}
                  className="rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm"
                >
                  Apply standard 0-4 scale
                </button>
                <button
                  type="button"
                  onClick={addOption}
                  className="rounded-lg bg-[#1A1A1A] px-3 py-2 text-sm font-semibold text-white"
                >
                  Add option
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-3">
              {form.options.map((option, index) => (
                <div
                  key={index}
                  className="grid gap-3 rounded-xl bg-[#FCFCFC] p-3 md:grid-cols-[1fr_110px_auto]"
                >
                  <input
                    value={option.option_label}
                    onChange={(event) =>
                      updateOption(index, "option_label", event.target.value)
                    }
                    required
                    placeholder="Option label"
                    className="h-11 rounded-lg border border-[#E5E7EB] px-3 text-sm"
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={option.score ?? ""}
                    onChange={(event) =>
                      updateOption(index, "score", event.target.value === "" ? null : Number(event.target.value))
                    }
                    placeholder="Score"
                    className="h-11 rounded-lg border border-[#E5E7EB] px-3 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        options: prev.options.filter((_, optionIndex) => optionIndex !== index),
                      }))
                    }
                    className="rounded-lg border border-[#F3D6D6] px-3 py-2 text-sm text-[#B42318]"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            {form.answer_type === "multi_select" ? (
              <p className="mt-4 rounded-xl bg-[#FFF8CC] p-3 text-sm text-[#4B5563]">
                Multi-select scoring uses the highest selected option score to keep interpretation simple.
              </p>
            ) : null}
          </section>
        ) : (
          <div className="rounded-2xl border border-[#E5E7EB] bg-[#FCFCFC] p-4 text-sm text-[#6B7280]">
            Text area questions are qualitative and do not contribute to maturity scoring.
          </div>
        )}

        <section className="rounded-2xl border border-[#E5E7EB] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-[#1A1A1A]">Follow-up logic</h3>
              <p className="mt-1 text-sm text-[#6B7280]">{maturityRuleSummary}</p>
            </div>
            <select
              value={followUpMode}
              onChange={(event) =>
                setFollowUpMode(event.target.value as "always" | "low" | "high" | "answer")
              }
              className="h-11 rounded-xl border border-[#E5E7EB] bg-[#FCFCFC] px-4 text-sm"
            >
              <option value="always">Always show</option>
              <option value="low">Show if low maturity</option>
              <option value="high">Show if high maturity</option>
              <option value="answer">Based on another answer</option>
            </select>
          </div>

          {firstRule && followUpMode === "answer" ? (
            <div className="mt-4 grid gap-3 md:grid-cols-4">
              <select
                value={firstRule.depends_on_question_id || ""}
                onChange={(event) =>
                  updateRule("depends_on_question_id", Number(event.target.value))
                }
                className="h-11 rounded-lg border border-[#E5E7EB] px-3 text-sm"
              >
                <option value="" disabled>Reference question</option>
                {candidateRuleQuestions.map((question) => (
                  <option key={question.id} value={question.id}>
                    {question.question_text.slice(0, 80)}
                  </option>
                ))}
              </select>
              <select
                value={firstRule.operator}
                onChange={(event) => {
                  const operator = event.target.value;
                  updateRule("operator", operator);
                  if (operator === "score_gte") updateRule("max_score", null);
                  if (operator === "score_lte") updateRule("min_score", null);
                }}
                className="h-11 rounded-lg border border-[#E5E7EB] px-3 text-sm"
              >
                <option value="score_gte">Greater than or equal to</option>
                <option value="score_lte">Less than or equal to</option>
                <option value="score_between">Between</option>
              </select>
              {firstRule.operator !== "score_lte" ? (
                <input
                  type="number"
                  step="0.1"
                  value={firstRule.min_score ?? ""}
                  onChange={(event) =>
                    updateRule("min_score", event.target.value === "" ? null : Number(event.target.value))
                  }
                  placeholder="Minimum score"
                  className="h-11 rounded-lg border border-[#E5E7EB] px-3 text-sm"
                />
              ) : null}
              {firstRule.operator !== "score_gte" ? (
                <input
                  type="number"
                  step="0.1"
                  value={firstRule.max_score ?? ""}
                  onChange={(event) =>
                    updateRule("max_score", event.target.value === "" ? null : Number(event.target.value))
                  }
                  placeholder="Maximum score"
                  className="h-11 rounded-lg border border-[#E5E7EB] px-3 text-sm"
                />
              ) : null}
            </div>
          ) : firstRule && (followUpMode === "low" || followUpMode === "high") ? (
            <div className="mt-4 rounded-xl bg-[#FCFCFC] p-4 text-sm leading-6 text-[#6B7280]">
              This preset is handled automatically from the subdimension maturity result, so no reference question or score threshold is needed here.
            </div>
          ) : null}
        </section>

        <div className="flex justify-end gap-3 border-t border-[#E5E7EB] pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#E5E7EB] bg-white px-5 py-3 text-sm font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-[#1A1A1A] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {submitting ? "Saving..." : mode === "create" ? "Create question" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function QuestionFormModal({
  isOpen,
  mode,
  initialQuestion,
  defaultContext,
  sectors,
  dimensions,
  subdimensions,
  questions,
  submitting,
  onClose,
  onSubmit,
}: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/30 px-4 py-6">
      <QuestionFormContent
        key={`${mode}-${initialQuestion?.id ?? "new"}-${defaultContext?.sectorId ?? "none"}-${defaultContext?.subdimensionId ?? "none"}`}
        mode={mode}
        initialQuestion={initialQuestion}
        defaultContext={defaultContext}
        sectors={sectors}
        dimensions={dimensions}
        subdimensions={subdimensions}
        questions={questions}
        submitting={submitting}
        onClose={onClose}
        onSubmit={onSubmit}
      />
    </div>
  );
}

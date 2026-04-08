import { useEffect, useState } from "react";
import QuestionFormModal from "@/components/admin/questions/QuestionFormModal";
import QuestionTable from "@/components/admin/questions/QuestionTable";
import AdminLayout from "@/components/layout/AdminLayout";
import { getDimensions } from "@/features/dimensions/api/dimensionsApi";
import type { Dimension } from "@/features/dimensions/types/dimension.types";
import {
  createQuestion,
  deleteQuestion,
  getQuestions,
  updateQuestion,
} from "@/features/questions/api/questionsApi";
import type {
  Question,
  QuestionPayload,
} from "@/features/questions/types/question.types";
import { getSectors } from "@/features/sectors/api/sectorsApi";
import type { Sector } from "@/features/sectors/types/sector.types";
import { getSubdimensions } from "@/features/subdimensions/api/subdimensionsApi";
import type { Subdimension } from "@/features/subdimensions/types/subdimension.types";

export default function AdminQuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [dimensions, setDimensions] = useState<Dimension[]>([]);
  const [subdimensions, setSubdimensions] = useState<Subdimension[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [defaultContext, setDefaultContext] = useState<{
    sectorId: number;
    subdimensionId: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [questionData, sectorData, dimensionData, subdimensionData] = await Promise.all([
        getQuestions(),
        getSectors(),
        getDimensions(),
        getSubdimensions(),
      ]);
      setQuestions(questionData);
      setSectors(sectorData);
      setDimensions(dimensionData);
      setSubdimensions(subdimensionData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load questions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setModalMode("create");
    setSelectedQuestion(null);
    setDefaultContext(null);
    setIsModalOpen(true);
  };

  const openCreateModalForContext = (context: {
    sectorId: number;
    subdimensionId: number;
  }) => {
    setModalMode("create");
    setSelectedQuestion(null);
    setDefaultContext(context);
    setIsModalOpen(true);
  };

  const openEditModal = (question: Question) => {
    setModalMode("edit");
    setSelectedQuestion(question);
    setDefaultContext(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setIsModalOpen(false);
    setSelectedQuestion(null);
    setDefaultContext(null);
  };

  const handleSubmit = async (payload: QuestionPayload) => {
    setSubmitting(true);
    setError(null);

    try {
      if (modalMode === "create") {
        await createQuestion(payload);
      } else if (selectedQuestion) {
        await updateQuestion(selectedQuestion.id, payload);
      }

      setIsModalOpen(false);
      setSelectedQuestion(null);
      setDefaultContext(null);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (question: Question) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete this question?`
    );

    if (!confirmed) return;

    setError(null);

    try {
      await deleteQuestion(question.id);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const handleReorder = async (draggedId: number, targetId: number) => {
    const question = questions.find((item) => item.id === draggedId);
    const targetQuestion = questions.find((item) => item.id === targetId);

    if (
      !question ||
      !targetQuestion ||
      question.sector_id !== targetQuestion.sector_id ||
      question.subdimension_id !== targetQuestion.subdimension_id
    ) {
      return;
    }

    const groupQuestions = [...questions]
      .filter(
        (item) =>
          item.sector_id === question.sector_id &&
          item.subdimension_id === question.subdimension_id
      )
      .sort((a, b) => a.display_order - b.display_order || a.id - b.id);
    const currentIndex = groupQuestions.findIndex((item) => item.id === draggedId);
    const targetIndex = groupQuestions.findIndex((item) => item.id === targetId);

    if (currentIndex < 0 || targetIndex < 0 || currentIndex === targetIndex) {
      return;
    }

    const reordered = [...groupQuestions];
    const [moved] = reordered.splice(currentIndex, 1);
    reordered.splice(targetIndex, 0, moved);

    const changed = reordered.map((item, index) => ({
      ...item,
      display_order: index,
    }));
    const changedById = new Map(changed.map((item) => [item.id, item]));
    const previousQuestions = questions;

    try {
      setQuestions((prev) =>
        prev.map((item) => changedById.get(item.id) ?? item)
      );
      await Promise.all(
        changed.map((item) =>
          updateQuestion(item.id, {
            sector_id: item.sector_id,
            subdimension_id: item.subdimension_id,
            question_text: item.question_text,
            helper_text: item.helper_text,
            answer_type: item.answer_type,
            is_mandatory: item.is_mandatory,
            is_scored: item.is_scored,
            scoring_strategy: item.scoring_strategy,
            weight: item.weight,
            display_order: item.display_order,
            is_active: item.is_active,
            options: item.options,
            display_rules: item.display_rules,
          })
        )
      );
    } catch (err) {
      setQuestions(previousQuestions);
      setError(err instanceof Error ? err.message : "Reorder failed");
    }
  };

  return (
    <AdminLayout
      title="Question Management"
      description="Create, edit, and govern scored and conditional assessment questions."
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[#1A1A1A]">Questions</h2>
            <p className="mt-1 text-sm text-[#6B7280]">
              Browse by sector, dimension, and subdimension. Configure questions without technical fields.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            disabled={sectors.length === 0 || subdimensions.length === 0}
            className="inline-flex items-center justify-center rounded-xl bg-[#1A1A1A] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            Add question
          </button>
        </div>

        {error ? (
          <div className="rounded-2xl border border-[#F3D6D6] bg-[#FFF5F5] px-4 py-3 text-sm text-[#B42318]">
            {error}
          </div>
        ) : null}

        {!loading && (sectors.length === 0 || subdimensions.length === 0) ? (
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 text-sm text-[#6B7280]">
            Create at least one sector and one subdimension before adding questions.
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-8 text-sm text-[#6B7280]">
            Loading questions...
          </div>
        ) : (
          <QuestionTable
            questions={questions}
            sectors={sectors}
            dimensions={dimensions}
            subdimensions={subdimensions}
            onAdd={openCreateModalForContext}
            onEdit={openEditModal}
            onDelete={handleDelete}
            onReorder={handleReorder}
          />
        )}
      </div>

      <QuestionFormModal
        isOpen={isModalOpen}
        mode={modalMode}
        initialQuestion={selectedQuestion}
        defaultContext={defaultContext}
        sectors={sectors}
        dimensions={dimensions}
        subdimensions={subdimensions}
        questions={questions}
        submitting={submitting}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />
    </AdminLayout>
  );
}

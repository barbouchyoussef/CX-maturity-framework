import { useState, type DragEvent } from "react";
import { ChevronDown, ChevronRight, Plus } from "lucide-react";
import type { Dimension } from "@/features/dimensions/types/dimension.types";
import type { Question } from "@/features/questions/types/question.types";
import type { Sector } from "@/features/sectors/types/sector.types";
import type { Subdimension } from "@/features/subdimensions/types/subdimension.types";

type Context = {
  sectorId: number;
  subdimensionId: number;
};

type Props = {
  questions: Question[];
  sectors: Sector[];
  dimensions: Dimension[];
  subdimensions: Subdimension[];
  onAdd: (context: Context) => void;
  onEdit: (question: Question) => void;
  onDelete: (question: Question) => void;
  onReorder: (draggedId: number, targetId: number) => void;
};

function sortedQuestions(items: Question[]) {
  return [...items].sort(
    (a, b) => a.display_order - b.display_order || a.id - b.id
  );
}

export default function QuestionTable({
  questions,
  sectors,
  dimensions,
  subdimensions,
  onAdd,
  onEdit,
  onDelete,
  onReorder,
}: Props) {
  const [openSectors, setOpenSectors] = useState<Set<number>>(new Set());
  const [openDimensions, setOpenDimensions] = useState<Set<string>>(new Set());
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [dropTargetId, setDropTargetId] = useState<number | null>(null);

  const toggleSector = (sectorId: number) => {
    setOpenSectors((prev) => {
      const next = new Set(prev);
      if (next.has(sectorId)) next.delete(sectorId);
      else next.add(sectorId);
      return next;
    });
  };

  const toggleDimension = (sectorId: number, dimensionId: number) => {
    const key = `${sectorId}-${dimensionId}`;
    setOpenDimensions((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleDragStart = (
    event: DragEvent<HTMLDivElement>,
    questionId: number
  ) => {
    setDraggedId(questionId);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(questionId));
  };

  const handleDrop = (
    event: DragEvent<HTMLDivElement>,
    targetQuestion: Question
  ) => {
    event.preventDefault();

    const dataId = Number(event.dataTransfer.getData("text/plain"));
    const activeDraggedId = draggedId ?? dataId;

    setDropTargetId(null);
    setDraggedId(null);

    if (!activeDraggedId || activeDraggedId === targetQuestion.id) return;
    onReorder(activeDraggedId, targetQuestion.id);
  };

  if (sectors.length === 0 || dimensions.length === 0 || subdimensions.length === 0) {
    return (
      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-8 text-center text-sm text-[#6B7280]">
        Create at least one sector, dimension, and subdimension before adding questions.
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      {sectors.map((sector) => {
        const sectorQuestionCount = questions.filter(
          (question) => question.sector_id === sector.id
        ).length;
        const isSectorOpen = openSectors.has(sector.id);

        return (
          <section
            key={sector.id}
            className="rounded-3xl border border-[#E5E7EB] bg-white shadow-[0_10px_28px_rgba(0,0,0,0.04)]"
          >
            <button
              type="button"
              onClick={() => toggleSector(sector.id)}
              className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left"
            >
              <div className="flex min-w-0 items-center gap-3">
                {isSectorOpen ? (
                  <ChevronDown className="h-5 w-5 shrink-0 text-[#6B7280]" />
                ) : (
                  <ChevronRight className="h-5 w-5 shrink-0 text-[#6B7280]" />
                )}
                <div>
                  <h3 className="text-lg font-semibold text-[#1A1A1A]">
                    {sector.name}
                  </h3>
                  <p className="mt-1 text-sm text-[#6B7280]">
                    {sectorQuestionCount} configured question
                    {sectorQuestionCount === 1 ? "" : "s"}
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-[#FFF8CC] px-3 py-1 text-xs font-semibold text-[#1A1A1A]">
                {sector.code}
              </span>
            </button>

            {isSectorOpen ? (
              <div className="grid gap-4 border-t border-[#E5E7EB] bg-[#FAFAFA] p-4">
                {dimensions.map((dimension) => {
                  const dimensionKey = `${sector.id}-${dimension.id}`;
                  const dimensionSubdimensions = subdimensions
                    .filter((subdimension) => subdimension.dimension_id === dimension.id)
                    .sort((a, b) => a.display_order - b.display_order || a.id - b.id);
                  const isDimensionOpen = openDimensions.has(dimensionKey);
                  const dimensionQuestionCount = dimensionSubdimensions.reduce(
                    (total, subdimension) =>
                      total +
                      questions.filter(
                        (question) =>
                          question.sector_id === sector.id &&
                          question.subdimension_id === subdimension.id
                      ).length,
                    0
                  );

                  return (
                    <section
                      key={dimensionKey}
                      className="rounded-2xl border border-[#E5E7EB] bg-white"
                    >
                      <button
                        type="button"
                        onClick={() => toggleDimension(sector.id, dimension.id)}
                        className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left"
                      >
                        <div className="flex items-center gap-3">
                          {isDimensionOpen ? (
                            <ChevronDown className="h-4 w-4 text-[#6B7280]" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-[#6B7280]" />
                          )}
                          <div>
                            <h4 className="font-semibold text-[#1A1A1A]">
                              {dimension.name}
                            </h4>
                            <p className="mt-1 text-xs text-[#6B7280]">
                              {dimensionQuestionCount} question
                              {dimensionQuestionCount === 1 ? "" : "s"}
                            </p>
                          </div>
                        </div>
                        <span className="rounded-full border border-[#E5E7EB] px-3 py-1 text-xs text-[#6B7280]">
                          {dimension.code}
                        </span>
                      </button>

                      {isDimensionOpen ? (
                        <div className="grid gap-3 border-t border-[#E5E7EB] p-4">
                          {dimensionSubdimensions.map((subdimension) => {
                            const subdimensionQuestions = sortedQuestions(
                              questions.filter(
                                (question) =>
                                  question.sector_id === sector.id &&
                                  question.subdimension_id === subdimension.id
                              )
                            );

                            return (
                              <div
                                key={`${sector.id}-${subdimension.id}`}
                                className="rounded-2xl border border-[#E5E7EB] bg-[#FCFCFC] p-4"
                              >
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                  <div>
                                    <h5 className="font-semibold text-[#1A1A1A]">
                                      {subdimension.name}
                                    </h5>
                                    <p className="mt-1 text-xs text-[#6B7280]">
                                      {subdimensionQuestions.length} question
                                      {subdimensionQuestions.length === 1 ? "" : "s"}
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onAdd({
                                        sectorId: sector.id,
                                        subdimensionId: subdimension.id,
                                      })
                                    }
                                    className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#1A1A1A] text-white transition hover:translate-y-[-1px] hover:shadow-[0_10px_24px_rgba(0,0,0,0.12)]"
                                    aria-label={`Add question to ${subdimension.name}`}
                                    title={`Add question to ${subdimension.name}`}
                                  >
                                    <Plus className="h-4 w-4" />
                                  </button>
                                </div>

                                <div className="mt-4 grid gap-3">
                                  {subdimensionQuestions.length === 0 ? (
                                    <div className="rounded-xl border border-dashed border-[#D1D5DB] bg-white p-4 text-sm text-[#6B7280]">
                                      No questions yet. Add the first question for this subdimension.
                                    </div>
                                  ) : (
                                    subdimensionQuestions.map((question, index) => (
                                      <div
                                        key={question.id}
                                        draggable
                                        onDragStart={(event) =>
                                          handleDragStart(event, question.id)
                                        }
                                        onDragEnd={() => {
                                          setDraggedId(null);
                                          setDropTargetId(null);
                                        }}
                                        onDragOver={(event) => {
                                          event.preventDefault();
                                          setDropTargetId(question.id);
                                        }}
                                        onDragLeave={() => setDropTargetId(null)}
                                        onDrop={(event) => handleDrop(event, question)}
                                        className={`rounded-xl border bg-white p-4 transition ${
                                          dropTargetId === question.id
                                            ? "border-[#C5A04F] shadow-[inset_0_3px_0_#C5A04F]"
                                            : "border-[#E5E7EB]"
                                        } ${
                                          draggedId === question.id
                                            ? "cursor-grabbing opacity-50"
                                            : "cursor-grab"
                                        }`}
                                      >
                                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                          <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FAFAFA] text-xs font-semibold text-[#4B5563]">
                                                {index + 1}
                                              </span>
                                              <h6 className="font-semibold text-[#1A1A1A]">
                                                {question.question_text}
                                              </h6>
                                            </div>
                                            <div className="mt-3 flex flex-wrap gap-2">
                                              <span className="rounded-full bg-[#FFF8CC] px-3 py-1 text-xs font-medium text-[#1A1A1A]">
                                                {question.answer_type
                                                  .replace("_", " ")
                                                  .replace(/\b\w/g, (letter) =>
                                                    letter.toUpperCase()
                                                  )}
                                              </span>
                                              <span className="rounded-full bg-[#F3F4F6] px-3 py-1 text-xs font-medium text-[#4B5563]">
                                                {question.is_mandatory
                                                  ? "Required"
                                                  : "Optional"}
                                              </span>
                                              <span
                                                className={`rounded-full px-3 py-1 text-xs font-medium ${
                                                  question.is_scored
                                                    ? "bg-[#F0F9F2] text-[#2D7A3A]"
                                                    : "bg-[#F3F4F6] text-[#6B7280]"
                                                }`}
                                              >
                                                {question.is_scored
                                                  ? "Included in score"
                                                  : "Not scored"}
                                              </span>
                                              <span className="rounded-full bg-[#FCFCFC] px-3 py-1 text-xs font-medium text-[#6B7280] ring-1 ring-[#E5E7EB]">
                                                {question.options.length} answer option
                                                {question.options.length === 1
                                                  ? ""
                                                  : "s"}
                                              </span>
                                            </div>
                                            <p className="hidden">
                                              {question.answer_type.replace("_", " ")} ·{" "}
                                              {question.is_mandatory ? "Mandatory" : "Optional"} ·{" "}
                                              {question.is_scored ? "Scored" : "Not scored"} ·{" "}
                                              {question.options.length} option
                                              {question.options.length === 1 ? "" : "s"}
                                            </p>
                                          </div>

                                          <div className="flex flex-wrap justify-end gap-2">
                                            <button
                                              type="button"
                                              onClick={() => onEdit(question)}
                                              className="rounded-lg border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-medium"
                                            >
                                              Edit
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => onDelete(question)}
                                              className="rounded-lg border border-[#F3D6D6] bg-white px-4 py-2 text-sm font-medium text-[#B42318]"
                                            >
                                              Delete
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    ))
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : null}
                    </section>
                  );
                })}
              </div>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}

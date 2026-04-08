import { useState, type DragEvent } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { Dimension } from "@/features/dimensions/types/dimension.types";
import type { Subdimension } from "@/features/subdimensions/types/subdimension.types";

type ReorderRequest = {
  draggedId: number;
  targetDimensionId: number;
  targetId: number | null;
};

type Props = {
  subdimensions: Subdimension[];
  dimensions: Dimension[];
  reordering: boolean;
  onAdd: (dimensionId: number) => void;
  onEdit: (subdimension: Subdimension) => void;
  onDelete: (subdimension: Subdimension) => void;
  onReorder: (request: ReorderRequest) => Promise<void>;
};

function sortByOrder(items: Subdimension[]) {
  return [...items].sort(
    (a, b) => a.display_order - b.display_order || a.id - b.id
  );
}

export default function SubdimensionTable({
  subdimensions,
  dimensions,
  reordering,
  onAdd,
  onEdit,
  onDelete,
  onReorder,
}: Props) {
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [collapsedDimensionIds, setCollapsedDimensionIds] = useState<
    Set<number>
  >(new Set());
  const groupedSubdimensions = new Map<number, Subdimension[]>();

  for (const subdimension of subdimensions) {
    const existing = groupedSubdimensions.get(subdimension.dimension_id) ?? [];
    groupedSubdimensions.set(subdimension.dimension_id, [
      ...existing,
      subdimension,
    ]);
  }

  const handleDragStart = (
    event: DragEvent<HTMLDivElement>,
    subdimension: Subdimension
  ) => {
    setDraggedId(subdimension.id);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(subdimension.id));
  };

  const handleDrop = async (
    event: DragEvent<HTMLElement>,
    targetDimensionId: number,
    targetId: number | null
  ) => {
    event.preventDefault();

    const dataId = Number(event.dataTransfer.getData("text/plain"));
    const activeDraggedId = draggedId ?? dataId;

    if (!activeDraggedId || activeDraggedId === targetId) {
      setDraggedId(null);
      return;
    }

    await onReorder({
      draggedId: activeDraggedId,
      targetDimensionId,
      targetId,
    });
    setDraggedId(null);
  };

  const toggleDimension = (dimensionId: number) => {
    setCollapsedDimensionIds((prev) => {
      const next = new Set(prev);

      if (next.has(dimensionId)) {
        next.delete(dimensionId);
      } else {
        next.add(dimensionId);
      }

      return next;
    });
  };

  if (dimensions.length === 0) {
    return (
      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-8 text-center text-sm text-[#6B7280]">
        Create at least one dimension before adding subdimensions.
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      {dimensions.map((dimension) => {
        const dimensionSubdimensions = sortByOrder(
          groupedSubdimensions.get(dimension.id) ?? []
        );
        const isCollapsed = collapsedDimensionIds.has(dimension.id);

        return (
          <section
            key={dimension.id}
            className="rounded-3xl border border-[#E5E7EB] bg-white p-5 shadow-[0_10px_28px_rgba(0,0,0,0.04)]"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => handleDrop(event, dimension.id, null)}
          >
            <div
              className={`flex flex-col gap-3 md:flex-row md:items-center md:justify-between ${
                isCollapsed ? "" : "border-b border-[#E5E7EB] pb-4"
              }`}
            >
              <button
                type="button"
                onClick={() => toggleDimension(dimension.id)}
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
                aria-expanded={!isCollapsed}
                aria-label={`${isCollapsed ? "Show" : "Hide"} ${dimension.name} subdimensions`}
              >
                {isCollapsed ? (
                  <ChevronRight className="h-4 w-4 shrink-0 text-[#6B7280]" />
                ) : (
                  <ChevronDown className="h-4 w-4 shrink-0 text-[#6B7280]" />
                )}

                <div className="min-w-0">
                  <h3 className="truncate text-base font-semibold text-[#1A1A1A]">
                    {dimension.name}
                  </h3>
                  <p className="mt-1 text-xs text-[#6B7280]">
                    {dimensionSubdimensions.length} subdimension
                    {dimensionSubdimensions.length === 1 ? "" : "s"}
                  </p>
                </div>
              </button>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => onAdd(dimension.id)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#1A1A1A] text-lg font-semibold leading-none text-white transition hover:translate-y-[-1px] hover:shadow-[0_10px_24px_rgba(0,0,0,0.12)]"
                  aria-label={`Add subdimension to ${dimension.name}`}
                  title={`Add subdimension to ${dimension.name}`}
                >
                  +
                </button>
              </div>
            </div>

            {!isCollapsed ? (
            <div className="mt-5 grid gap-3">
              {dimensionSubdimensions.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#D1D5DB] bg-[#FCFCFC] p-5 text-sm text-[#6B7280]">
                  No subdimensions in this dimension yet. Drop an item here or add a new subdimension.
                </div>
              ) : (
                dimensionSubdimensions.map((subdimension, index) => (
                  <div
                    key={subdimension.id}
                    draggable={!reordering}
                    onDragStart={(event) =>
                      handleDragStart(event, subdimension)
                    }
                    onDragEnd={() => setDraggedId(null)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) =>
                      handleDrop(event, dimension.id, subdimension.id)
                    }
                    className={`rounded-2xl border border-[#E5E7EB] bg-[#FCFCFC] p-4 transition ${
                      draggedId === subdimension.id
                        ? "opacity-50"
                        : "hover:border-[#C5A04F] hover:bg-white"
                    } ${reordering ? "cursor-wait" : "cursor-grab active:cursor-grabbing"}`}
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E5E7EB] bg-white text-xs font-semibold text-[#4B5563]">
                            {index + 1}
                          </span>
                          <h4 className="text-sm font-semibold text-[#1A1A1A]">
                            {subdimension.name}
                          </h4>
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                              subdimension.is_active
                                ? "bg-[#F0F9F2] text-[#2D7A3A]"
                                : "bg-[#F3F4F6] text-[#6B7280]"
                            }`}
                          >
                            {subdimension.is_active ? "Active" : "Inactive"}
                          </span>
                        </div>
                        <p className="mt-2 text-xs text-[#6B7280]">
                          Weight {subdimension.weight}
                        </p>
                      </div>

                      <div className="flex flex-wrap justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onEdit(subdimension)}
                          className="rounded-lg border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-medium text-[#1A1A1A] transition hover:bg-[#FAFAFA]"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(subdimension)}
                          className="rounded-lg border border-[#F3D6D6] bg-white px-4 py-2 text-sm font-medium text-[#B42318] transition hover:bg-[#FFF5F5]"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}

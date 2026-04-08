import { useState, type DragEvent } from "react";
import type { Dimension } from "@/features/dimensions/types/dimension.types";

type Props = {
  dimensions: Dimension[];
  onEdit: (dimension: Dimension) => void;
  onDelete: (dimension: Dimension) => void;
  onReorder: (draggedId: number, targetId: number) => void;
};

export default function DimensionTable({
  dimensions,
  onEdit,
  onDelete,
  onReorder,
}: Props) {
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [dropTargetId, setDropTargetId] = useState<number | null>(null);

  const handleDragStart = (
    event: DragEvent<HTMLTableRowElement>,
    dimensionId: number
  ) => {
    setDraggedId(dimensionId);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(dimensionId));
  };

  const handleDrop = (
    event: DragEvent<HTMLTableRowElement>,
    targetDimensionId: number
  ) => {
    event.preventDefault();
    const dataId = Number(event.dataTransfer.getData("text/plain"));
    const activeDraggedId = draggedId ?? dataId;
    setDraggedId(null);
    setDropTargetId(null);
    if (!activeDraggedId || activeDraggedId === targetDimensionId) return;
    onReorder(activeDraggedId, targetDimensionId);
  };

  if (dimensions.length === 0) {
    return (
      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-8 text-center text-sm text-[#6B7280]">
        No dimensions found.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead className="bg-[#FCFCFC]">
            <tr className="border-b border-[#E5E7EB]">
              {["ID", "Dimension", "Code", "Weight", "Status"].map(
                (heading) => (
                  <th
                    key={heading}
                    className="px-5 py-4 text-left text-sm font-semibold text-[#1A1A1A]"
                  >
                    {heading}
                  </th>
                )
              )}
              <th className="px-5 py-4 text-right text-sm font-semibold text-[#1A1A1A]">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {[...dimensions]
              .sort((a, b) => a.display_order - b.display_order || a.id - b.id)
              .map((dimension) => (
              <tr
                key={dimension.id}
                draggable
                onDragStart={(event) => handleDragStart(event, dimension.id)}
                onDragEnd={() => {
                  setDraggedId(null);
                  setDropTargetId(null);
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDropTargetId(dimension.id);
                }}
                onDragLeave={() => setDropTargetId(null)}
                onDrop={(event) => handleDrop(event, dimension.id)}
                className={`cursor-grab border-b border-[#E5E7EB] transition last:border-b-0 ${
                  dropTargetId === dimension.id ? "bg-[#FFF8CC]" : ""
                } ${draggedId === dimension.id ? "opacity-50" : ""}`}
              >
                <td className="px-5 py-4 text-sm text-[#4B5563]">
                  {dimension.id}
                </td>
                <td className="px-5 py-4 text-sm font-medium text-[#1A1A1A]">
                  {dimension.name}
                </td>
                <td className="px-5 py-4 text-sm text-[#4B5563]">
                  {dimension.code}
                </td>
                <td className="px-5 py-4 text-sm text-[#4B5563]">
                  {dimension.weight}
                </td>
                <td className="px-5 py-4 text-sm">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                      dimension.is_active
                        ? "bg-[#F0F9F2] text-[#2D7A3A]"
                        : "bg-[#F3F4F6] text-[#6B7280]"
                    }`}
                  >
                    {dimension.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => onEdit(dimension)}
                      className="rounded-lg border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-medium text-[#1A1A1A] transition hover:bg-[#FAFAFA]"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(dimension)}
                      className="rounded-lg border border-[#F3D6D6] bg-white px-4 py-2 text-sm font-medium text-[#B42318] transition hover:bg-[#FFF5F5]"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

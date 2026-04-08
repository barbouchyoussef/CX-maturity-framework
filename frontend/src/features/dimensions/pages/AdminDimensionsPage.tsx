import { useEffect, useState } from "react";
import DimensionFormModal from "@/components/admin/dimensions/DimensionFormModal";
import DimensionTable from "@/components/admin/dimensions/DimensionTable";
import AdminLayout from "@/components/layout/AdminLayout";
import {
  createDimension,
  deleteDimension,
  getDimensions,
  updateDimension,
} from "@/features/dimensions/api/dimensionsApi";
import type {
  Dimension,
  DimensionPayload,
} from "@/features/dimensions/types/dimension.types";

export default function AdminDimensionsPage() {
  const [dimensions, setDimensions] = useState<Dimension[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedDimension, setSelectedDimension] = useState<Dimension | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const dimensionData = await getDimensions();
      setDimensions(dimensionData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dimensions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setModalMode("create");
    setSelectedDimension(null);
    setIsModalOpen(true);
  };

  const openEditModal = (dimension: Dimension) => {
    setModalMode("edit");
    setSelectedDimension(dimension);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setIsModalOpen(false);
    setSelectedDimension(null);
  };

  const handleSubmit = async (payload: DimensionPayload) => {
    setSubmitting(true);
    setError(null);

    try {
      if (modalMode === "create") {
        await createDimension(payload);
      } else if (selectedDimension) {
        await updateDimension(selectedDimension.id, payload);
      }

      setIsModalOpen(false);
      setSelectedDimension(null);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (dimension: Dimension) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${dimension.name}"?`
    );

    if (!confirmed) return;

    setError(null);

    try {
      await deleteDimension(dimension.id);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const handleReorder = async (draggedId: number, targetId: number) => {
    const orderedDimensions = [...dimensions].sort(
      (a, b) => a.display_order - b.display_order || a.id - b.id
    );
    const currentIndex = orderedDimensions.findIndex((item) => item.id === draggedId);
    const targetIndex = orderedDimensions.findIndex((item) => item.id === targetId);

    if (currentIndex < 0 || targetIndex < 0 || currentIndex === targetIndex) return;

    const reordered = [...orderedDimensions];
    const [moved] = reordered.splice(currentIndex, 1);
    reordered.splice(targetIndex, 0, moved);

    const reorderedWithOrder = reordered.map((item, index) => ({
      ...item,
      display_order: index,
    }));
    const changed = reorderedWithOrder.filter((item) => {
      const previous = dimensions.find((dimension) => dimension.id === item.id);
      return previous?.display_order !== item.display_order;
    });
    const previousDimensions = dimensions;

    if (changed.length === 0) return;

    try {
      setDimensions(reorderedWithOrder);
      await Promise.all(
        changed.map((item) =>
          updateDimension(item.id, {
            name: item.name,
            code: item.code,
            description: item.description,
            weight: item.weight,
            display_order: item.display_order,
            is_active: item.is_active,
          })
        )
      );
    } catch (err) {
      setDimensions(previousDimensions);
      setError(err instanceof Error ? err.message : "Reorder failed");
    }
  };

  return (
    <AdminLayout
      title="Dimension Management"
      description="Create, edit, and organize assessment dimensions."
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[#1A1A1A]">
              Dimensions
            </h2>
            <p className="mt-1 text-sm text-[#6B7280]">
              Manage the core dimensions used in the CX maturity framework.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center rounded-xl bg-[#1A1A1A] px-5 py-3 text-sm font-semibold text-white"
          >
            Add dimension
          </button>
        </div>

        {error ? (
          <div className="rounded-2xl border border-[#F3D6D6] bg-[#FFF5F5] px-4 py-3 text-sm text-[#B42318]">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-8 text-sm text-[#6B7280]">
            Loading dimensions...
          </div>
        ) : (
          <DimensionTable
            dimensions={dimensions}
            onEdit={openEditModal}
            onDelete={handleDelete}
            onReorder={handleReorder}
          />
        )}
      </div>

      <DimensionFormModal
        isOpen={isModalOpen}
        mode={modalMode}
        initialDimension={selectedDimension}
        submitting={submitting}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />
    </AdminLayout>
  );
}

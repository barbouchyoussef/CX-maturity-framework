import { useEffect, useState } from "react";
import SubdimensionFormModal from "@/components/admin/subdimensions/SubdimensionFormModal";
import SubdimensionTable from "@/components/admin/subdimensions/SubdimensionTable";
import AdminLayout from "@/components/layout/AdminLayout";
import { getDimensions } from "@/features/dimensions/api/dimensionsApi";
import type { Dimension } from "@/features/dimensions/types/dimension.types";
import {
  createSubdimension,
  deleteSubdimension,
  getSubdimensions,
  updateSubdimension,
} from "@/features/subdimensions/api/subdimensionsApi";
import type {
  Subdimension,
  SubdimensionPayload,
} from "@/features/subdimensions/types/subdimension.types";

export default function AdminSubdimensionsPage() {
  const [subdimensions, setSubdimensions] = useState<Subdimension[]>([]);
  const [dimensions, setDimensions] = useState<Dimension[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedSubdimension, setSelectedSubdimension] =
    useState<Subdimension | null>(null);
  const [defaultDimensionId, setDefaultDimensionId] = useState<number | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [subdimensionData, dimensionData] = await Promise.all([
        getSubdimensions(),
        getDimensions(),
      ]);
      setSubdimensions(subdimensionData);
      setDimensions(dimensionData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load subdimensions"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setModalMode("create");
    setSelectedSubdimension(null);
    setDefaultDimensionId(null);
    setIsModalOpen(true);
  };

  const openCreateModalForDimension = (dimensionId: number) => {
    setModalMode("create");
    setSelectedSubdimension(null);
    setDefaultDimensionId(dimensionId);
    setIsModalOpen(true);
  };

  const openEditModal = (subdimension: Subdimension) => {
    setModalMode("edit");
    setSelectedSubdimension(subdimension);
    setDefaultDimensionId(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setIsModalOpen(false);
    setSelectedSubdimension(null);
    setDefaultDimensionId(null);
  };

  const handleSubmit = async (payload: SubdimensionPayload) => {
    setSubmitting(true);
    setError(null);

    try {
      if (modalMode === "create") {
        await createSubdimension(payload);
      } else if (selectedSubdimension) {
        await updateSubdimension(selectedSubdimension.id, payload);
      }

      setIsModalOpen(false);
      setSelectedSubdimension(null);
      setDefaultDimensionId(null);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (subdimension: Subdimension) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${subdimension.name}"?`
    );

    if (!confirmed) return;

    setError(null);

    try {
      await deleteSubdimension(subdimension.id);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const handleReorder = async ({
    draggedId,
    targetDimensionId,
    targetId,
  }: {
    draggedId: number;
    targetDimensionId: number;
    targetId: number | null;
  }) => {
    const dragged = subdimensions.find((item) => item.id === draggedId);
    if (!dragged) return;

    const previousSubdimensions = subdimensions;
    const sourceDimensionId = dragged.dimension_id;
    const withoutDragged = subdimensions.filter((item) => item.id !== draggedId);
    const targetGroup = withoutDragged
      .filter((item) => item.dimension_id === targetDimensionId)
      .sort((a, b) => a.display_order - b.display_order || a.id - b.id);
    const insertIndex =
      targetId === null
        ? targetGroup.length
        : targetGroup.findIndex((item) => item.id === targetId);

    const nextTargetGroup = [...targetGroup];
    nextTargetGroup.splice(Math.max(insertIndex, 0), 0, {
      ...dragged,
      dimension_id: targetDimensionId,
    });

    const affectedDimensionIds = new Set([sourceDimensionId, targetDimensionId]);
    const nextSubdimensions = withoutDragged.map((item) => ({ ...item }));

    const replaceOrderedGroup = (dimensionId: number, group: Subdimension[]) => {
      for (const item of group) {
        const existingIndex = nextSubdimensions.findIndex(
          (candidate) => candidate.id === item.id
        );
        const nextItem = {
          ...item,
          dimension_id: dimensionId,
          display_order: group.indexOf(item),
        };

        if (existingIndex >= 0) {
          nextSubdimensions[existingIndex] = nextItem;
        } else {
          nextSubdimensions.push(nextItem);
        }
      }
    };

    for (const dimensionId of affectedDimensionIds) {
      if (dimensionId === targetDimensionId) {
        replaceOrderedGroup(dimensionId, nextTargetGroup);
      } else {
        const sourceGroup = withoutDragged
          .filter((item) => item.dimension_id === dimensionId)
          .sort((a, b) => a.display_order - b.display_order || a.id - b.id);
        replaceOrderedGroup(dimensionId, sourceGroup);
      }
    }

    const changedSubdimensions = nextSubdimensions.filter((nextItem) => {
      const previousItem = previousSubdimensions.find(
        (item) => item.id === nextItem.id
      );
      return (
        previousItem &&
        (previousItem.dimension_id !== nextItem.dimension_id ||
          previousItem.display_order !== nextItem.display_order)
      );
    });

    if (changedSubdimensions.length === 0) return;

    setSubdimensions(nextSubdimensions);
    setReordering(true);
    setError(null);

    try {
      await Promise.all(
        changedSubdimensions.map((item) =>
          updateSubdimension(item.id, {
            dimension_id: item.dimension_id,
            name: item.name,
            code: item.code,
            description: item.description,
            weight: item.weight,
            display_order: item.display_order,
            is_active: item.is_active,
          })
        )
      );
      await loadData();
    } catch (err) {
      setSubdimensions(previousSubdimensions);
      setError(err instanceof Error ? err.message : "Reorder failed");
    } finally {
      setReordering(false);
    }
  };

  return (
    <AdminLayout
      title="Subdimension Management"
      description="Create, edit, and organize subdimensions under assessment dimensions."
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[#1A1A1A]">
              Subdimensions
            </h2>
            <p className="mt-1 text-sm text-[#6B7280]">
              Manage the detailed capabilities scored under each dimension.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            disabled={dimensions.length === 0}
            className="inline-flex items-center justify-center rounded-xl bg-[#1A1A1A] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            Add subdimension
          </button>
        </div>

        {error ? (
          <div className="rounded-2xl border border-[#F3D6D6] bg-[#FFF5F5] px-4 py-3 text-sm text-[#B42318]">
            {error}
          </div>
        ) : null}

        {!loading && dimensions.length === 0 ? (
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 text-sm text-[#6B7280]">
            Create at least one dimension before adding subdimensions.
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-8 text-sm text-[#6B7280]">
            Loading subdimensions...
          </div>
        ) : (
          <SubdimensionTable
            subdimensions={subdimensions}
            dimensions={dimensions}
            reordering={reordering}
            onAdd={openCreateModalForDimension}
            onEdit={openEditModal}
            onDelete={handleDelete}
            onReorder={handleReorder}
          />
        )}
      </div>

      <SubdimensionFormModal
        isOpen={isModalOpen}
        mode={modalMode}
        initialSubdimension={selectedSubdimension}
        dimensions={dimensions}
        defaultDimensionId={defaultDimensionId}
        submitting={submitting}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />
    </AdminLayout>
  );
}

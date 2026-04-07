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
import { getSectors } from "@/features/sectors/api/sectorsApi";
import type { Sector } from "@/features/sectors/types/sector.types";

export default function AdminDimensionsPage() {
  const [dimensions, setDimensions] = useState<Dimension[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
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
      const [dimensionData, sectorData] = await Promise.all([
        getDimensions(),
        getSectors(),
      ]);
      setDimensions(dimensionData);
      setSectors(sectorData);
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

  return (
    <AdminLayout
      title="Dimension Management"
      description="Create, edit, and organize assessment dimensions by sector."
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[#1A1A1A]">
              Dimensions
            </h2>
            <p className="mt-1 text-sm text-[#6B7280]">
              Manage dimensions linked to each sector in the CX maturity framework.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            disabled={sectors.length === 0}
            className="inline-flex items-center justify-center rounded-xl bg-[#1A1A1A] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            Add dimension
          </button>
        </div>

        {error ? (
          <div className="rounded-2xl border border-[#F3D6D6] bg-[#FFF5F5] px-4 py-3 text-sm text-[#B42318]">
            {error}
          </div>
        ) : null}

        {!loading && sectors.length === 0 ? (
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 text-sm text-[#6B7280]">
            Create at least one sector before adding dimensions.
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-8 text-sm text-[#6B7280]">
            Loading dimensions...
          </div>
        ) : (
          <DimensionTable
            dimensions={dimensions}
            sectors={sectors}
            onEdit={openEditModal}
            onDelete={handleDelete}
          />
        )}
      </div>

      <DimensionFormModal
        isOpen={isModalOpen}
        mode={modalMode}
        initialDimension={selectedDimension}
        sectors={sectors}
        submitting={submitting}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />
    </AdminLayout>
  );
}

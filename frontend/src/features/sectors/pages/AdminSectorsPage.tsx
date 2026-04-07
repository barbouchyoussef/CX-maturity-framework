import { useEffect, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import SectorTable from "@/components/admin/sectors/SectorTable";
import SectorFormModal from "@/components/admin/sectors/SectorFormModal";
import {
  getSectors,
  createSector,
  updateSector,
  deleteSector,
} from "@/features/sectors/api/sectorsApi";
import type { Sector, SectorPayload } from "@/features/sectors/types/sector.types";

export default function AdminSectorsPage() {
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedSector, setSelectedSector] = useState<Sector | null>(null);

  const [error, setError] = useState<string | null>(null);

  const loadSectors = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getSectors();
      setSectors(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load sectors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSectors();
  }, []);

  const openCreateModal = () => {
    setModalMode("create");
    setSelectedSector(null);
    setIsModalOpen(true);
  };

  const openEditModal = (sector: Sector) => {
    setModalMode("edit");
    setSelectedSector(sector);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setIsModalOpen(false);
    setSelectedSector(null);
  };

  const handleSubmit = async (payload: SectorPayload) => {
    setSubmitting(true);
    setError(null);

    try {
      if (modalMode === "create") {
        await createSector(payload);
      } else if (selectedSector) {
        await updateSector(selectedSector.id, payload);
      }

      setIsModalOpen(false);
      setSelectedSector(null);
      await loadSectors();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (sector: Sector) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${sector.name}"?`
    );

    if (!confirmed) return;

    setError(null);

    try {
      await deleteSector(sector.id);
      await loadSectors();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  };

  return (
    <AdminLayout
      title="Sector Management"
      description="Create, edit, and organize sectors used across the assessment."
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[#1A1A1A]">Sectors</h2>
            <p className="mt-1 text-sm text-[#6B7280]">
              Manage sector data available to consultants and assessment respondents.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center rounded-xl bg-[#1A1A1A] px-5 py-3 text-sm font-semibold text-white"
          >
            Add sector
          </button>
        </div>

        {error ? (
          <div className="rounded-2xl border border-[#F3D6D6] bg-[#FFF5F5] px-4 py-3 text-sm text-[#B42318]">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-8 text-sm text-[#6B7280]">
            Loading sectors...
          </div>
        ) : (
          <SectorTable
            sectors={sectors}
            onEdit={openEditModal}
            onDelete={handleDelete}
          />
        )}
      </div>

      <SectorFormModal
        isOpen={isModalOpen}
        mode={modalMode}
        initialSector={selectedSector}
        submitting={submitting}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />
    </AdminLayout>
  );
}

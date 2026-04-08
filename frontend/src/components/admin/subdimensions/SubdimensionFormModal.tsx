import { useState, type ChangeEvent, type FormEvent } from "react";
import type { Dimension } from "@/features/dimensions/types/dimension.types";
import type {
  Subdimension,
  SubdimensionPayload,
} from "@/features/subdimensions/types/subdimension.types";

type Props = {
  isOpen: boolean;
  mode: "create" | "edit";
  initialSubdimension: Subdimension | null;
  dimensions: Dimension[];
  defaultDimensionId: number | null;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (payload: SubdimensionPayload) => Promise<void>;
};

type FormContentProps = Omit<Props, "isOpen">;

const emptyForm: SubdimensionPayload = {
  dimension_id: 0,
  name: "",
  code: "",
  description: "",
  weight: 1,
  display_order: 0,
  is_active: true,
};

function getInitialForm(
  mode: "create" | "edit",
  subdimension: Subdimension | null,
  dimensions: Dimension[],
  defaultDimensionId: number | null
): SubdimensionPayload {
  if (mode === "edit" && subdimension) {
    return {
      dimension_id: subdimension.dimension_id,
      name: subdimension.name,
      code: subdimension.code,
      description: subdimension.description || "",
      weight: subdimension.weight,
      display_order: subdimension.display_order,
      is_active: subdimension.is_active,
    };
  }

  return {
    ...emptyForm,
    dimension_id: defaultDimensionId ?? dimensions[0]?.id ?? 0,
  };
}

function SubdimensionFormContent({
  mode,
  initialSubdimension,
  dimensions,
  defaultDimensionId,
  submitting,
  onClose,
  onSubmit,
}: FormContentProps) {
  const [form, setForm] = useState<SubdimensionPayload>(() =>
    getInitialForm(mode, initialSubdimension, dimensions, defaultDimensionId)
  );

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : ["dimension_id", "display_order", "weight"].includes(name)
            ? Number(value)
            : value,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!e.currentTarget.checkValidity()) {
      e.currentTarget.reportValidity();
      return;
    }

    await onSubmit({
      dimension_id: form.dimension_id,
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      description: form.description?.trim() || null,
      weight: form.weight,
      display_order: form.display_order,
      is_active: form.is_active,
    });
  };

  return (
    <div className="w-full max-w-2xl rounded-3xl border border-[#E5E7EB] bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.12)] md:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#C5A04F]">
            {mode === "create" ? "Add subdimension" : "Edit subdimension"}
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-[#1A1A1A]">
            {mode === "create"
              ? "Create a new subdimension"
              : "Update subdimension details"}
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

      <form onSubmit={handleSubmit} className="mt-8 grid gap-5">
        <div>
          <label
            htmlFor="dimension_id"
            className="mb-2.5 block text-sm font-medium text-[#1A1A1A]"
          >
            Dimension
          </label>
          <select
            id="dimension_id"
            name="dimension_id"
            value={form.dimension_id || ""}
            onChange={handleChange}
            required
            className="h-12 w-full rounded-xl border border-[#E5E7EB] bg-[#FCFCFC] px-4 text-sm text-[#1A1A1A] outline-none focus:border-[#C5A04F] focus:bg-white"
          >
            <option value="" disabled>
              Select a dimension
            </option>
            {dimensions.map((dimension) => (
              <option key={dimension.id} value={dimension.id}>
                {dimension.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label
              htmlFor="name"
              className="mb-2.5 block text-sm font-medium text-[#1A1A1A]"
            >
              Subdimension name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              required
              className="h-12 w-full rounded-xl border border-[#E5E7EB] bg-[#FCFCFC] px-4 text-sm text-[#1A1A1A] outline-none focus:border-[#C5A04F] focus:bg-white"
              placeholder="Executive sponsorship"
            />
          </div>

          <div>
            <label
              htmlFor="code"
              className="mb-2.5 block text-sm font-medium text-[#1A1A1A]"
            >
              Code
            </label>
            <input
              id="code"
              name="code"
              type="text"
              value={form.code}
              onChange={handleChange}
              required
              className="h-12 w-full rounded-xl border border-[#E5E7EB] bg-[#FCFCFC] px-4 text-sm uppercase text-[#1A1A1A] outline-none focus:border-[#C5A04F] focus:bg-white"
              placeholder="EXEC"
            />
          </div>
        </div>

        <div className="grid gap-5">
          <div>
            <label
              htmlFor="weight"
              className="mb-2.5 block text-sm font-medium text-[#1A1A1A]"
            >
              Weight
            </label>
            <input
              id="weight"
              name="weight"
              type="number"
              min="0"
              step="0.1"
              value={form.weight}
              onChange={handleChange}
              required
              className="h-12 w-full rounded-xl border border-[#E5E7EB] bg-[#FCFCFC] px-4 text-sm text-[#1A1A1A] outline-none focus:border-[#C5A04F] focus:bg-white"
            />
          </div>

        </div>

        <div>
          <label
            htmlFor="description"
            className="mb-2.5 block text-sm font-medium text-[#1A1A1A]"
          >
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={form.description || ""}
            onChange={handleChange}
            rows={4}
            className="w-full rounded-xl border border-[#E5E7EB] bg-[#FCFCFC] px-4 py-3 text-sm text-[#1A1A1A] outline-none focus:border-[#C5A04F] focus:bg-white"
            placeholder="Optional description for this subdimension"
          />
        </div>

        <label className="flex items-center gap-3 text-sm text-[#1A1A1A]">
          <input
            type="checkbox"
            name="is_active"
            checked={form.is_active}
            onChange={handleChange}
            className="h-4 w-4 rounded border-[#D1D5DB]"
          />
          Active subdimension
        </label>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#E5E7EB] bg-white px-5 py-3 text-sm font-medium text-[#1A1A1A] hover:bg-[#FAFAFA]"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={submitting || dimensions.length === 0}
            className="rounded-xl bg-[#1A1A1A] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {submitting
              ? mode === "create"
                ? "Creating..."
                : "Saving..."
              : mode === "create"
                ? "Create subdimension"
                : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function SubdimensionFormModal({
  isOpen,
  mode,
  initialSubdimension,
  dimensions,
  defaultDimensionId,
  submitting,
  onClose,
  onSubmit,
}: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/30 px-4 py-6">
      <SubdimensionFormContent
        key={`${mode}-${initialSubdimension?.id ?? "new"}-${dimensions.length}`}
        mode={mode}
        initialSubdimension={initialSubdimension}
        dimensions={dimensions}
        defaultDimensionId={defaultDimensionId}
        submitting={submitting}
        onClose={onClose}
        onSubmit={onSubmit}
      />
    </div>
  );
}

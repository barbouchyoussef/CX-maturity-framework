import { useState, type ChangeEvent, type FormEvent } from "react";
import type {
  Dimension,
  DimensionPayload,
} from "@/features/dimensions/types/dimension.types";

type Props = {
  isOpen: boolean;
  mode: "create" | "edit";
  initialDimension: Dimension | null;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (payload: DimensionPayload) => Promise<void>;
};

type FormContentProps = Omit<Props, "isOpen">;

const emptyForm: DimensionPayload = {
  name: "",
  code: "",
  description: "",
  weight: 1,
  display_order: 0,
  is_active: true,
};

function getInitialForm(
  mode: "create" | "edit",
  dimension: Dimension | null
): DimensionPayload {
  if (mode === "edit" && dimension) {
    return {
      name: dimension.name,
      code: dimension.code,
      description: dimension.description || "",
      weight: dimension.weight,
      display_order: dimension.display_order,
      is_active: dimension.is_active,
    };
  }

  return emptyForm;
}

function DimensionFormContent({
  mode,
  initialDimension,
  submitting,
  onClose,
  onSubmit,
}: FormContentProps) {
  const [form, setForm] = useState<DimensionPayload>(() =>
    getInitialForm(mode, initialDimension)
  );

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : ["display_order", "weight"].includes(name)
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
            {mode === "create" ? "Add dimension" : "Edit dimension"}
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-[#1A1A1A]">
            {mode === "create"
              ? "Create a new dimension"
              : "Update dimension details"}
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
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label
              htmlFor="name"
              className="mb-2.5 block text-sm font-medium text-[#1A1A1A]"
            >
              Dimension name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              required
              className="h-12 w-full rounded-xl border border-[#E5E7EB] bg-[#FCFCFC] px-4 text-sm text-[#1A1A1A] outline-none focus:border-[#C5A04F] focus:bg-white"
              placeholder="Strategy & Governance"
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
              placeholder="GOV"
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
            placeholder="Optional description for this dimension"
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
          Active dimension
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
            disabled={submitting}
            className="rounded-xl bg-[#1A1A1A] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {submitting
              ? mode === "create"
                ? "Creating..."
                : "Saving..."
              : mode === "create"
                ? "Create dimension"
                : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function DimensionFormModal({
  isOpen,
  mode,
  initialDimension,
  submitting,
  onClose,
  onSubmit,
}: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/30 px-4 py-6">
      <DimensionFormContent
        key={`${mode}-${initialDimension?.id ?? "new"}`}
        mode={mode}
        initialDimension={initialDimension}
        submitting={submitting}
        onClose={onClose}
        onSubmit={onSubmit}
      />
    </div>
  );
}

import type { Sector } from "@/features/sectors/types/sector.types";

type Props = {
  sectors: Sector[];
  onEdit: (sector: Sector) => void;
  onDelete: (sector: Sector) => void;
};

export default function SectorTable({ sectors, onEdit, onDelete }: Props) {
  if (sectors.length === 0) {
    return (
      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-8 text-center text-sm text-[#6B7280]">
        No sectors found.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead className="bg-[#FCFCFC]">
            <tr className="border-b border-[#E5E7EB]">
              <th className="px-5 py-4 text-left text-sm font-semibold text-[#1A1A1A]">
                ID
              </th>
              <th className="px-5 py-4 text-left text-sm font-semibold text-[#1A1A1A]">
                Sector name
              </th>
              <th className="px-5 py-4 text-left text-sm font-semibold text-[#1A1A1A]">
                Code
              </th>
              <th className="px-5 py-4 text-left text-sm font-semibold text-[#1A1A1A]">
                Description
              </th>
              <th className="px-5 py-4 text-left text-sm font-semibold text-[#1A1A1A]">
                Order
              </th>
              <th className="px-5 py-4 text-left text-sm font-semibold text-[#1A1A1A]">
                Status
              </th>
              <th className="px-5 py-4 text-right text-sm font-semibold text-[#1A1A1A]">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {sectors.map((sector) => (
              <tr
                key={sector.id}
                className="border-b border-[#E5E7EB] last:border-b-0"
              >
                <td className="px-5 py-4 text-sm text-[#4B5563]">
                  {sector.id}
                </td>

                <td className="px-5 py-4 text-sm font-medium text-[#1A1A1A]">
                  {sector.name}
                </td>

                <td className="px-5 py-4 text-sm text-[#4B5563]">
                  {sector.code}
                </td>

                <td className="px-5 py-4 text-sm text-[#4B5563]">
                  {sector.description || "-"}
                </td>

                <td className="px-5 py-4 text-sm text-[#4B5563]">
                  {sector.display_order}
                </td>

                <td className="px-5 py-4 text-sm">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                      sector.is_active
                        ? "bg-[#F0F9F2] text-[#2D7A3A]"
                        : "bg-[#F3F4F6] text-[#6B7280]"
                    }`}
                  >
                    {sector.is_active ? "Active" : "Inactive"}
                  </span>
                </td>

                <td className="px-5 py-4">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => onEdit(sector)}
                      className="rounded-lg border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-medium text-[#1A1A1A] transition hover:bg-[#FAFAFA]"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => onDelete(sector)}
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

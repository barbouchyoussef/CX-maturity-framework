import type { Dimension } from "@/features/dimensions/types/dimension.types";
import type { Sector } from "@/features/sectors/types/sector.types";

type Props = {
  dimensions: Dimension[];
  sectors: Sector[];
  onEdit: (dimension: Dimension) => void;
  onDelete: (dimension: Dimension) => void;
};

export default function DimensionTable({
  dimensions,
  sectors,
  onEdit,
  onDelete,
}: Props) {
  const sectorNames = new Map(sectors.map((sector) => [sector.id, sector.name]));

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
              {["ID", "Sector", "Dimension", "Code", "Weight", "Order", "Status"].map(
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
            {dimensions.map((dimension) => (
              <tr
                key={dimension.id}
                className="border-b border-[#E5E7EB] last:border-b-0"
              >
                <td className="px-5 py-4 text-sm text-[#4B5563]">
                  {dimension.id}
                </td>
                <td className="px-5 py-4 text-sm text-[#4B5563]">
                  {sectorNames.get(dimension.sector_id) ?? `Sector ${dimension.sector_id}`}
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
                <td className="px-5 py-4 text-sm text-[#4B5563]">
                  {dimension.display_order}
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

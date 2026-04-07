import { Link, useLocation } from "react-router-dom";

const links = [
  { to: "/admin/sectors", label: "Sectors" },
  { to: "/admin/dimensions", label: "Dimensions" },
  { to: "/admin/subdimensions", label: "Subdimensions" },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="w-full border-r border-[#E5E7EB] bg-white lg:w-64">
      <div className="border-b border-[#E5E7EB] px-6 py-5">
        <div className="text-lg font-semibold text-[#1A1A1A]">Admin</div>
        <div className="mt-1 text-sm text-[#6B7280]">Internal consultants</div>
      </div>

      <nav className="p-4">
        <div className="space-y-2">
          {links.map((link) => {
            const active = location.pathname === link.to;

            return (
              <Link
                key={link.to}
                to={link.to}
                className={`block rounded-xl px-4 py-3 text-sm font-medium transition ${
                  active
                    ? "bg-[#FFF8CC] text-[#1A1A1A]"
                    : "text-[#4B5563] hover:bg-[#F9FAFB]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}
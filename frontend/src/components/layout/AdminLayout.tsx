import type { ReactNode } from "react";
import Sidebar from "./Sidebar";

type Props = {
  title: string;
  description?: string;
  children: ReactNode;
};

export default function AdminLayout({ title, description, children }: Props) {
  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#1A1A1A] lg:flex">
      <Sidebar />

      <div className="flex-1">
        <header className="border-b border-[#E5E7EB] bg-[#FAFAFA] px-6 py-6 md:px-8">
          <h1 className="text-3xl font-semibold tracking-[-0.03em]">{title}</h1>
          {description ? (
            <p className="mt-2 text-sm text-[#6B7280]">{description}</p>
          ) : null}
        </header>

        <main className="px-6 py-8 md:px-8">{children}</main>
      </div>
    </div>
  );
}
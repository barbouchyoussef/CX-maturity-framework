import type { ReactNode } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";

type Props = {
  children: ReactNode;
};

export default function PublicLayout({ children }: Props) {
  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#1A1A1A]">
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
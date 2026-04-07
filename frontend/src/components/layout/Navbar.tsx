export default function Navbar() {
  return (
    <header className="border-b border-[#E5E7EB] bg-[#FAFAFA]/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 md:px-8 lg:px-10">
        <div className="flex items-center gap-3">
          <div className="h-2.5 w-10 bg-[#FFE600]" />
          <div className="text-[1.4rem] font-semibold tracking-[-0.02em] text-[#1A1A1A]">
            CX Studio
          </div>
        </div>

        <nav className="hidden items-center gap-10 text-[0.98rem] text-[#4B5563] lg:flex">
          <a href="#overview" className="transition hover:text-[#1A1A1A]">Overview</a>
          <a href="#dimensions" className="transition hover:text-[#1A1A1A]">Dimensions</a>
          <a href="#process" className="transition hover:text-[#1A1A1A]">Process</a>
          <a href="#start" className="transition hover:text-[#1A1A1A]">Start</a>
        </nav>
      </div>
    </header>
  );
}

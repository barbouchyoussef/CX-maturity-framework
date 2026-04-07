type SectionHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export default function SectionHeader({
  eyebrow,
  title,
  description,
}: SectionHeaderProps) {
  return (
    <div className="max-w-3xl">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-[#C5A04F]">
        {eyebrow}
      </p>
      <h2 className="text-[2rem] font-semibold leading-tight tracking-[-0.03em] text-[#1A1A1A] md:text-[2.5rem]">
        {title}
      </h2>
      <p className="mt-5 text-base leading-8 text-[#4B5563] md:text-[1.05rem]">
        {description}
      </p>
    </div>
  );
}

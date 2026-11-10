export function HomeSectionHeading({
  eyebrow,
  title,
  light = false,
  compact = false,
}: {
  eyebrow: string;
  title: string;
  light?: boolean;
  compact?: boolean;
}) {
  return (
    <div className={`mx-auto text-center ${compact ? "max-w-lg lg:max-w-2xl" : "max-w-2xl"}`}>
      <p
        className={`text-center font-semibold uppercase tracking-[0.2em] text-[#c5a059] ${
          compact ? "text-[10px] lg:text-[11px]" : "text-[11px]"
        }`}
      >
        {eyebrow}
      </p>
      <h2
        className={`text-center font-serif font-medium leading-[1.2] ${
          compact
            ? "mt-1.5 text-[clamp(0.95rem,0.85rem+0.5vw,1.25rem)] lg:mt-3 lg:text-[clamp(1.5rem,1.1rem+1.2vw,2rem)]"
            : "mt-2 text-[clamp(1.5rem,1.1rem+1.2vw,2rem)] sm:mt-3"
        } ${light ? "text-[#f7f2ea]" : "text-[#083534]"}`}
      >
        {title}
      </h2>
    </div>
  );
}

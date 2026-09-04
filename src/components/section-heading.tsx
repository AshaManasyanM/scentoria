export function SectionHeading({
  title,
  subtitle,
  light = false,
}: {
  title: string;
  subtitle?: string;
  light?: boolean;
}) {
  return (
    <div className="mb-8 px-2 text-center md:mb-10">
      <h2 className={`font-serif text-[clamp(28px,6vw,48px)] font-medium leading-snug ${light ? "text-white" : "text-fg"}`}>
        {title}
      </h2>
      {subtitle ? (
        <p className={`mt-3 mx-auto max-w-2xl text-[clamp(14px,3.4vw,22px)] leading-relaxed ${light ? "text-white/85" : "text-muted"}`}>
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

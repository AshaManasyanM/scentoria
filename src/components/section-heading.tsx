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
    <div className={`mb-8 px-2 md:mb-11 ${light ? "max-w-3xl text-left" : "text-center"}`}>
      <h2 className={`font-serif font-medium leading-tight ${light ? "text-[clamp(32px,4vw,40px)] text-[#f7f2ea]" : "text-[clamp(28px,4vw,32px)] text-fg"}`}>
        {title}
      </h2>
      {subtitle ? (
        <p className={`mt-3 max-w-2xl text-lg leading-7 ${light ? "text-[#f7f2ea]/70" : "mx-auto text-muted"}`}>
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

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
    <div className="mb-10 text-center">
      <h2 className={`font-serif text-[2.8vw] font-medium ${light ? "text-white" : "text-fg"}`}>
        {title}
      </h2>
      {subtitle ? (
        <p className={`mt-3 max-w-2xl mx-auto text-[1.56vw] ${light ? "text-white/80" : "text-muted"}`}>
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

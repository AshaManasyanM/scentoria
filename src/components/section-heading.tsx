export function SectionHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-10 text-center">
      <h2 className="font-serif text-4xl md:text-5xl">{title}</h2>
      {subtitle ? <p className="mt-3 text-muted max-w-2xl mx-auto">{subtitle}</p> : null}
    </div>
  );
}

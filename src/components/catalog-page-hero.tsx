export function CatalogPageHero({
  eyebrow,
  title,
  subtitle,
  image,
  alt = "",
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  image: string;
  alt?: string;
}) {
  return (
    <section className="relative h-[clamp(200px,28vw,320px)] overflow-hidden bg-[#083534]">
      <img src={image} alt={alt} className="h-full w-full object-cover object-center" />
      <div className="absolute inset-0 bg-[#083534]/60" />
      <div className="absolute inset-0 flex items-end px-4 pb-6 md:px-8 md:pb-8">
        <div className="mx-auto w-full max-w-[min(100%,82.5rem)]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#c5a059]">{eyebrow}</p>
          <h1 className="mt-3 max-w-3xl heading-display font-serif font-medium text-[#f7f2ea]">{title}</h1>
          {subtitle ? (
            <p className="mt-4 max-w-xl text-[15px] leading-7 text-[#f7f2ea]/90">{subtitle}</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

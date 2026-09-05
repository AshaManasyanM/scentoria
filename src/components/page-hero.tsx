export function PageHero({
  title,
  subtitle,
  image = "/fregrance.webp",
}: {
  title: string;
  subtitle?: string;
  image?: string;
}) {
  return (
    <section className="relative flex h-[clamp(280px,42vw,600px)] items-center justify-end overflow-hidden px-4 md:px-8">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.48), rgba(0,0,0,0.48)), url("${image}")`,
        }}
      />
      <div className="relative z-10 w-full max-w-[800px] px-2 text-white md:px-4 md:text-center">
        <h1 className="font-[family-name:var(--font-tommy)] text-[clamp(32px,5vw,60px)] font-medium uppercase leading-tight">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-4 font-[family-name:var(--font-tommy)] text-sm leading-relaxed text-white/90 md:text-base">
            {subtitle}
          </p>
        ) : null}
      </div>
    </section>
  );
}

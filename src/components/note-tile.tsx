import Link from "next/link";

export function NoteTile({
  href,
  image,
  label,
  className = "",
  variant = "default",
}: {
  href: string;
  image: string;
  label: string;
  className?: string;
  variant?: "default" | "home";
}) {
  if (variant === "home") {
    const safeImage = image.replace(/["\\]/g, "");
    return (
      <Link
        href={href}
        className={`group relative aspect-[4/5] overflow-hidden rounded-2xl bg-[#083534] text-[#f7f2ea] shadow-[0_10px_30px_rgba(8,53,52,0.1)] ${className}`}
      >
        <span
          aria-hidden
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-105"
          style={{
            backgroundImage: safeImage ? `url("${safeImage}")` : undefined,
          }}
        />
        <span
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-[#083534] via-[#083534]/50 to-[#083534]/15"
        />
        <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 md:p-5">
          <span className="font-serif text-xl font-medium leading-none md:text-[1.35rem]">{label}</span>
          <span
            aria-hidden
            className="text-[#c5a059] transition-transform duration-300 group-hover:translate-x-1"
          >
            →
          </span>
        </span>
      </Link>
    );
  }
  return (
    <Link
      href={href}
      className={`group relative flex aspect-[4/5] items-center justify-center overflow-hidden rounded-2xl bg-[#083534] transition duration-300 hover:shadow-[0_12px_28px_rgba(8,53,52,0.18)] ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image}
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-55 transition-transform duration-700 group-hover:scale-105"
      />
      <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-[#083534]/80 via-[#083534]/35 to-transparent" />
      <h2 className="relative z-10 max-w-[90%] px-2 text-center font-serif text-[clamp(14px,3.5vw,24px)] font-medium uppercase leading-tight text-white">
        {label}
      </h2>
    </Link>
  );
}

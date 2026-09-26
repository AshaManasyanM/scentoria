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
    return (
      <Link
        href={href}
        className={`relative flex h-[148px] flex-col justify-end overflow-hidden rounded-md p-3 text-[#f7f2ea] md:h-[180px] md:p-5 ${className}`}
        style={{
          backgroundColor: "#083534",
          backgroundImage: `linear-gradient(180deg, rgba(8,53,52,0.55), rgba(8,53,52,0.62)), url("${image}")`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#c5a059]">{label}</p>
        <p className="mt-1 font-serif text-xl font-medium leading-none md:mt-2 md:text-[clamp(26px,2vw,32px)]">{label}</p>
      </Link>
    );
  }
  return (
    <Link
      href={href}
      className={`relative flex h-[140px] items-center justify-center overflow-hidden rounded-[10px] bg-black transition duration-200 ease-in-out hover:scale-105 hover:shadow-[0_0_12px_rgba(0,0,0,0.376)] md:h-[270px] md:rounded-[20px] ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image}
        alt=""
        className="absolute inset-0 h-full w-full max-h-[290px] rounded-[5px] object-cover opacity-50"
      />
      <h2 className="relative z-10 max-w-[90%] px-1 text-center font-serif text-[clamp(14px,4vw,27px)] font-medium uppercase leading-tight text-white">
        {label}
      </h2>
    </Link>
  );
}

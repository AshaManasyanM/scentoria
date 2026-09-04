import Link from "next/link";

export function NoteTile({
  href,
  image,
  label,
  className = "",
}: {
  href: string;
  image: string;
  label: string;
  className?: string;
}) {
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

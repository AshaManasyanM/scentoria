import { path } from "@/lib/path";
import type { Locale } from "@/lib/types";
import Link from "next/link";

/**
 * Some Shopify/brand assets ship with heavy transparent padding, so they look
 * smaller than denser logos at the same object-fit size. Boost those here.
 */
const LOGO_SCALE: Record<string, number> = {
  "born-to-stand-out": 1.35,
  "born to stand out": 1.35,
  fugazzi: 1.3,
  "fugazzi-born-to-stand-out": 1.35,
  kilian: 1.25,
  byredo: 1.2,
  "27-87": 1.2,
  "2787": 1.2,
  "bdk-parfums": 1.2,
  bdk: 1.2,
  "comme-des-garcons": 1.15,
  amouage: 1.1,
  creed: 1.1,
  diptyque: 1.1,
};

function logoScale(name: string, handle?: string) {
  const keys = [handle, name]
    .filter(Boolean)
    .map((value) =>
      String(value)
        .toLowerCase()
        .trim()
        .replace(/&/g, "and")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, ""),
    );
  for (const key of keys) {
    if (LOGO_SCALE[key]) return LOGO_SCALE[key];
  }
  return 1.12;
}

export function BrandLogoTile({
  locale,
  name,
  handle,
  logo,
}: {
  locale: Locale;
  name: string;
  handle?: string;
  logo?: string | null;
}) {
  const scale = logoScale(name, handle);

  return (
    <Link
      href={path(locale, `/products?brand=${encodeURIComponent(name)}`)}
      className="group flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-2xl border border-[#c5a059]/35 bg-white px-4 py-5 shadow-[0_8px_24px_rgba(0,0,0,0.18)] transition duration-300 hover:-translate-y-0.5 hover:border-[#c5a059] hover:shadow-[0_14px_32px_rgba(0,0,0,0.22)] active:scale-[0.99] sm:aspect-[5/3] sm:border-[#d8d0c4]/80 sm:px-5 sm:py-6 sm:shadow-[0_1px_0_rgba(8,53,52,0.04)] sm:hover:shadow-[0_12px_28px_rgba(8,53,52,0.1)]"
    >
      {logo ? (
        <span className="flex h-[4.75rem] w-full items-center justify-center transition duration-300 group-hover:scale-[1.03] min-[400px]:h-20 sm:h-16 md:h-[4.75rem]">
          <span className="flex h-full w-full items-center justify-center max-sm:scale-[1.1]">
            <span className="flex h-full w-full items-center justify-center" style={{ transform: `scale(${scale})` }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logo}
                alt={`${name} perfume brand logo`}
                title={`${name} perfume brand`}
                className="max-h-full max-w-[96%] object-contain sm:max-w-[92%]"
              />
            </span>
          </span>
        </span>
      ) : (
        <span className="max-w-[90%] text-center font-serif text-[clamp(1.15rem,1rem+1.2vw,1.55rem)] font-medium leading-snug tracking-wide text-[#083534] sm:text-[clamp(1.05rem,0.85rem+0.9vw,1.45rem)]">
          {name}
        </span>
      )}
    </Link>
  );
}

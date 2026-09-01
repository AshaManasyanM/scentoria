import { getDict } from "@/lib/i18n";
import { path } from "@/lib/path";
import type { Locale } from "@/lib/types";
import Link from "next/link";

export function Footer({ locale }: { locale: Locale }) {
  const t = getDict(locale);
  return (
    <footer className="mt-auto border-t border-line bg-bg-2">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-3">
        <div>
          <p className="font-serif text-2xl tracking-[0.28em] uppercase">{t.brand}</p>
          <p className="mt-3 text-sm text-muted">{t.tagline}</p>
        </div>
        <div className="text-sm text-muted space-y-2">
          <p className="text-gold tracking-[0.2em] uppercase text-xs">{t.workingHours}</p>
          <p>{t.hoursValue}</p>
          <p className="pt-4 text-gold tracking-[0.2em] uppercase text-xs">{t.feedback}</p>
          <p>+374 00 000 000</p>
          <p>hello@scentoria.am</p>
        </div>
        <div className="text-sm text-muted">
          <p className="text-gold tracking-[0.2em] uppercase text-xs">{t.followUs}</p>
          <div className="mt-3 flex gap-4">
            <a href="https://instagram.com" target="_blank" rel="noreferrer">
              Instagram
            </a>
            <a href="https://youtube.com" target="_blank" rel="noreferrer">
              YouTube
            </a>
          </div>
          <div className="mt-6 flex flex-col gap-2 uppercase tracking-[0.16em] text-xs">
            <Link href={path(locale, "/about")}>{t.nav.about}</Link>
            <Link href={path(locale, "/products")}>{t.nav.perfumes}</Link>
            <Link href={path(locale, "/notes")}>{t.shopByNote}</Link>
            <Link href={path(locale, "/sales")}>{t.nav.sales}</Link>
            <Link href={path(locale, "/contact")}>{t.contact}</Link>
            <Link href={path(locale, "/account")}>{t.account}</Link>
          </div>
        </div>
      </div>
      <p className="border-t border-line py-6 text-center text-xs text-muted">{t.copyright}</p>
    </footer>
  );
}

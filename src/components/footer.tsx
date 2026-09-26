import { NAV, hrefFor } from "@/lib/nav";
import { getDict } from "@/lib/i18n";
import { path } from "@/lib/path";
import type { Locale } from "@/lib/types";
import Link from "next/link";

export function Footer({ locale }: { locale: Locale }) {
  const t = getDict(locale);

  return (
    <footer className="mt-auto bg-[#083534] text-[#f7f2ea]">
      <div className="mx-auto grid max-w-[1280px] gap-12 px-4 py-14 md:grid-cols-[1.1fr_0.8fr_1fr] md:px-8">
        <div>
          <Link href={path(locale)} className="font-serif text-[32px] font-medium">
            {t.brand}
          </Link>
          <p className="mt-8 text-xs font-semibold uppercase tracking-[0.16em] text-[#c5a059]">
            {t.footerJoin}
          </p>
          <div className="mt-4 flex gap-3">
            <Link
              href={path(locale, "/signup")}
              className="inline-flex rounded-[2px] bg-[#c5a059] px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.08em] text-[#083534]"
            >
              {t.signUp}
            </Link>
            <Link
              href={path(locale, "/login")}
              className="inline-flex rounded-[2px] border border-[#f7f2ea] px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.08em]"
            >
              {t.signIn}
            </Link>
          </div>
        </div>

        <nav aria-label="Footer">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#c5a059]">
            {t.navLabel}
          </p>
          <ul className="mt-5 space-y-3 text-sm">
            {NAV.map((key) => (
              <li key={key}>
                <Link href={hrefFor(locale, key)} className="hover:text-[#c5a059]">
                  {t.nav[key]}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="text-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#c5a059]">{t.contact}</p>
          <p className="mt-5 text-[#f7f2ea]/80">{t.phoneNumber}</p>
          <a href="tel:+37400000000" className="mt-1 block hover:text-[#c5a059]">
            +374 00 000 000
          </a>
          <p className="mt-4 text-[#f7f2ea]/80">{t.yourEmail}</p>
          <a href="mailto:hello@scentoria.am" className="mt-1 block hover:text-[#c5a059]">
            hello@scentoria.am
          </a>
          <p className="mt-4 text-[#f7f2ea]/80">{t.workingHours}</p>
          <p className="mt-1">{t.hoursValue}</p>
          <p className="mt-4 text-[#f7f2ea]/80">{t.followUsShort}</p>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noreferrer"
            aria-label="Instagram"
            className="mt-2 inline-flex hover:text-[#c5a059]"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
              <rect x="3" y="3" width="18" height="18" rx="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
            </svg>
          </a>
        </div>
      </div>
      <div className="mx-auto max-w-[1280px] px-4 md:px-8">
        <div className="border-t border-[#f7f2ea]/30" />
        <p className="py-6 text-center text-xs text-[#f7f2ea]/80">{t.copyright}</p>
      </div>
    </footer>
  );
}

import { NAV, hrefFor } from "@/lib/nav";
import { getDict } from "@/lib/i18n";
import { path } from "@/lib/path";
import type { Locale } from "@/lib/types";
import Link from "next/link";

export function Footer({ locale }: { locale: Locale }) {
  const t = getDict(locale);

  return (
    <footer className="mt-auto bg-[rgba(8,53,34,0.95)] text-white">
      <div className="mx-auto max-w-[1350px] px-4 py-10 md:px-10">
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="flex w-full max-w-xl items-center gap-4">
            <span className="h-px flex-1 bg-white/40" aria-hidden />
            <Link
              href={path(locale)}
              className="shrink-0 font-serif text-3xl font-bold uppercase tracking-[0.08em]"
            >
              {t.brand}
            </Link>
            <span className="h-px flex-1 bg-white/40" aria-hidden />
          </div>
          <p className="text-center text-sm font-bold text-white/70">{t.tagline}</p>
        </div>

        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3 lg:gap-10">
          <div className="flex flex-col items-center gap-2 text-center md:min-h-[190px] md:items-start md:text-left">
            <p className="text-base font-bold">{t.joinCommunity}</p>
            <p className="text-sm leading-relaxed text-white/85">{t.communityHint}</p>
            <div className="mt-4 flex justify-center gap-2 md:justify-start">
              <Link href={path(locale, "/signup")} className="footer-btn footer-btn-pair">
                {t.signUp}
              </Link>
              <Link href={path(locale, "/login")} className="footer-btn footer-btn-outline footer-btn-pair">
                {t.signIn}
              </Link>
            </div>
          </div>

          <nav className="flex flex-col items-center gap-4 md:gap-6" aria-label="Footer">
            {NAV.map((key) => (
              <Link
                key={key}
                href={hrefFor(locale, key)}
                className={`font-serif text-xl font-semibold uppercase leading-none hover:opacity-70 ${
                  key === "sales" ? "text-sale" : "text-white"
                }`}
              >
                {t.nav[key]}
              </Link>
            ))}
          </nav>

          <div className="flex flex-col items-center text-center text-sm md:items-start md:text-left">
            <p className="font-serif text-lg">{t.followUs}</p>
            <div className="mt-3 flex justify-center gap-5 font-medium md:justify-start">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="hover:opacity-70"
              >
                Instagram
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                className="hover:opacity-70"
              >
                YouTube
              </a>
            </div>
            <p className="mt-6 font-serif text-lg">{t.workingHours}</p>
            <p className="mt-1 text-white/85">{t.hoursValue}</p>
            <p className="mt-5 font-serif text-lg">{t.feedback}</p>
            <a href="tel:+37400000000" className="footer-btn mt-3">
              +374 00 000 000
            </a>
            <a
              href="mailto:hello@scentoria.am"
              className="mt-3 block font-medium hover:opacity-70"
            >
              hello@scentoria.am
            </a>
          </div>
        </div>
      </div>
      <p className="border-t border-white/30 py-5 text-center text-xs tracking-wide text-white/80">
        {t.copyright}
      </p>
    </footer>
  );
}

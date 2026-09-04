import { getDict } from "@/lib/i18n";
import { path } from "@/lib/path";
import type { Locale } from "@/lib/types";
import Link from "next/link";

export function Footer({ locale }: { locale: Locale }) {
  const t = getDict(locale);
  return (
    <footer className="mt-auto bg-gold-2 text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 md:grid-cols-3">
        <div>
          <p className="font-serif text-xl">{t.joinCommunity}</p>
          <p className="mt-3 text-sm text-white/80">{t.communityHint}</p>
          <Link href={path(locale, "/account")} className="mt-6 block rounded-md bg-white py-3 text-center font-serif text-fg">
            {t.signUp}
          </Link>
          <Link href={path(locale, "/account")} className="mt-3 block rounded-md bg-white py-3 text-center font-serif text-fg">
            {t.signIn}
          </Link>
        </div>
        <div>
          <p className="text-sm">{t.tagline}</p>
          <div className="mt-6 flex flex-col gap-2 font-serif text-lg uppercase">
            <Link href={path(locale)}>{t.nav.home}</Link>
            <Link href={path(locale, "/about")}>{t.nav.about}</Link>
            <Link href={path(locale, "/brands")}>{t.nav.brands}</Link>
            <Link href={path(locale, "/products")}>{t.nav.perfumes}</Link>
            <Link href={path(locale, "/blog")}>{t.nav.blog}</Link>
            <Link href={path(locale, "/sales")} className="text-sale">
              {t.nav.sales}
            </Link>
          </div>
        </div>
        <div className="text-sm">
          <p className="font-serif text-lg">{t.followUs}</p>
          <div className="mt-3 flex gap-4">
            <a href="https://instagram.com" target="_blank" rel="noreferrer">
              Instagram
            </a>
            <a href="https://youtube.com" target="_blank" rel="noreferrer">
              YouTube
            </a>
          </div>
          <p className="mt-6">{t.workingHours}</p>
          <p>{t.hoursValue}</p>
          <p className="mt-4">{t.feedback}</p>
          <a
            href="tel:+37400000000"
            className="mt-3 inline-block rounded-md bg-white px-4 py-2 text-fg"
          >
            +374 00 000 000
          </a>
          <p className="mt-3">hello@scentoria.am</p>
        </div>
      </div>
      <p className="border-t border-white/20 py-6 text-center text-xs text-white/70">{t.copyright}</p>
    </footer>
  );
}

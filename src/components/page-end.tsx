import { getDict } from "@/lib/i18n";
import { path } from "@/lib/path";
import type { Locale } from "@/lib/types";
import Link from "next/link";
import { Faq } from "./faq";

export function PageEnd({ locale }: { locale: Locale }) {
  const t = getDict(locale);
  return (
    <>
      <section className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h2 className="font-serif text-4xl">{t.cantFind}</h2>
        <p className="mt-4 text-muted">{t.cantFindSub}</p>
        <Link
          href={path(locale, "/contact")}
          className="btn-green mt-8"
        >
          {t.contactUs}
        </Link>
      </section>
      <Faq locale={locale} />
    </>
  );
}

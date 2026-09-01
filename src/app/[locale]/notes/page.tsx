import { PageEnd } from "@/components/page-end";
import { SectionHeading } from "@/components/section-heading";
import { getDict } from "@/lib/i18n";
import { localeFrom } from "@/lib/locale-params";
import { path } from "@/lib/path";
import { noteKeys } from "@/lib/shopify/mock";
import Link from "next/link";

export default async function NotesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = await localeFrom(params);
  const t = getDict(locale);

  return (
    <>
      <div className="mx-auto max-w-6xl px-4 py-16">
        <SectionHeading title={t.notesHero} subtitle={t.notesSub} />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
          {noteKeys.map((note) => (
            <Link
              key={note}
              href={path(locale, `/notes/${note}`)}
              className="border border-line px-3 py-10 text-center text-[11px] uppercase tracking-[0.2em] hover:border-gold"
            >
              {t.notes[note]}
            </Link>
          ))}
        </div>
      </div>
      <PageEnd locale={locale} />
    </>
  );
}

import { NoteTile } from "@/components/note-tile";
import { PageEnd } from "@/components/page-end";
import { PageHero } from "@/components/page-hero";
import { getDict } from "@/lib/i18n";
import { localeFrom } from "@/lib/locale-params";
import { noteTiles } from "@/lib/note-tiles";
import { path } from "@/lib/path";

export default async function NotesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = await localeFrom(params);
  const t = getDict(locale);

  return (
    <>
      <PageHero title={t.notesHero} subtitle={t.notesSub} />
      <div className="mx-auto max-w-[1350px] px-4 py-10 md:py-14">
        <div className="grid grid-cols-3 gap-1 md:grid-cols-4 md:gap-4">
          {noteTiles.map((note) => (
            <NoteTile
              key={note.key}
              href={path(locale, `/notes/${note.key}`)}
              image={note.image}
              label={t.notes[note.key]}
            />
          ))}
        </div>
      </div>
      <PageEnd locale={locale} />
    </>
  );
}

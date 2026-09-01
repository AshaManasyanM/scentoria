import { PageEnd } from "@/components/page-end";
import { getDict } from "@/lib/i18n";
import { localeFrom } from "@/lib/locale-params";

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = await localeFrom(params);
  const t = getDict(locale);
  return (
    <>
      <div className="mx-auto max-w-3xl px-4 py-20">
        <h1 className="font-serif text-5xl text-center">{t.aboutHero}</h1>
        <p className="mt-8 text-lg leading-relaxed text-muted">{t.aboutIntro}</p>
        <h2 className="mt-16 font-serif text-3xl">{t.ourStory}</h2>
        <p className="mt-4 leading-relaxed text-muted">{t.storyBody}</p>
        <div className="mt-16 grid gap-8 md:grid-cols-2">
          {t.values.map((value) => (
            <div key={value.title} className="border border-line p-6">
              <h3 className="font-serif text-2xl text-gold">{value.title}</h3>
              <p className="mt-3 text-sm text-muted">{value.body}</p>
            </div>
          ))}
        </div>
      </div>
      <PageEnd locale={locale} />
    </>
  );
}

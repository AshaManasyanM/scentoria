import { PageEnd } from "@/components/page-end";
import { PageHero } from "@/components/page-hero";
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
      <PageHero title={t.aboutHero} subtitle={t.aboutIntro} />
      <div className="mx-auto max-w-3xl px-4 py-16 md:py-20">
        <h2 className="font-serif text-4xl uppercase">{t.ourStory}</h2>
        <p className="mt-6 leading-relaxed text-muted">{t.storyBody}</p>
        <h3 className="mt-16 font-serif text-3xl">{t.coreValuesTitle}</h3>
        <p className="mt-4 text-muted">{t.coreValuesSub}</p>
        <div className="mt-10 grid gap-8 md:grid-cols-2">
          {t.values.map((value) => (
            <div key={value.title} className="rounded-xl bg-[#fafafa] p-6">
              <h3 className="font-serif text-2xl">{value.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{value.body}</p>
            </div>
          ))}
        </div>
      </div>
      <PageEnd locale={locale} />
    </>
  );
}

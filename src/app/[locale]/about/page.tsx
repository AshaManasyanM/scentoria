import { PageEnd } from "@/components/page-end";
import { getDict } from "@/lib/i18n";
import { localeFrom } from "@/lib/locale-params";
import { path } from "@/lib/path";
import Link from "next/link";

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = await localeFrom(params);
  const t = getDict(locale);

  return (
    <>
      <section className="relative h-[clamp(280px,45vw,520px)] overflow-hidden bg-[#083534]">
        <img
          src="/hero/rose.jpg"
          alt=""
          className="h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-[#083534]/60" />
        <div className="absolute inset-0 flex items-end px-4 pb-8 md:px-8 md:pb-14">
          <div className="mx-auto w-full max-w-[1320px]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#c5a059]">{t.nav.about}</p>
            <h1 className="mt-3 max-w-3xl font-serif text-[32px] font-medium leading-[1.15] text-[#f7f2ea] md:text-[clamp(40px,4.5vw,56px)]">
              {t.aboutHero}
            </h1>
            <p className="mt-4 max-w-xl text-[15px] leading-7 text-[#f7f2ea]/90">{t.aboutIntro}</p>
          </div>
        </div>
      </section>

      <section className="bg-[#f7f2ea] px-4 py-10 md:px-8 md:py-20">
        <div className="mx-auto grid max-w-[1320px] items-start gap-8 md:grid-cols-[0.85fr_1.15fr] md:gap-16">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#c5a059]">{t.nav.about}</p>
            <h2 className="mt-4 font-serif text-[28px] font-medium leading-[1.2] text-[#083534] md:text-[clamp(32px,4vw,44px)] md:leading-[1.15]">
              {t.ourStory}
            </h2>
          </div>
          <div className="md:pt-9">
            <p className="max-w-2xl text-[15px] leading-7 text-[#083534]">{t.storyBody}</p>
            <Link
              href={path(locale, "/products")}
              className="mt-8 inline-flex rounded-[2px] bg-[#c5a059] px-8 py-[14px] text-xs font-semibold uppercase tracking-[0.12em] text-[#083534]"
            >
              {t.viewAllProducts}
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-[#083534] px-4 py-10 md:px-8 md:py-20">
        <div className="mx-auto max-w-[1320px]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#c5a059]">{t.coreValues}</p>
          <h2 className="mt-4 max-w-3xl font-serif text-[28px] font-medium leading-[1.2] text-[#f7f2ea] md:text-[clamp(32px,4vw,44px)] md:leading-[1.15]">
            {t.coreValuesTitle}
          </h2>
          <p className="mt-4 max-w-2xl text-[15px] leading-7 text-[#f7f2ea]/80">{t.coreValuesSub}</p>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {t.values.map((value) => (
              <article key={value.title} className="rounded-md bg-[#284747] px-6 py-7 text-[#f7f2ea]">
                <h3 className="font-serif text-[22px] font-medium leading-7">{value.title}</h3>
                <p className="mt-3 text-[15px] leading-7 text-[#f7f2ea]/85">{value.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <PageEnd locale={locale} />
    </>
  );
}

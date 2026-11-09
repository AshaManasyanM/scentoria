import { PageEnd } from "@/components/page-end";
import { getDict } from "@/lib/i18n";
import { localeFrom } from "@/lib/locale-params";
import { path } from "@/lib/path";
import { isSectionVisible } from "@/lib/shopify/catalog";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = await localeFrom(params);
  if (!(await isSectionVisible("about"))) redirect(`/${locale}`);
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
          <div className="mx-auto w-full max-w-[min(100%,82.5rem)]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#c5a059]">{t.nav.about}</p>
            <h1 className="mt-3 max-w-3xl heading-display font-serif font-medium text-[#f7f2ea]">
              {t.aboutHero}
            </h1>
            <p className="mt-4 max-w-xl text-[15px] leading-7 text-[#f7f2ea]/90">{t.aboutIntro}</p>
          </div>
        </div>
      </section>

      <section className="bg-[#f7f2ea] section-pad">
        <div className="mx-auto grid max-w-[min(100%,82.5rem)] items-start gap-8 md:grid-cols-[0.85fr_1.15fr] md:gap-16">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#c5a059]">{t.nav.about}</p>
            <h2 className="mt-4 heading-section font-serif font-medium text-[#083534]">
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

      <section className="bg-[#083534] section-pad">
        <div className="mx-auto max-w-[min(100%,82.5rem)]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#c5a059]">{t.coreValues}</p>
          <h2 className="mt-4 max-w-3xl heading-section font-serif font-medium text-[#f7f2ea]">
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

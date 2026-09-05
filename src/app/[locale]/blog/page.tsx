import { PageEnd } from "@/components/page-end";
import { PageHero } from "@/components/page-hero";
import { getDict } from "@/lib/i18n";
import { localeFrom } from "@/lib/locale-params";
import { path } from "@/lib/path";
import { getArticles } from "@/lib/shopify/catalog";
import Link from "next/link";

export default async function BlogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = await localeFrom(params);
  const t = getDict(locale);
  const articles = await getArticles();

  return (
    <>
      <PageHero title={t.blogHero} subtitle={t.blogIndexSub} />
      <div className="mx-auto max-w-[1350px] px-4 py-12 md:py-16">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <article key={article.handle} className="overflow-hidden rounded-xl bg-[#fafafa]">
              {article.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={article.image} alt="" className="h-52 w-full object-cover" />
              ) : null}
              <div className="p-6">
                <p className="text-xs uppercase tracking-[0.18em] text-muted">{article.date}</p>
                <h2 className="mt-3 font-serif text-2xl">
                  <Link href={path(locale, `/blog/${article.handle}`)}>{article.title}</Link>
                </h2>
                <p className="mt-3 line-clamp-3 text-sm text-muted">{article.excerpt}</p>
                <Link
                  href={path(locale, `/blog/${article.handle}`)}
                  className="mt-4 inline-block text-sm text-gold"
                >
                  {t.readMore}
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
      <PageEnd locale={locale} />
    </>
  );
}

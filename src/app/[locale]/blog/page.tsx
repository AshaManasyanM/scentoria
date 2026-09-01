import { PageEnd } from "@/components/page-end";
import { SectionHeading } from "@/components/section-heading";
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
      <div className="mx-auto max-w-4xl px-4 py-16">
        <SectionHeading title={t.blogHero} subtitle={t.blogIndexSub} />
        <div className="space-y-12">
          {articles.map((article) => (
            <article key={article.handle} className="border-b border-line pb-10">
              <p className="text-xs uppercase tracking-[0.18em] text-muted">{article.date}</p>
              <h2 className="mt-3 font-serif text-3xl">
                <Link href={path(locale, `/blog/${article.handle}`)}>{article.title}</Link>
              </h2>
              <p className="mt-3 text-muted">{article.excerpt}</p>
              <Link
                href={path(locale, `/blog/${article.handle}`)}
                className="mt-4 inline-block text-xs uppercase tracking-[0.18em] text-gold"
              >
                {t.readMore}
              </Link>
            </article>
          ))}
        </div>
      </div>
      <PageEnd locale={locale} />
    </>
  );
}

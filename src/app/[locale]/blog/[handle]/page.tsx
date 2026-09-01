import { PageEnd } from "@/components/page-end";
import { localeFrom } from "@/lib/locale-params";
import { getArticles } from "@/lib/shopify/catalog";
import { notFound } from "next/navigation";

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ locale: string; handle: string }>;
}) {
  const locale = await localeFrom(params);
  const { handle } = await params;
  const articles = await getArticles();
  const article = articles.find((a) => a.handle === handle);
  if (!article) notFound();

  return (
    <>
      <article className="mx-auto max-w-3xl px-4 py-20">
        <p className="text-xs uppercase tracking-[0.18em] text-muted">{article.date}</p>
        <h1 className="mt-4 font-serif text-5xl">{article.title}</h1>
        {article.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={article.image} alt="" className="mt-10 w-full object-cover" />
        ) : null}
        <p className="mt-8 text-lg leading-relaxed text-muted whitespace-pre-line">{article.body}</p>
      </article>
      <PageEnd locale={locale} />
    </>
  );
}

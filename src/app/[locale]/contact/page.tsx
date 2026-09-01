import { PageEnd } from "@/components/page-end";
import { getDict } from "@/lib/i18n";
import { localeFrom } from "@/lib/locale-params";

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = await localeFrom(params);
  const t = getDict(locale);

  return (
    <>
      <div className="mx-auto max-w-xl px-4 py-20">
        <h1 className="font-serif text-5xl text-center">{t.contactHero}</h1>
        <p className="mt-4 text-center text-muted">{t.contactSub}</p>
        <form className="mt-12 space-y-4" action="mailto:hello@scentoria.am" method="get">
          <label className="block text-xs uppercase tracking-[0.16em] text-muted">
            {t.yourName}
            <input
              name="name"
              required
              className="mt-2 w-full border border-line bg-transparent px-3 py-3 text-sm text-fg outline-none focus:border-gold"
            />
          </label>
          <label className="block text-xs uppercase tracking-[0.16em] text-muted">
            {t.yourEmail}
            <input
              name="email"
              type="email"
              required
              className="mt-2 w-full border border-line bg-transparent px-3 py-3 text-sm text-fg outline-none focus:border-gold"
            />
          </label>
          <label className="block text-xs uppercase tracking-[0.16em] text-muted">
            {t.yourMessage}
            <textarea
              name="body"
              rows={5}
              required
              className="mt-2 w-full border border-line bg-transparent px-3 py-3 text-sm text-fg outline-none focus:border-gold"
            />
          </label>
          <button
            type="submit"
            className="w-full bg-gold py-3 text-sm uppercase tracking-[0.2em] text-bg"
          >
            {t.send}
          </button>
        </form>
      </div>
      <PageEnd locale={locale} />
    </>
  );
}

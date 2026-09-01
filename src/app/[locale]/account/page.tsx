import { shopAccountUrl } from "@/lib/shopify/config";
import { getDict } from "@/lib/i18n";
import { localeFrom } from "@/lib/locale-params";

export default async function AccountPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = await localeFrom(params);
  const t = getDict(locale);

  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <h1 className="font-serif text-5xl">{t.accountHero}</h1>
      <p className="mt-4 text-muted">{t.accountSub}</p>
      <a
        href={shopAccountUrl}
        className="mt-10 inline-block bg-gold px-10 py-3 text-sm uppercase tracking-[0.2em] text-bg"
      >
        {t.signIn}
      </a>
    </div>
  );
}

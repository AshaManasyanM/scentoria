import { getDict } from "@/lib/i18n";
import { getFaqs, getSectionVisibility } from "@/lib/shopify/catalog";
import type { Locale } from "@/lib/types";
import { Faq } from "./faq";
import { ShareForm } from "./share-form";

export async function PageEnd({ locale }: { locale: Locale }) {
  const t = getDict(locale);
  const sections = await getSectionVisibility();
  const shopFaqs = sections.faq ? await getFaqs() : [];
  const items = shopFaqs.length
    ? shopFaqs
    : t.faqs.map((item) => ({ question: item.q, answer: item.a }));

  if (!sections.share && !sections.faq) return null;

  return (
    <>
      {sections.share ? <ShareForm locale={locale} /> : null}
      {sections.faq ? <Faq locale={locale} items={items} /> : null}
    </>
  );
}

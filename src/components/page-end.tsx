import type { Locale } from "@/lib/types";
import { Faq } from "./faq";
import { ShareForm } from "./share-form";

export function PageEnd({ locale }: { locale: Locale }) {
  return (
    <>
      <ShareForm locale={locale} />
      <Faq locale={locale} />
    </>
  );
}

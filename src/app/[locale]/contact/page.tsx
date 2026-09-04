import { PageEnd } from "@/components/page-end";
import { localeFrom } from "@/lib/locale-params";

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = await localeFrom(params);

  return <PageEnd locale={locale} />;
}

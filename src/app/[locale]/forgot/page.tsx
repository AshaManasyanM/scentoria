import { ForgotForm } from "@/components/forgot-form";
import { localeFrom } from "@/lib/locale-params";

export default async function ForgotPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = await localeFrom(params);
  return <ForgotForm locale={locale} />;
}

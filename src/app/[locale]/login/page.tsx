import { AuthForm } from "@/components/auth-form";
import { localeFrom } from "@/lib/locale-params";

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = await localeFrom(params);
  return <AuthForm locale={locale} mode="signin" />;
}

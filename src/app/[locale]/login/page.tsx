import { AuthForm } from "@/components/auth-form";
import { localeFrom } from "@/lib/locale-params";
import { Suspense } from "react";

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = await localeFrom(params);
  return (
    <Suspense fallback={null}>
      <AuthForm locale={locale} mode="signin" />
    </Suspense>
  );
}

import { AccountProfile } from "@/components/account-profile";
import { AccountShell } from "@/components/account-shell";
import { RequireAuth } from "@/components/require-auth";
import { localeFrom } from "@/lib/locale-params";

export default async function AccountPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = await localeFrom(params);

  return (
    <RequireAuth locale={locale}>
      <AccountShell locale={locale}>
        <AccountProfile locale={locale} />
      </AccountShell>
    </RequireAuth>
  );
}

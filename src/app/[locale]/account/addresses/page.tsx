import { AccountAddresses } from "@/components/account-addresses";
import { AccountShell } from "@/components/account-shell";
import { localeFrom } from "@/lib/locale-params";

export default async function AddressesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = await localeFrom(params);

  return (
    <AccountShell locale={locale}>
      <AccountAddresses locale={locale} />
    </AccountShell>
  );
}

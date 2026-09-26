import { AccountOrders } from "@/components/account-orders";
import { AccountShell } from "@/components/account-shell";
import { localeFrom } from "@/lib/locale-params";

export default async function OrdersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = await localeFrom(params);

  return (
    <AccountShell locale={locale}>
      <AccountOrders locale={locale} />
    </AccountShell>
  );
}

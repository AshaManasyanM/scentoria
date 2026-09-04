import { AccountEmptyState, CartBagIcon } from "@/components/account-empty-state";
import { AccountShell } from "@/components/account-shell";
import { RequireAuth } from "@/components/require-auth";
import { getDict } from "@/lib/i18n";
import { localeFrom } from "@/lib/locale-params";
import { path } from "@/lib/path";

export default async function OrdersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = await localeFrom(params);
  const t = getDict(locale);

  return (
    <RequireAuth locale={locale}>
      <AccountShell locale={locale}>
        <AccountEmptyState
          icon={<CartBagIcon className="h-14 w-14" />}
          title={t.emptyOrders}
          hint={t.emptyOrdersHint}
          href={path(locale, "/products")}
        />
      </AccountShell>
    </RequireAuth>
  );
}

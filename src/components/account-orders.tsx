import { CartBagIcon } from "@/components/account-empty-state";
import { getDict } from "@/lib/i18n";
import { path } from "@/lib/path";
import type { Locale } from "@/lib/types";
import Link from "next/link";

export function AccountOrders({ locale }: { locale: Locale }) {
  const t = getDict(locale);

  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center px-4 py-10 text-center">
      <CartBagIcon className="h-14 w-14 text-[#9a9188]" />
      <h1 className="mt-5 text-lg font-medium text-[#111]">{t.emptyOrders}</h1>
      <Link href={path(locale, "/products")} className="mt-2 text-sm text-[#6b7280]">
        {t.emptyOrdersHint}
      </Link>
    </div>
  );
}

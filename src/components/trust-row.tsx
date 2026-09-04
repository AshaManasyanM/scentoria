import { getDict } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

export function TrustRow({ locale }: { locale: Locale }) {
  const t = getDict(locale);
  const items = [t.freeDelivery, t.original, t.payOnDelivery];
  return (
    <div className="grid grid-cols-3 gap-2 rounded-xl border border-line text-center">
      {items.map((item) => (
        <p
          key={item}
          className="px-2 py-3 text-[10px] uppercase tracking-[0.14em] text-gold md:text-xs"
        >
          {item}
        </p>
      ))}
    </div>
  );
}

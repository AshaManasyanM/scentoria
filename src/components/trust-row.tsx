import { getDict } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

const iconClass = "mx-auto h-10 w-14 text-[#1f7a4d]";

function AuthenticIcon() {
  return (
    <svg viewBox="0 0 64 40" className={iconClass} fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path d="M32 6 18 11.5v9.5c0 8.2 5.4 15.8 14 19.2 8.6-3.4 14-11 14-19.2v-9.5L32 6z" />
      <path d="m26 20 4 4 8-8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DeliveryIcon() {
  return (
    <svg viewBox="0 0 64 40" className={iconClass} fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path d="M4 28V12h32v16H4z" />
      <path d="M36 18h10l8 8v2H36V18z" />
      <circle cx="16" cy="30" r="4" />
      <circle cx="48" cy="30" r="4" />
      <path d="M10 20h16" />
    </svg>
  );
}

function OriginalIcon() {
  return (
    <svg viewBox="0 0 64 40" className={iconClass} fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <circle cx="32" cy="18" r="10" />
      <path d="M24 26l-4 10 12-6 12 6-4-10" />
      <path d="M28 18l3 3 6-6" />
    </svg>
  );
}

export function TrustRow({ locale }: { locale: Locale }) {
  const t = getDict(locale);
  const items = [
    { label: t.authenticShort, icon: <AuthenticIcon /> },
    { label: t.freeDelivery, icon: <DeliveryIcon /> },
    { label: t.original, icon: <OriginalIcon /> },
  ];
  return (
    <div className="grid grid-cols-3 gap-2 rounded-xl border border-[#e6e6e6] bg-white px-3 py-5 text-center">
      {items.map((item) => (
        <div key={item.label}>
          {item.icon}
          <p className="mt-2 text-[10px] font-medium uppercase tracking-[0.12em] text-[#1f7a4d] md:text-xs">{item.label}</p>
        </div>
      ))}
    </div>
  );
}

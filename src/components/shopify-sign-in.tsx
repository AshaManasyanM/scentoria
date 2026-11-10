"use client";

import { getDict } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

function ShopifyMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden className="shrink-0">
      <path
        fill="#95BF47"
        d="M15.34 3.3c-.1 0-.2.03-.28.08l-1.18.73a4.3 4.3 0 0 0-.5-1.04c-.53-.8-1.32-1.22-2.22-1.2h-.05c-.2-.24-.45-.44-.74-.58C9.8.98 9.1.98 8.5 1.3c-.1.05-.2.13-.28.21L7.8.2A.4.4 0 0 0 7.5.02a.4.4 0 0 0-.42.2L4.86 5.4l-2.2.68a.78.78 0 0 0-.55.75l1.1 13.42c.04.5.45.88.95.9l12.64.73c.52.03.97-.35 1.02-.87l1.3-13.58a.78.78 0 0 0-.62-.88l-2.5-.5-1.66-2.55Zm-4.9-1.2c.36 0 .68.14.95.42-.56.28-1.05.72-1.4 1.28l-1.1.68c.12-.98.72-1.98 1.55-2.38ZM8.7 1.8c.2-.1.42-.12.64-.08-.68.58-1.14 1.55-1.22 2.5L6.7 4.9c.2-1.28 1.05-2.68 2-3.1Zm6.86 3.65-9.98 3.08.78-4.7 1.55-.96.06.2a.4.4 0 0 0 .5.27c.17-.05.27-.23.22-.4l-.07-.23c.28-.12.66-.08.96.1.16.1.28.24.36.4l.08.2a.4.4 0 0 0 .5.24c.17-.06.27-.25.2-.42l-.08-.2c.52.05.96.4 1.12.9l.1.3a.4.4 0 1 0 .76-.24l-.1-.3c-.05-.16-.13-.3-.23-.43l1.37-.85.93 1.42Z"
      />
      <path
        fill="#5E8E3E"
        d="M15.34 3.3c-.1 0-.2.03-.28.08l-1.18.73c.1.2.18.42.24.65l1.66-.52-.44-.94Zm-2.75 2.4-.08-.2a1.6 1.6 0 0 0-.36-.4c-.3-.18-.68-.22-.96-.1l.07.23c.05.17-.05.35-.22.4a.4.4 0 0 1-.5-.27l-.06-.2-1.55.96-.2 1.2 4.02-1.24-.08-.24a1.4 1.4 0 0 0-.08-.14Z"
      />
    </svg>
  );
}

export function ShopifySignInButton({
  locale,
  next,
}: {
  locale: Locale;
  next?: string;
}) {
  const t = getDict(locale);
  const href = `/api/auth/shopify?locale=${locale}${next ? `&next=${encodeURIComponent(next)}` : ""}`;

  return (
    <a
      href={href}
      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[2px] border border-[#d8d0c4] bg-white px-4 text-xs font-semibold uppercase tracking-[0.12em] text-[#083534] transition hover:border-[#95BF47] hover:bg-[#f7fbf2]"
    >
      <ShopifyMark />
      {t.continueWithShopify}
    </a>
  );
}

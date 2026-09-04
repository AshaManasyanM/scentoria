"use client";

import { shopAccountUrl } from "@/lib/shopify/config";
import { getDict } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

export function CommunityModal({
  locale,
  open,
  onClose,
}: {
  locale: Locale;
  open: boolean;
  onClose: () => void;
}) {
  const t = getDict(locale);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        className="absolute inset-0 bg-black/60"
        aria-label={t.close}
        onClick={onClose}
      />
      <div className="absolute left-1/2 top-1/2 w-[min(92vw,420px)] -translate-x-1/2 -translate-y-1/2 border border-line bg-bg p-8 text-center">
        <p className="text-[11px] uppercase tracking-[0.28em] text-gold">{t.tagline}</p>
        <h2 className="mt-4 font-serif text-3xl">{t.joinCommunity}</h2>
        <p className="mt-4 text-sm text-muted">{t.communityHint}</p>
        <a
          href={shopAccountUrl}
          className="btn-green mt-8 block"
        >
          {t.signUp}
        </a>
        <a
          href={shopAccountUrl}
          className="mt-3 block border border-line py-3 text-sm uppercase tracking-[0.2em]"
        >
          {t.signIn}
        </a>
        <button type="button" onClick={onClose} className="mt-6 text-xs text-muted">
          {t.close}
        </button>
      </div>
    </div>
  );
}

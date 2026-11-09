"use client";

import { useProductSelection } from "@/components/product-selection";
import { useWishlist } from "@/components/wishlist-provider";
import { AUTH_EVENT, isLoggedIn, refreshSession } from "@/lib/auth";
import { getDict } from "@/lib/i18n";
import { path } from "@/lib/path";
import { showWishlistNotice } from "@/lib/wishlist-notice";
import type { Locale } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function ProductWishlistButton({ locale }: { locale: Locale }) {
  const t = getDict(locale);
  const router = useRouter();
  const { product } = useProductSelection();
  const { has, toggle } = useWishlist();
  const [ready, setReady] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const saved = ready && has(product.handle);
  const loginHref = path(locale, `/login?next=${encodeURIComponent(path(locale, `/products/${product.handle}`))}`);

  useEffect(() => {
    setReady(true);
    const sync = () => setLoggedIn(isLoggedIn());
    void refreshSession().then(sync);
    window.addEventListener(AUTH_EVENT, sync);
    return () => window.removeEventListener(AUTH_EVENT, sync);
  }, []);

  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? t.removeFromWishlist : t.addToWishlist}
      onClick={() => {
        if (!loggedIn) {
          router.push(loginHref);
          return;
        }
        const adding = !saved;
        toggle({
          handle: product.handle,
          title: product.title,
          brand: product.brand,
          image: product.images[0]?.url,
        });
        showWishlistNotice(adding ? t.addedToWishlist : t.removedFromWishlist);
      }}
      className="inline-flex items-center gap-2 rounded-full border border-[#d8d0c4] bg-white px-4 py-2.5 text-sm font-medium text-[#083534] transition hover:border-[#c5a059] hover:bg-[#f7f2ea]"
    >
      <svg viewBox="0 0 25 22" className="h-4 w-[18px]" aria-hidden>
        <path
          d="M22.5737 1.49585C19.8979 -0.784421 15.9185 -0.374265 13.4624 2.15991L12.5005 3.15112L11.5386 2.15991C9.0874 -0.374265 5.10303 -0.784421 2.42725 1.49585C-0.63916 4.11304 -0.800293 8.8103 1.94385 11.6472L11.3921 21.4031C12.0024 22.033 12.9937 22.033 13.604 21.4031L23.0522 11.6472C25.8013 8.8103 25.6401 4.11304 22.5737 1.49585Z"
          fill={saved ? "#c53030" : "#ffffff"}
          stroke={saved ? "#c53030" : "#083534"}
          strokeWidth="1.2"
        />
      </svg>
      <span>{saved ? t.removeFromWishlist : t.addToWishlist}</span>
    </button>
  );
}

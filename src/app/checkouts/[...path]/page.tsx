"use client";

import { useEffect, useState } from "react";
import { shopifyCheckoutHost } from "@/lib/shopify/config";

export default function ShopifyCheckoutsBridgePage() {
  const [stuck, setStuck] = useState(false);
  const host = shopifyCheckoutHost();

  useEffect(() => {
    const flag = "scentoria_checkouts_bridge";
    const hops = Number(sessionStorage.getItem(flag) || "0");
    if (hops >= 2) {
      setStuck(true);
      return;
    }
    sessionStorage.setItem(flag, String(hops + 1));
    const target = `https://${host}${window.location.pathname}${window.location.search}`;
    window.location.replace(target);
  }, [host]);

  if (stuck) {
    const target = `https://${host}${typeof window !== "undefined" ? window.location.pathname + window.location.search : ""}`;
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center gap-4 px-6 text-center text-[#083534]">
        <h1 className="font-serif text-2xl">Checkout could not open</h1>
        <p className="text-sm leading-6 text-[#083534]/80">
          Shopify is sending checkout back to this site. In Shopify Admin → Settings → Domains, set the
          primary domain to <strong>{host}</strong> (not scentoriaprive.com), then try again.
        </p>
        <a href={target} className="btn-green mt-2 inline-flex">
          Open Shopify checkout
        </a>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-lg items-center justify-center px-6 text-center text-[#083534]/80">
      Redirecting to checkout…
    </main>
  );
}

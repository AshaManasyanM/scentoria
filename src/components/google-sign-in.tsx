"use client";

import { connectGoogle, signInWithGoogleCredential } from "@/lib/auth";
import { useEffect, useRef } from "react";

type GoogleAccounts = {
  accounts: {
    id: {
      initialize: (config: {
        client_id: string;
        callback: (response: { credential?: string }) => void;
      }) => void;
      renderButton: (parent: HTMLElement, options: Record<string, string | number>) => void;
    };
  };
};

export function GoogleSignInButton({
  locale,
  mode = "signin",
  onSuccess,
  onFailure,
  onLinkRequired,
}: {
  locale: string;
  mode?: "signin" | "connect";
  onSuccess: () => void;
  onFailure: () => void;
  onLinkRequired?: () => void;
}) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";
  const host = useRef<HTMLDivElement>(null);
  const successRef = useRef(onSuccess);
  const failureRef = useRef(onFailure);
  const linkRef = useRef(onLinkRequired);
  successRef.current = onSuccess;
  failureRef.current = onFailure;
  linkRef.current = onLinkRequired;

  useEffect(() => {
    if (!clientId || !host.current) return;
    let cancelled = false;
    let renderedWidth = 0;
    const render = () => {
      const google = (window as Window & { google?: GoogleAccounts }).google;
      if (!google || !host.current || cancelled) return;
      const measured = Math.floor(host.current.getBoundingClientRect().width);
      const width = Math.min(400, Math.max(240, measured || 240));
      if (renderedWidth === width && host.current.childElementCount > 0) return;
      renderedWidth = width;
      host.current.replaceChildren();
      google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          const credential = response.credential ?? "";
          if (!credential) {
            failureRef.current();
            return;
          }
          const finish =
            mode === "connect" ? connectGoogle(credential).then((ok) => ({ ok, reason: "google" as const })) : signInWithGoogleCredential(credential);
          void finish.then((result) => {
            if (result.ok) successRef.current();
            else if (result.reason === "link") linkRef.current?.();
            else failureRef.current();
          });
        },
      });
      google.accounts.id.renderButton(host.current, {
        type: "standard",
        theme: "outline",
        size: "medium",
        text: "continue_with",
        shape: "rectangular",
        logo_alignment: "center",
        width,
        locale,
      });
      const box = host.current;
      const fit = () => {
        const frame = box.querySelector("iframe");
        if (!frame || cancelled) return;
        if (!frame.dataset.gsiHeight) {
          const measured = frame.offsetHeight;
          if (!measured || measured > 80) return;
          frame.dataset.gsiHeight = String(measured);
        }
        const naturalHeight = Number(frame.dataset.gsiHeight);
        const innerWidth = box.clientWidth;
        const innerHeight = box.clientHeight;
        if (!naturalHeight || !innerWidth || !innerHeight) return;
        const bleed = 8;
        frame.style.position = "absolute";
        frame.style.width = `${width}px`;
        frame.style.height = `${naturalHeight}px`;
        frame.style.maxWidth = "none";
        frame.style.border = "0";
        frame.style.transformOrigin = "0 0";
        frame.style.left = `${-bleed}px`;
        frame.style.top = `${-bleed}px`;
        frame.style.transform = `scale(${(innerWidth + bleed * 2) / width}, ${(innerHeight + bleed * 2) / naturalHeight})`;
      };
      fit();
      requestAnimationFrame(fit);
    };
    const googleLocale = locale === "hy" ? "hy" : "en";
    const src = `https://accounts.google.com/gsi/client?hl=${googleLocale}`;
    const existing = document.querySelector<HTMLScriptElement>('script[data-scentoria-gsi="1"]');
    if (existing && !existing.src.includes(`hl=${googleLocale}`)) {
      existing.remove();
      delete (window as Window & { google?: GoogleAccounts }).google;
    }
    const current = document.querySelector<HTMLScriptElement>('script[data-scentoria-gsi="1"]');
    if (current) {
      if ((window as Window & { google?: GoogleAccounts }).google) render();
      else current.addEventListener("load", render, { once: true });
    } else {
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.dataset.scentoriaGsi = "1";
      script.addEventListener("load", render, { once: true });
      document.head.appendChild(script);
    }
    const observed = host.current;
    const observer = new ResizeObserver(() => render());
    observer.observe(observed);
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [clientId, locale, mode]);

  if (!clientId) return null;
  return (
    <div
      ref={host}
      className="relative box-border h-11 w-full overflow-hidden rounded-[2px] border border-[#d8d0c4] bg-white [&>div]:!block [&>div]:!h-full [&>div]:!w-full [&>div>div]:!flex [&>div>div]:!h-full [&>div>div]:!w-full [&>div>div]:!items-center [&_[role=button]]:!box-border [&_[role=button]]:!h-11 [&_[role=button]]:!w-full [&_[role=button]]:!max-w-none [&_[role=button]]:!rounded-none [&_[role=button]]:!border-0 [&_[role=button]]:!shadow-none"
    />
  );
}

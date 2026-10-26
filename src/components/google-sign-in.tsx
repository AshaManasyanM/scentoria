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
      const place = () => {
        const frame = box.querySelector("iframe");
        if (!frame || cancelled || box.querySelector("[role=button]")) return;
        const spacer = frame.previousElementSibling;
        if (spacer instanceof HTMLElement) spacer.style.display = "none";
        frame.style.position = "absolute";
        frame.style.left = "0";
        frame.style.top = "0";
        frame.style.width = "100%";
        frame.style.height = "100%";
        frame.style.maxWidth = "none";
        frame.style.border = "0";
      };
      place();
      const frames = new MutationObserver(place);
      frames.observe(box, { childList: true, subtree: true });
      window.setTimeout(() => frames.disconnect(), 4000);
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
      className="relative box-border h-11 w-full overflow-hidden rounded-[2px] border border-[#d8d0c4] bg-white [&>div]:!relative [&>div]:!block [&>div]:!h-full [&>div]:!w-full [&:not(:has([role=button]))>div>div]:!hidden [&:not(:has([role=button]))_iframe]:!absolute [&:not(:has([role=button]))_iframe]:!inset-0 [&:not(:has([role=button]))_iframe]:!h-full [&:not(:has([role=button]))_iframe]:!w-full [&:not(:has([role=button]))_iframe]:!max-w-none [&:not(:has([role=button]))_iframe]:!border-0 [&_[role=button]]:!box-border [&_[role=button]]:!flex [&_[role=button]]:!h-11 [&_[role=button]]:!w-full [&_[role=button]]:!max-w-none [&_[role=button]]:!items-center [&_[role=button]]:!justify-center [&_[role=button]]:!rounded-none [&_[role=button]]:!border-0 [&_[role=button]]:!bg-white [&_[role=button]]:!text-[14px] [&_[role=button]]:!font-medium [&_[role=button]]:!text-[#3c4043] [&_[role=button]]:!shadow-none"
    />
  );
}

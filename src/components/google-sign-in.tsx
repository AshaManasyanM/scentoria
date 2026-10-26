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

const GOOGLE_BUTTON_MIN_WIDTH = 240;
const GOOGLE_BUTTON_MAX_WIDTH = 400;

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
      const box = host.current;
      if (!google || !box || cancelled) return;
      const measured = Math.floor(box.getBoundingClientRect().width);
      const width = Math.min(GOOGLE_BUTTON_MAX_WIDTH, Math.max(GOOGLE_BUTTON_MIN_WIDTH, measured || GOOGLE_BUTTON_MIN_WIDTH));
      if (renderedWidth === width && box.childElementCount > 0) return;
      renderedWidth = width;
      box.replaceChildren();
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
      google.accounts.id.renderButton(box, {
        type: "standard",
        theme: "outline",
        size: "medium",
        text: "signin_with",
        shape: "rectangular",
        logo_alignment: "center",
        width,
        locale,
      });
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
      className="flex w-full justify-center"
    />
  );
}

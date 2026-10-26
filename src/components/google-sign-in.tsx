"use client";

import { connectGoogle, signInWithGoogleCredential } from "@/lib/auth";
import { useEffect, useRef, type MouseEvent } from "react";

type GoogleNotification = {
  isNotDisplayed: () => boolean;
  isSkippedMoment: () => boolean;
};

type GoogleAccounts = {
  accounts: {
    id: {
      initialize: (config: {
        client_id: string;
        callback: (response: { credential?: string }) => void;
      }) => void;
      renderButton: (parent: HTMLElement, options: Record<string, string | number>) => void;
      prompt: (moment?: (notification: GoogleNotification) => void) => void;
    };
  };
};

const GOOGLE_BUTTON_MIN_WIDTH = 240;
const GOOGLE_BUTTON_MAX_WIDTH = 400;

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" className="shrink-0">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" />
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" />
    </svg>
  );
}

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

  function openGoogle() {
    const box = host.current;
    const official = box?.querySelector<HTMLElement>('[role="button"]');
    if (official) {
      official.click();
      return;
    }
    const google = (window as Window & { google?: GoogleAccounts }).google;
    google?.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) failureRef.current();
    });
  }

  function coverClick(event: MouseEvent<HTMLDivElement>) {
    const target = event.target;
    if (target instanceof HTMLIFrameElement) return;
    const official = host.current?.querySelector<HTMLElement>('[role="button"]');
    if (!official || target === official || (target instanceof Node && official.contains(target))) return;
    official.click();
  }

  if (!clientId) return null;
  return (
    <div className="group relative w-full">
      <button
        type="button"
        onClick={openGoogle}
        className="inline-flex h-11 w-full items-center justify-center gap-3 rounded-[2px] border border-[#747775] bg-white px-3 text-[14px] font-medium leading-5 text-[#1f1f1f] transition-colors group-hover:bg-[#f8f9fa] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#747775]"
      >
        <GoogleMark />
        Sign in with Google
      </button>
      <div
        ref={host}
        aria-hidden="true"
        onClick={coverClick}
        className="absolute inset-y-0 left-1/2 z-10 w-full max-w-[400px] -translate-x-1/2 overflow-hidden opacity-0"
      />
    </div>
  );
}

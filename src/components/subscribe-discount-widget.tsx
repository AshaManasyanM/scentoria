"use client";

import { useCart } from "@/components/cart-provider";
import { getDict } from "@/lib/i18n";
import type { Locale } from "@/lib/types";
import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "scentoria_subscribe_widget_v3";
const CODE_KEY = "scentoria_subscribe_code";
const DISCOUNT_CODE = (process.env.NEXT_PUBLIC_SUBSCRIBE_DISCOUNT_CODE || "WELCOME10").trim();

type Phase = "form" | "sent" | "code";
type Mode = "hidden" | "modal" | "corner";

export function SubscribeDiscountWidget({ locale }: { locale: Locale }) {
  const t = getDict(locale);
  const { applyPromo } = useCart();
  const appliedRef = useRef("");
  const [mode, setMode] = useState<Mode>("hidden");
  const [email, setEmail] = useState("");
  const [phase, setPhase] = useState<Phase>("form");
  const [code, setCode] = useState(DISCOUNT_CODE);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const autoApplyCode = (nextCode: string) => {
    const normalized = nextCode.trim();
    if (!normalized || appliedRef.current === normalized) return;
    appliedRef.current = normalized;
    try {
      localStorage.setItem(CODE_KEY, normalized);
    } catch {
      // ignore
    }
    void applyPromo(normalized);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const welcome = params.get("welcome");
    if (welcome) {
      setCode(welcome);
      setPhase("code");
      setMode("modal");
      autoApplyCode(welcome);
      try {
        localStorage.setItem(STORAGE_KEY, "subscribed");
      } catch {
        // ignore
      }
      return;
    }

    let saved = "";
    let savedCode = "";
    try {
      saved = localStorage.getItem(STORAGE_KEY) || "";
      savedCode = localStorage.getItem(CODE_KEY) || "";
    } catch {
      saved = "";
      savedCode = "";
    }

    if (savedCode) {
      setCode(savedCode);
      autoApplyCode(savedCode);
    }

    if (saved === "subscribed") return;
    if (saved === "corner" || saved === "dismissed") {
      setMode("corner");
      return;
    }

    const timer = window.setTimeout(() => setMode("modal"), 2500);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- apply once on mount / welcome link
  }, []);

  const persist = (value: string) => {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // ignore
    }
  };

  const closeToCorner = () => {
    setMode("corner");
    if (phase === "form") persist("corner");
    else persist("subscribed");
  };

  const openModal = () => setMode("modal");

  const finishClose = () => {
    setMode("hidden");
    persist("subscribed");
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, locale }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        code?: string;
        emailed?: boolean;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        setError(data.error === "rate" ? t.subscribeRateLimited : t.subscribeFailed);
        return;
      }
      const nextCode = data.code || DISCOUNT_CODE;
      setCode(nextCode);
      setPhase(data.emailed ? "sent" : "code");
      persist("subscribed");
      autoApplyCode(nextCode);
    } catch {
      setError(t.subscribeFailed);
    } finally {
      setBusy(false);
    }
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  if (mode === "hidden") return null;

  if (mode === "corner") {
    return (
      <button
        type="button"
        onClick={openModal}
        className="fixed bottom-5 right-5 z-[60] max-w-[160px] rounded-2xl border border-[#d8d0c4] bg-[#083534] px-4 py-3 text-left shadow-[0_12px_30px_rgba(8,53,52,0.28)] transition hover:bg-[#0e4544] md:bottom-8 md:right-8"
      >
        <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-[#c5a059]">
          {t.subscribeEyebrow}
        </span>
        <span className="mt-1 block text-sm font-medium leading-5 text-[#f7f2ea]">{t.subscribeCornerCta}</span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        aria-label={t.close}
        className="absolute inset-0 bg-[#083534]/45"
        onClick={closeToCorner}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="subscribe-discount-title"
        className="relative w-full max-w-[420px] overflow-hidden rounded-2xl border border-[#d8d0c4] bg-[#f7f2ea] shadow-[0_24px_60px_rgba(8,53,52,0.28)]"
      >
        <div className="h-1.5 bg-gradient-to-r from-[#c5a059] via-[#083534] to-[#c5a059]" />
        <button
          type="button"
          onClick={closeToCorner}
          className="absolute right-3 top-4 flex h-8 w-8 items-center justify-center text-[#083534]/70 hover:text-[#083534]"
          aria-label={t.close}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        <div className="px-6 pb-6 pt-7 md:px-7">
          {phase === "form" ? (
            <>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#c5a059]">
                {t.subscribeEyebrow}
              </p>
              <h2 id="subscribe-discount-title" className="mt-2 font-serif text-[28px] leading-tight text-[#083534]">
                {t.subscribeTitle}
              </h2>
              <p className="mt-3 text-sm leading-6 text-[#5c564f]">{t.subscribeBody}</p>
              <form onSubmit={submit} className="mt-5 space-y-3">
                <label className="block">
                  <span className="sr-only">{t.email}</span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder={t.enterEmail}
                    className="h-12 w-full rounded-xl border border-[#d8d0c4] bg-white px-4 text-sm text-[#083534] outline-none placeholder:text-[#9a9188] focus:border-[#c5a059]"
                  />
                </label>
                {error ? <p className="text-xs text-[#8b1e1e]">{error}</p> : null}
                <button type="submit" disabled={busy} className="btn-green w-full disabled:opacity-60">
                  {busy ? t.subscribeSending : t.subscribeCta}
                </button>
              </form>
              <p className="mt-3 text-center text-[11px] leading-5 text-[#8a8178]">{t.subscribeHint}</p>
            </>
          ) : null}

          {phase === "sent" ? (
            <>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#c5a059]">
                {t.subscribeSuccessEyebrow}
              </p>
              <h2 id="subscribe-discount-title" className="mt-2 font-serif text-[28px] leading-tight text-[#083534]">
                {t.subscribeCheckEmailTitle}
              </h2>
              <p className="mt-3 text-sm leading-6 text-[#5c564f]">{t.subscribeCheckEmailBody}</p>
              <button type="button" onClick={finishClose} className="btn-green mt-5 w-full">
                {t.subscribeContinue}
              </button>
            </>
          ) : null}

          {phase === "code" ? (
            <>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#c5a059]">
                {t.subscribeSuccessEyebrow}
              </p>
              <h2 id="subscribe-discount-title" className="mt-2 font-serif text-[28px] leading-tight text-[#083534]">
                {t.subscribeSuccessTitle}
              </h2>
              <p className="mt-3 text-sm leading-6 text-[#5c564f]">{t.subscribeSuccessBody}</p>
              <div className="mt-5 flex items-center gap-2 rounded-xl border border-[#d8d0c4] bg-white p-2">
                <p className="min-w-0 flex-1 truncate px-3 text-center text-lg font-semibold tracking-[0.12em] text-[#083534]">
                  {code}
                </p>
                <button
                  type="button"
                  onClick={copyCode}
                  className="h-11 shrink-0 rounded-lg bg-[#083534] px-4 text-xs font-semibold uppercase tracking-[0.08em] text-[#f7f2ea]"
                >
                  {copied ? t.copied : t.copyCode}
                </button>
              </div>
              <p className="mt-3 text-center text-[12px] leading-5 text-[#6b635c]">{t.subscribeCheckoutHint}</p>
              <button type="button" onClick={finishClose} className="btn-green mt-5 w-full">
                {t.subscribeContinue}
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

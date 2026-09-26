"use client";

import { AUTH_EVENT, isLoggedIn, refreshSession } from "@/lib/auth";
import { getDict } from "@/lib/i18n";
import { path } from "@/lib/path";
import type { Locale } from "@/lib/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function ForgotForm({ locale }: { locale: Locale }) {
  const t = getDict(locale);
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    void refreshSession()
      .catch(() => null)
      .then(() => {
        if (isLoggedIn()) {
          router.replace(path(locale, "/account"));
          return;
        }
        setReady(true);
      });
    const sync = () => {
      if (isLoggedIn()) router.replace(path(locale, "/account"));
    };
    window.addEventListener(AUTH_EVENT, sync);
    return () => window.removeEventListener(AUTH_EVENT, sync);
  }, [locale, router]);

  if (!ready) return null;

  return (
    <section className="bg-[#f7f2ea] px-4 py-12 md:px-8 md:py-20">
      <div className="mx-auto grid max-w-[1080px] items-start gap-10 md:grid-cols-[0.9fr_1.1fr] md:gap-16">
        <div className="md:pt-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#c5a059]">{t.account}</p>
          <h1 className="mt-4 font-serif text-[32px] font-medium leading-[1.15] text-[#083534] md:text-[clamp(40px,4vw,52px)]">
            {t.forgotPassword}
          </h1>
          <p className="mt-4 max-w-md text-[15px] leading-7 text-[#083534]/80">{t.accountDashboardHint}</p>
        </div>

        <form
          className="rounded-md border border-[#d8d0c4] bg-white p-6 md:p-8"
          onSubmit={(event) => {
            event.preventDefault();
            if (!email.trim()) return;
            setSent(true);
          }}
        >
          <label className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#083534]">
            {t.yourEmail}
            <input
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={t.enterEmail}
              autoComplete="email"
              className="mt-2 h-11 w-full rounded-sm border border-[#d8d0c4] bg-[#f7f2ea] px-3 text-sm text-[#083534] outline-none placeholder:text-[#083534]/45 focus:border-[#c5a059]"
            />
          </label>
          <button
            type="submit"
            className="mt-6 inline-flex w-full items-center justify-center rounded-[2px] bg-[#c5a059] px-8 py-[14px] text-xs font-semibold uppercase tracking-[0.12em] text-[#083534]"
          >
            {t.send}
          </button>
          {sent ? <p className="mt-4 text-sm text-[#083534]">{t.changesSaved}</p> : null}
          <p className="mt-6 text-sm leading-6 text-[#083534]/80">
            <Link
              href={path(locale, "/login")}
              className="font-semibold text-[#083534] underline decoration-[#c5a059] underline-offset-4"
            >
              {t.loginTitle}
            </Link>
          </p>
        </form>
      </div>
    </section>
  );
}

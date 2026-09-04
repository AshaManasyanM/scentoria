"use client";

import { AUTH_EVENT, isLoggedIn } from "@/lib/auth";
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
    if (isLoggedIn()) {
      router.replace(path(locale, "/account"));
      return;
    }
    setReady(true);
    const sync = () => {
      if (isLoggedIn()) router.replace(path(locale, "/account"));
    };
    window.addEventListener(AUTH_EVENT, sync);
    return () => window.removeEventListener(AUTH_EVENT, sync);
  }, [locale, router]);

  if (!ready) return null;

  return (
    <div className="flex justify-center px-4 py-[75px]">
      <div
        className="w-full max-w-[448px] rounded-lg bg-white p-6"
        style={{
          boxShadow:
            "rgba(24, 24, 27, 0.1) 0px 4px 8px 0px, rgba(24, 24, 27, 0.3) 0px 0px 1px 0px",
        }}
      >
        <div className="px-6">
          <h1 className="text-center font-serif text-[30px] font-semibold leading-none text-zinc-700">
            {t.forgotPassword}
          </h1>
          <form
            className="mt-6 space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (!email.trim()) return;
              setSent(true);
            }}
          >
            <label className="block font-[family-name:var(--font-tommy)] text-sm font-medium text-fg">
              {t.yourEmail}
              <input
                required
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={t.enterEmail}
                className="mt-1 h-10 w-full rounded-[4px] border-0 border-b border-line bg-white px-3 text-sm font-[family-name:var(--font-tommy)] text-fg outline-none placeholder:text-zinc-400 focus:border-gold"
              />
            </label>
            <button
              type="submit"
              className="h-11 w-full rounded-[10px] bg-gold-2 font-[family-name:var(--font-tommy)] text-sm font-medium text-white hover:bg-gold"
            >
              {t.send}
            </button>
          </form>
          {sent ? (
            <p className="mt-4 font-[family-name:var(--font-tommy)] text-sm text-gold">{t.changesSaved}</p>
          ) : null}
          <Link
            href={path(locale, "/login")}
            className="mt-6 inline-block text-sm font-medium text-[#3b82f6]"
          >
            {t.loginTitle}
          </Link>
        </div>
      </div>
    </div>
  );
}

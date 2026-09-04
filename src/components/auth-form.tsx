"use client";

import { AUTH_EVENT, isLoggedIn, saveProfile } from "@/lib/auth";
import { getDict } from "@/lib/i18n";
import { path } from "@/lib/path";
import type { Locale } from "@/lib/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const fieldClass =
  "mt-1 h-10 w-full rounded-[4px] border-0 border-b border-line bg-white px-3 text-sm font-[family-name:var(--font-tommy)] text-fg outline-none placeholder:text-zinc-400 focus:border-gold";
const labelClass = "block font-[family-name:var(--font-tommy)] text-sm font-medium text-fg";

function FacebookIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M9.5 3H12V0H9.5C7.57 0 6 1.57 6 3.5V5H4v3h2v8h3V8h2.5l.5-3H9V3.5c0-.271.229-.5.5-.5z" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 488 512" fill="currentColor" aria-hidden>
      <path d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z" />
    </svg>
  );
}

export function AuthForm({
  locale,
  mode,
}: {
  locale: Locale;
  mode: "signin" | "signup";
}) {
  const t = getDict(locale);
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const sync = () => {
      if (isLoggedIn()) {
        router.replace(path(locale, "/account"));
        return;
      }
      setReady(true);
    };
    sync();
    window.addEventListener(AUTH_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(AUTH_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [locale, router]);

  if (!ready) return null;

  const isSignup = mode === "signup";

  function submit() {
    if (!email.trim()) return;
    saveProfile({ name: name.trim(), email: email.trim() });
    router.push(path(locale, "/account"));
  }

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
            {isSignup ? t.createAnAccount : t.loginTitle}
          </h1>
          <form
            className="mt-6 space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              submit();
            }}
          >
            {isSignup ? (
              <label className={labelClass}>
                {t.username}
                <input
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder={t.username}
                  className={fieldClass}
                />
              </label>
            ) : null}
            <label className={labelClass}>
              {t.yourEmail}
              <input
                required
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={isSignup ? t.yourEmail : t.enterEmail}
                className={fieldClass}
              />
            </label>
            <label className={labelClass}>
              {t.password}
              <input
                required
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={isSignup ? t.newPassword : t.enterPassword}
                className={fieldClass}
              />
            </label>
            {!isSignup ? (
              <Link
                href={path(locale, "/forgot")}
                className="mt-4 block font-[family-name:var(--font-tommy)] text-base text-fg"
              >
                {t.forgotPassword}
              </Link>
            ) : null}
            <button
              type="submit"
              className="h-11 w-full rounded-[10px] bg-gold-2 font-[family-name:var(--font-tommy)] text-sm font-medium text-white hover:bg-gold"
            >
              {isSignup ? t.signUp : t.signIn}
            </button>
          </form>

          {!isSignup ? (
            <div className="mt-4 flex gap-2.5">
              <button
                type="button"
                aria-label="Sign in with Facebook"
                className="inline-flex h-10 items-center gap-2 rounded-[4px] bg-[#1877F2] px-2 font-[family-name:var(--font-tommy)] text-sm text-white"
              >
                {t.facebook}
                <FacebookIcon />
              </button>
              <button
                type="button"
                aria-label="Sign in with Google"
                className="inline-flex h-10 items-center gap-2 rounded-[4px] bg-[#DB4437] px-2 font-[family-name:var(--font-tommy)] text-sm text-white"
              >
                {t.google}
                <GoogleIcon />
              </button>
            </div>
          ) : null}

          <div className="mt-6 font-[family-name:var(--font-tommy)] text-base text-fg">
            <p>{isSignup ? t.haveAccount : t.needAccount}</p>
            <Link
              href={path(locale, isSignup ? "/login" : "/signup")}
              className="mt-1 inline-block text-sm font-medium text-[#3b82f6]"
            >
              {isSignup ? t.loginTitle : t.createAnAccount}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

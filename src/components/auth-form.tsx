"use client";

import { AUTH_EVENT, isLoggedIn, refreshSession, signInWithEmail, signInWithGoogle, signUp } from "@/lib/auth";
import { requestGoogleProfile } from "@/lib/google-sign-in";
import { getDict } from "@/lib/i18n";
import { path } from "@/lib/path";
import type { Locale } from "@/lib/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const labelClass = "block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#083534]";
const fieldClass =
  "mt-2 h-11 w-full rounded-sm border border-[#d8d0c4] bg-[#f7f2ea] px-3 text-sm text-[#083534] outline-none placeholder:text-[#083534]/45 focus:border-[#c5a059]";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.97 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.05l3.01-2.33z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z" />
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
  const [error, setError] = useState("");

  useEffect(() => {
    const sync = () => {
      if (isLoggedIn()) {
        router.replace(path(locale, "/account"));
        return;
      }
      setReady(true);
    };
    void refreshSession().then(sync).catch(() => setReady(true));
    window.addEventListener(AUTH_EVENT, sync);
    return () => window.removeEventListener(AUTH_EVENT, sync);
  }, [locale, router]);

  if (!ready) return null;

  const isSignup = mode === "signup";

  async function submit() {
    if (!email.trim() || !password) return;
    const result = isSignup ? await signUp({ name, email, password }) : await signInWithEmail({ email, password });
    if (!result.ok) {
      setError(result.reason === "exists" ? t.accountExists : t.wrongPassword);
      return;
    }
    router.push(path(locale, "/account"));
  }

  async function continueWithGoogle() {
    setError("");
    try {
      const profile = await requestGoogleProfile();
      const result = await signInWithGoogle(profile);
      if (!result.ok) {
        setError(t.googleSignInFailed);
        return;
      }
      router.push(path(locale, "/account"));
    } catch {
      setError(t.googleSignInFailed);
    }
  }

  return (
    <section className="bg-[#f7f2ea] px-4 py-12 md:px-8 md:py-20">
      <div className="mx-auto grid max-w-[1080px] items-start gap-10 md:grid-cols-[0.9fr_1.1fr] md:gap-16">
        <div className="md:pt-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#c5a059]">{t.account}</p>
          <h1 className="mt-4 font-serif text-[32px] font-medium leading-[1.15] text-[#083534] md:text-[clamp(40px,4vw,52px)]">
            {isSignup ? t.createAnAccount : t.loginTitle}
          </h1>
          <p className="mt-4 max-w-md text-[15px] leading-7 text-[#083534]/80">{t.accountDashboardHint}</p>
        </div>

        <form
          className="rounded-md border border-[#d8d0c4] bg-white p-6 md:p-8"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <div className="space-y-5">
            {isSignup ? (
              <label className={labelClass}>
                {t.fullName}
                <input
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder={t.enterFullName}
                  autoComplete="name"
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
                placeholder={t.enterEmail}
                autoComplete="email"
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
                autoComplete={isSignup ? "new-password" : "current-password"}
                className={fieldClass}
              />
            </label>
          </div>

          {!isSignup ? (
            <Link
              href={path(locale, "/forgot")}
              className="mt-4 inline-block text-sm text-[#083534] underline decoration-[#c5a059] underline-offset-4"
            >
              {t.forgotPassword}
            </Link>
          ) : null}

          {error ? <p className="mt-4 text-sm text-[#b3413a]">{error}</p> : null}

          <button
            type="submit"
            className="mt-6 inline-flex w-full items-center justify-center rounded-[2px] bg-[#c5a059] px-8 py-[14px] text-xs font-semibold uppercase tracking-[0.12em] text-[#083534]"
          >
            {isSignup ? t.signUp : t.signIn}
          </button>

          {!isSignup ? (
            <>
              <div className="my-6 h-px bg-[#d8d0c4]" />
              <button
                type="button"
                onClick={() => void continueWithGoogle()}
                className="inline-flex w-full items-center justify-center gap-3 rounded-[2px] border border-[#083534] px-8 py-[14px] text-xs font-semibold uppercase tracking-[0.12em] text-[#083534]"
              >
                <GoogleIcon />
                {t.google}
              </button>
            </>
          ) : null}

          <p className="mt-6 text-sm leading-6 text-[#083534]/80">
            {isSignup ? t.haveAccount : t.needAccount}{" "}
            <Link
              href={path(locale, isSignup ? "/login" : "/signup")}
              className="font-semibold text-[#083534] underline decoration-[#c5a059] underline-offset-4"
            >
              {isSignup ? t.loginTitle : t.createAnAccount}
            </Link>
          </p>
        </form>
      </div>
    </section>
  );
}

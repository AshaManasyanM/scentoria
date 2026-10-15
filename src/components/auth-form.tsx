"use client";

import { GoogleSignInButton } from "@/components/google-sign-in";
import { AUTH_EVENT, isLoggedIn, refreshSession, signInWithEmail, signUp } from "@/lib/auth";
import { getDict } from "@/lib/i18n";
import { path } from "@/lib/path";
import type { Locale } from "@/lib/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const labelClass = "block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#083534]";
const fieldClass =
  "mt-2 h-11 w-full rounded-sm border border-[#d8d0c4] bg-[#f7f2ea] px-3 text-sm text-[#083534] outline-none placeholder:text-[#083534]/45 focus:border-[#c5a059]";

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
  const [remember, setRemember] = useState(false);
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
    if (isSignup) {
      const created = await signUp({ name, email, password });
      if (!created.ok) {
        setError(
          created.reason === "short"
            ? t.passwordTooShort
            : created.reason === "rate"
              ? t.tooManyAttempts
              : created.reason === "exists"
                ? t.accountExists
                : t.wrongPassword,
        );
        return;
      }
      router.push(path(locale, "/login"));
      return;
    }
    const result = await signInWithEmail({ email, password, remember });
    if (!result.ok) {
      setError(result.reason === "rate" ? t.tooManyAttempts : t.wrongPassword);
      return;
    }
    router.push(path(locale, "/account"));
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
            <div className="mt-4 flex items-center justify-between gap-4">
              <label className="flex items-center gap-2 text-sm text-[#083534]">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(event) => setRemember(event.target.checked)}
                  className="h-4 w-4 accent-[#083534]"
                />
                {t.rememberMe}
              </label>
              <Link
                href={path(locale, "/forgot")}
                className="text-sm text-[#083534] underline decoration-[#c5a059] underline-offset-4"
              >
                {t.forgotPassword}
              </Link>
            </div>
          ) : null}

          {error ? <p className="mt-4 text-sm text-[#b3413a]">{error}</p> : null}

          <button
            type="submit"
            className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-[2px] bg-[#c5a059] px-8 text-xs font-semibold uppercase tracking-[0.12em] text-[#083534] transition-colors hover:bg-[#a9884a]"
          >
            {isSignup ? t.signUp : t.signIn}
          </button>

          {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? (
            <>
              <div className="mt-5 flex items-center gap-4">
                <span className="h-px flex-1 bg-[#d8d0c4]" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#083534]/45">{t.or}</span>
                <span className="h-px flex-1 bg-[#d8d0c4]" />
              </div>
              <div className="mt-5">
                <GoogleSignInButton
                  locale={locale}
                  onSuccess={() => router.push(path(locale, "/account"))}
                  onFailure={() => setError(t.googleSignInFailed)}
                  onLinkRequired={() => setError(t.googleLinkRequired)}
                />
              </div>
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

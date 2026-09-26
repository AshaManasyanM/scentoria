"use client";

import { AUTH_EVENT, clearProfile, isLoggedIn, loadProfile, refreshSession, saveProfile, type Profile } from "@/lib/auth";
import { getDict } from "@/lib/i18n";
import { path } from "@/lib/path";
import type { Locale } from "@/lib/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const fieldClass =
  "mt-2 w-full rounded-md border border-[#e4e4e7] bg-white px-3 py-2.5 text-sm text-[#111] outline-none focus:border-[#083534]";

export function AccountProfile({ locale }: { locale: Locale }) {
  const t = getDict(locale);
  const router = useRouter();
  const [profile, setProfile] = useState<Profile>({ name: "", email: "", provider: "email" });
  const [password, setPassword] = useState("");
  const [saved, setSaved] = useState(false);
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    const sync = () => {
      setProfile(loadProfile());
      setSignedIn(isLoggedIn());
      setReady(true);
    };
    void refreshSession().then(sync);
    window.addEventListener(AUTH_EVENT, sync);
    return () => window.removeEventListener(AUTH_EVENT, sync);
  }, []);

  if (!ready) return null;

  if (!signedIn) {
    return (
      <div className="max-w-[760px]">
        <h1 className="text-[22px] font-medium text-[#111]">{t.profile}</h1>
        <p className="mt-3 max-w-md text-sm leading-6 text-[#6b7280]">{t.accountDashboardHint}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={path(locale, "/login")}
            className="inline-flex rounded-md bg-[#111] px-4 py-2.5 text-sm font-medium text-white"
          >
            {t.signIn}
          </Link>
          <Link
            href={path(locale, "/signup")}
            className="inline-flex rounded-md border border-[#e4e4e7] px-4 py-2.5 text-sm font-medium text-[#111]"
          >
            {t.createAnAccount}
          </Link>
        </div>
      </div>
    );
  }

  const initial = profile.name.trim().charAt(0).toUpperCase() || "S";
  const googleAccount = profile.provider === "google";

  return (
    <div className="max-w-[760px]">
      <div className="flex items-center gap-4">
        {profile.image ? (
          <img src={profile.image} alt="" className="h-12 w-12 shrink-0 rounded-full object-cover" />
        ) : (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#ece7e1] text-lg font-medium text-[#083534]">
            {initial}
          </div>
        )}
        <div>
          <p className="text-lg font-semibold text-[#111]">
            {t.hi}
            {profile.name.trim() ? `, ${profile.name.trim()}` : ""}
          </p>
          <p className="mt-1 text-sm text-[#6b7280]">{t.accountDashboardHint}</p>
        </div>
      </div>

      <hr className="my-6 border-[#e5e7eb]" />

      <h2 className="text-[22px] font-medium text-[#111]">{t.profileInformation}</h2>
      <form
        className="mt-6 max-w-xl"
        onSubmit={(event) => {
          event.preventDefault();
          void saveProfile({
            name: profile.name.trim(),
            password: googleAccount ? undefined : password.trim() || undefined,
          }).then((ok) => {
            if (!ok) return;
            setProfile(loadProfile());
            setPassword("");
            setSaved(true);
            window.setTimeout(() => setSaved(false), 2000);
          });
        }}
      >
        <label className="block text-sm font-semibold text-[#111]">
          {t.fullName}
          <input
            value={profile.name}
            onChange={(event) => setProfile((current) => ({ ...current, name: event.target.value }))}
            placeholder={t.enterFullName}
            className={fieldClass}
          />
        </label>
        <label className="mt-5 block text-sm font-semibold text-[#111]">
          {t.yourEmail}
          <input readOnly value={profile.email} className={`${fieldClass} text-[#4b5563]`} />
        </label>
        {googleAccount ? null : (
          <label className="mt-5 block text-sm font-semibold text-[#111]">
            {t.password}
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={t.newPassword}
              autoComplete="new-password"
              className={fieldClass}
            />
          </label>
        )}
        <button
          type="submit"
          className="mt-6 inline-flex rounded-md bg-[#111] px-4 py-2.5 text-sm font-medium text-white"
        >
          {t.saveChanges}
        </button>
        {saved ? <p className="mt-3 text-sm text-[#083534]">{t.changesSaved}</p> : null}
      </form>

      <button
        type="button"
        onClick={() => {
          void clearProfile().then(() => router.push(path(locale)));
        }}
        className="mt-6 inline-flex items-center gap-2 text-sm text-[#ef4444]"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <path d="M16 17l5-5-5-5" />
          <path d="M21 12H9" />
        </svg>
        {t.logout}
      </button>
    </div>
  );
}

"use client";

import { clearProfile, loadProfile, saveProfile, type Profile } from "@/lib/auth";
import { getDict } from "@/lib/i18n";
import { path } from "@/lib/path";
import type { Locale } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function AccountProfile({ locale }: { locale: Locale }) {
  const t = getDict(locale);
  const router = useRouter();
  const [profile, setProfile] = useState<Profile>({ name: "", email: "" });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setProfile(loadProfile());
  }, []);

  const initial = profile.name.trim().charAt(0).toUpperCase() || "S";

  return (
    <div>
      <div className="flex items-start gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-zinc-200 font-serif text-2xl text-fg">
          {initial}
        </div>
        <div>
          <p className="text-lg">
            {t.hi}
            {profile.name.trim() ? `, ${profile.name.trim()}` : ""}
          </p>
          <p className="mt-1 text-sm text-muted">{t.accountDashboardHint}</p>
        </div>
      </div>

      <h2 className="mt-10 font-serif text-2xl">{t.profileInformation}</h2>
      <form
        className="mt-6 max-w-xl space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          saveProfile(profile);
          setSaved(true);
          window.setTimeout(() => setSaved(false), 2000);
        }}
      >
        <label className="block text-sm">
          {t.fullName}
          <input
            value={profile.name}
            onChange={(event) => setProfile((current) => ({ ...current, name: event.target.value }))}
            placeholder={t.enterFullName}
            className="mt-1.5 w-full rounded-md border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-gold"
          />
        </label>
        <label className="block text-sm">
          {t.yourEmail}
          <input
            type="email"
            value={profile.email}
            onChange={(event) => setProfile((current) => ({ ...current, email: event.target.value }))}
            placeholder={t.yourEmail}
            className="mt-1.5 w-full rounded-md border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-gold"
          />
        </label>
        <button type="submit" className="rounded-lg bg-zinc-800 px-6 py-2.5 text-sm text-white">
          {t.saveChanges}
        </button>
        {saved ? <p className="text-sm text-gold">{t.changesSaved}</p> : null}
      </form>

      <button
        type="button"
        onClick={() => {
          clearProfile();
          router.push(path(locale));
        }}
        className="mt-6 inline-flex items-center gap-2 text-sm text-sale"
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

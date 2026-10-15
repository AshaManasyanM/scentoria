"use client";

import { AddressPinIcon, SavedAddresses } from "@/components/saved-addresses";
import { AUTH_EVENT, isLoggedIn, refreshSession } from "@/lib/auth";
import { getDict } from "@/lib/i18n";
import { path } from "@/lib/path";
import type { Locale } from "@/lib/types";
import Link from "next/link";
import { useEffect, useState } from "react";

export function AccountAddresses({ locale }: { locale: Locale }) {
  const t = getDict(locale);
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    const sync = () => {
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
      <div className="flex min-h-[320px] flex-col items-center justify-center px-4 py-10 text-center">
        <AddressPinIcon />
        <h1 className="mt-5 text-lg font-medium text-[#111]">{t.noSavedAddresses}</h1>
        <Link href={path(locale, "/login")} className="mt-2 text-sm text-[#6b7280]">
          {t.emptyAddressesHint}
        </Link>
      </div>
    );
  }

  return <SavedAddresses locale={locale} />;
}

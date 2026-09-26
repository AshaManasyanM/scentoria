"use client";

import { AUTH_EVENT, isLoggedIn, loadProfile, refreshSession } from "@/lib/auth";
import { getDict } from "@/lib/i18n";
import { path } from "@/lib/path";
import type { Locale } from "@/lib/types";
import Link from "next/link";
import { useEffect, useState } from "react";

function ProfileIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 md:h-[22px] md:w-[22px]" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <circle cx="12" cy="8" r="3.1" />
      <path strokeLinecap="round" d="M5.6 19.2c1-2.7 3.3-4.1 6.4-4.1s5.4 1.4 6.4 4.1" />
    </svg>
  );
}

export function AccountMenu({ locale }: { locale: Locale }) {
  const t = getDict(locale);
  const [image, setImage] = useState<string | undefined>();

  useEffect(() => {
    const sync = () => setImage(isLoggedIn() ? loadProfile().image : undefined);
    void refreshSession().then(sync);
    window.addEventListener(AUTH_EVENT, sync);
    return () => window.removeEventListener(AUTH_EVENT, sync);
  }, []);

  return (
    <Link
      href={path(locale, "/account")}
      aria-label={t.profile}
      className="inline-flex text-[#143028] transition-colors hover:text-[#c5a059]"
    >
      {image ? (
        <img src={image} alt="" className="h-5 w-5 rounded-full object-cover ring-1 ring-[#d8d0c4] md:h-[22px] md:w-[22px]" />
      ) : (
        <ProfileIcon />
      )}
    </Link>
  );
}

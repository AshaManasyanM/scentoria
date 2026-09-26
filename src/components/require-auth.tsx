"use client";

import { AUTH_EVENT, isLoggedIn, refreshSession } from "@/lib/auth";
import { path } from "@/lib/path";
import type { Locale } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function RequireAuth({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const sync = () => {
      if (isLoggedIn()) {
        setAllowed(true);
        return;
      }
      setAllowed(false);
      router.replace(path(locale, "/login"));
    };
    void refreshSession().then(sync);
    window.addEventListener(AUTH_EVENT, sync);
    return () => window.removeEventListener(AUTH_EVENT, sync);
  }, [locale, router]);

  if (!allowed) return null;
  return children;
}

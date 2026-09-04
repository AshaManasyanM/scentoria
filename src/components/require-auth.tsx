"use client";

import { AUTH_EVENT, isLoggedIn } from "@/lib/auth";
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
      router.replace(path(locale));
    };
    sync();
    window.addEventListener(AUTH_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(AUTH_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [locale, router]);

  if (!allowed) return null;
  return children;
}

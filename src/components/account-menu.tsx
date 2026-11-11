"use client";

import { AUTH_EVENT, clearProfile, isLoggedIn, loadProfile, refreshSession } from "@/lib/auth";
import { getDict } from "@/lib/i18n";
import { path } from "@/lib/path";
import type { Locale } from "@/lib/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

function ProfileIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <circle cx="12" cy="8" r="3.1" />
      <path strokeLinecap="round" d="M5.6 19.2c1-2.7 3.3-4.1 6.4-4.1s5.4 1.4 6.4 4.1" />
    </svg>
  );
}

export function AccountMenu({ locale }: { locale: Locale }) {
  const t = getDict(locale);
  const router = useRouter();
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [image, setImage] = useState<string | undefined>();
  const [name, setName] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const sync = () => {
      const signedIn = isLoggedIn();
      const profile = loadProfile();
      setLoggedIn(signedIn);
      setImage(signedIn ? profile.image : undefined);
      setName(signedIn ? profile.name.trim() : "");
      if (!signedIn) {
        setOpen(false);
        setVisible(false);
        setEntered(false);
      }
    };
    void refreshSession().then(sync);
    window.addEventListener(AUTH_EVENT, sync);
    return () => window.removeEventListener(AUTH_EVENT, sync);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onPointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) closeMenu();
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") closeMenu();
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (!visible || !open) return;
    const frame = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(frame);
  }, [visible, open]);

  function closeMenu() {
    setEntered(false);
    setOpen(false);
    window.setTimeout(() => setVisible(false), 200);
  }

  function openMenu() {
    setEntered(false);
    setVisible(true);
    setOpen(true);
  }

  if (!loggedIn) {
    return (
      <Link
        href={path(locale, "/login")}
        aria-label={t.profile}
        className="inline-flex h-10 w-10 items-center justify-center text-[#143028] transition-colors hover:text-[#c5a059]"
      >
        <ProfileIcon />
      </Link>
    );
  }

  const greeting = name ? `${t.hi} ${name}` : t.hi;
  const links = [
    { href: path(locale, "/account"), label: t.account },
    { href: path(locale, "/account/orders"), label: t.orders },
    { href: path(locale, "/wishlist"), label: t.favorites },
  ];

  return (
    <div ref={rootRef} className="relative inline-flex h-10 w-10 items-center justify-center">
      <button
        type="button"
        aria-label={t.profile}
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => (open ? closeMenu() : openMenu())}
        className="inline-flex h-10 w-10 items-center justify-center text-[#143028] transition-colors hover:text-[#c5a059]"
      >
        {image ? (
          <img src={image} alt="" className="h-5 w-5 rounded-full object-cover ring-1 ring-[#d8d0c4]" />
        ) : (
          <ProfileIcon />
        )}
      </button>

      {visible ? (
        <div
          id={menuId}
          role="menu"
          className={`absolute right-0 top-[calc(100%+0.65rem)] z-[90] w-[11.5rem] origin-top-right rounded-md bg-white px-3 py-4 text-center shadow-[0_10px_28px_rgba(8,53,52,0.14)] ring-1 ring-[#e4ddd3] transition-[opacity,transform] duration-200 ease-out ${
            entered ? "translate-y-0 scale-100 opacity-100" : "-translate-y-1 scale-95 opacity-0"
          }`}
        >
          <p className="border-b border-[#e4ddd3] pb-3 text-sm font-medium text-[#143028]">{greeting}</p>
          <div className="flex flex-col pt-1">
            {links.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                role="menuitem"
                onClick={closeMenu}
                className="py-2.5 text-sm text-[#143028] transition-colors hover:text-[#c5a059]"
              >
                {item.label}
              </Link>
            ))}
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                closeMenu();
                void clearProfile().then(() => router.push(path(locale)));
              }}
              className="py-2.5 text-sm text-[#143028] transition-colors hover:text-[#c5a059]"
            >
              {t.logout}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

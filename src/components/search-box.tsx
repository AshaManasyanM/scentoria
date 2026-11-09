"use client";

import { getDict } from "@/lib/i18n";
import { path } from "@/lib/path";
import type { Locale } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Suggestion = {
  handle: string;
  title: string;
  image?: string;
};

export function SearchBox({
  locale,
  value,
  onChange,
  onNavigate,
  compact = false,
}: {
  locale: Locale;
  value: string;
  onChange: (value: string) => void;
  onNavigate?: () => void;
  compact?: boolean;
}) {
  const t = getDict(locale);
  const router = useRouter();
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputWrapRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Suggestion[]>([]);
  const [active, setActive] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [panel, setPanel] = useState<{ top: number; left: number; width: number } | null>(null);

  useEffect(() => setMounted(true), []);

  const placePanel = () => {
    const el = inputWrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPanel({
      top: rect.bottom + 8,
      left: rect.left,
      width: Math.max(rect.width, compact ? rect.width : 320),
    });
  };

  useLayoutEffect(() => {
    if (!open) return;
    placePanel();
    const onScroll = () => placePanel();
    window.addEventListener("resize", onScroll);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open, value, compact, items.length]);

  useEffect(() => {
    const term = value.trim();
    if (term.length < 1) {
      setItems([]);
      setOpen(false);
      setActive(-1);
      setLoading(false);
      return;
    }

    let alive = true;
    setLoading(true);
    setOpen(true);
    const timer = window.setTimeout(() => {
      void fetch(`/api/search?q=${encodeURIComponent(term.slice(0, 80))}`)
        .then((res) => (res.ok ? res.json() : { items: [] }))
        .then((data: { items?: Suggestion[] }) => {
          if (!alive) return;
          setItems(Array.isArray(data.items) ? data.items : []);
          setActive(-1);
        })
        .catch(() => {
          if (!alive) return;
          setItems([]);
        })
        .finally(() => {
          if (alive) setLoading(false);
        });
    }, 120);

    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [value]);

  useEffect(() => {
    const onPointer = (event: MouseEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target)) return;
      const portal = document.getElementById(listId);
      if (portal?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, [listId]);

  const goFilter = (term = value) => {
    const next = term.trim();
    if (!next) return;
    setOpen(false);
    onNavigate?.();
    router.push(`${path(locale, "/products")}?q=${encodeURIComponent(next)}`);
  };

  const goProduct = (handle: string) => {
    setOpen(false);
    onNavigate?.();
    router.push(path(locale, `/products/${handle}`));
  };

  const showPanel = open && value.trim().length > 0 && mounted && panel;

  const dropdown =
    showPanel && panel ? (
      <div
        id={listId}
        role="listbox"
        style={{ top: panel.top, left: panel.left, width: panel.width }}
        className="fixed z-[80] max-h-[min(70vh,420px)] overflow-auto rounded-2xl border border-[#e4ddd3] bg-white shadow-[0_16px_40px_rgba(8,53,52,0.18)]"
      >
        {loading && items.length === 0 ? (
          <p className="px-4 py-3 text-sm text-[#8a8178]">…</p>
        ) : null}
        {!loading && items.length === 0 ? (
          <p className="px-4 py-3 text-sm text-[#8a8178]">{t.searchNoResults}</p>
        ) : null}
        {items.map((item, index) => (
          <button
            key={item.handle}
            id={`${listId}-${index}`}
            type="button"
            role="option"
            aria-selected={active === index}
            onMouseEnter={() => setActive(index)}
            onClick={() => goProduct(item.handle)}
            className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition ${
              active === index ? "bg-[#f4efe7]" : "bg-white hover:bg-[#f7f2ea]"
            }`}
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#f7f2ea]">
              {item.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.image} alt="" className="h-full w-full object-contain" />
              ) : null}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-[#083534]">{item.title}</span>
          </button>
        ))}
        <button
          type="button"
          onClick={() => goFilter()}
          className="sticky bottom-0 flex w-full items-center justify-between border-t border-[#ece6dc] bg-white px-4 py-2.5 text-left text-sm text-[#083534] hover:bg-[#f7f2ea]"
        >
          <span>
            {t.searchViewAll}
            {value.trim() ? `: “${value.trim()}”` : ""}
          </span>
          <span aria-hidden>→</span>
        </button>
      </div>
    ) : null;

  return (
    <div ref={rootRef} className="relative w-full">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (active >= 0 && items[active]) {
            goProduct(items[active].handle);
            return;
          }
          goFilter();
        }}
      >
        <div ref={inputWrapRef} className={`relative ${compact ? "w-full" : "max-w-[240px]"}`}>
          {!compact ? (
            <button
              type="submit"
              aria-label={t.search}
              className="absolute left-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center text-[#8a8178]"
            >
              <svg viewBox="0 0 24 24" aria-hidden className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="11" cy="11" r="6.5" />
                <path d="M16 16.5 20 20.5" strokeLinecap="round" />
              </svg>
            </button>
          ) : null}
          <input
            name="q"
            role="combobox"
            aria-expanded={Boolean(showPanel)}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
            aria-label={t.search}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onFocus={() => {
              if (value.trim()) {
                setOpen(true);
                placePanel();
              }
            }}
            onKeyDown={(event) => {
              if (!open) return;
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setActive((current) => Math.min(current + 1, Math.max(items.length - 1, 0)));
              } else if (event.key === "ArrowUp") {
                event.preventDefault();
                setActive((current) => Math.max(current - 1, -1));
              } else if (event.key === "Escape") {
                setOpen(false);
                setActive(-1);
              }
            }}
            placeholder={`${t.search}...`}
            autoComplete="off"
            className={
              compact
                ? "h-9 w-full rounded-full border border-line bg-white px-4 text-sm text-fg outline-none placeholder:text-muted focus:border-gold"
                : "h-10 w-full rounded-full border border-white bg-white pl-10 pr-4 text-sm text-fg shadow-[0_1px_2px_rgba(26,20,24,0.06)] outline-none placeholder:text-[#9a9188] focus:border-[#d9d0c6]"
            }
          />
        </div>
      </form>
      {mounted ? createPortal(dropdown, document.body) : null}
    </div>
  );
}

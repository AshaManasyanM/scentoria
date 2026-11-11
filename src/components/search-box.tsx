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
  brand?: string;
};

export function SearchBox({
  locale,
  value,
  onChange,
  onNavigate,
  compact = false,
  bordered = false,
  panelLayout = false,
  autoFocus = false,
}: {
  locale: Locale;
  value: string;
  onChange: (value: string) => void;
  onNavigate?: () => void;
  compact?: boolean;
  bordered?: boolean;
  panelLayout?: boolean;
  autoFocus?: boolean;
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

  const inputVisible = () => {
    const el = inputWrapRef.current;
    if (!el || typeof window === "undefined") return false;
    const style = window.getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden") return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 2 && rect.height > 2;
  };

  const placePanel = () => {
    if (panelLayout) return;
    const el = inputWrapRef.current;
    if (!el || !inputVisible()) {
      setPanel(null);
      setOpen(false);
      return;
    }
    const rect = el.getBoundingClientRect();
    setPanel({
      top: rect.bottom + 8,
      left: Math.max(8, Math.min(rect.left, window.innerWidth - Math.max(rect.width, 280) - 8)),
      width: Math.min(Math.max(rect.width, compact ? rect.width : 320), window.innerWidth - 16),
    });
  };

  useLayoutEffect(() => {
    if (!open || panelLayout) return;
    placePanel();
    const onScroll = () => placePanel();
    window.addEventListener("resize", onScroll);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open, value, compact, items.length, panelLayout]);

  useEffect(() => {
    const term = value.trim();
    if (term.length < 1) {
      setItems([]);
      setOpen(false);
      setActive(-1);
      setLoading(false);
      return;
    }

    if (!panelLayout && !inputVisible()) {
      setOpen(false);
      setPanel(null);
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
  }, [value, panelLayout]);

  useEffect(() => {
    if (panelLayout) return;
    const onPointer = (event: MouseEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target)) return;
      const portal = document.getElementById(listId);
      if (portal?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, [listId, panelLayout]);

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

  const showDropdown = !panelLayout && open && value.trim().length > 0 && mounted && panel;
  const showInline = panelLayout && value.trim().length > 0;

  function resultRow(item: Suggestion, index: number, variant: "dropdown" | "panel") {
    const selected = active === index;
    if (variant === "panel") {
      return (
        <button
          key={item.handle}
          id={`${listId}-${index}`}
          type="button"
          role="option"
          aria-selected={selected}
          onMouseEnter={() => setActive(index)}
          onClick={() => goProduct(item.handle)}
          className={`flex w-full items-center gap-3.5 rounded-xl border border-[#e8e2d8] bg-white px-3 py-3 text-left transition ${
            selected ? "border-[#c5a059] bg-[#faf7f2]" : "hover:border-[#d8d0c4]"
          }`}
        >
          <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#f7f2ea]">
            {item.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.image} alt="" className="h-full w-full object-contain p-1" />
            ) : null}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[15px] font-semibold leading-snug text-[#1a1a1a]">{item.title}</span>
            {item.brand ? (
              <span className="mt-0.5 block truncate text-[11px] font-medium uppercase tracking-[0.08em] text-[#9a9188]">
                {item.brand}
              </span>
            ) : null}
          </span>
        </button>
      );
    }

    return (
      <button
        key={item.handle}
        id={`${listId}-${index}`}
        type="button"
        role="option"
        aria-selected={selected}
        onMouseEnter={() => setActive(index)}
        onClick={() => goProduct(item.handle)}
        className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition ${
          selected ? "bg-[#f4efe7]" : "bg-white hover:bg-[#f7f2ea]"
        }`}
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#f7f2ea]">
          {item.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.image} alt="" className="h-full w-full object-contain" />
          ) : null}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-[#083534]">{item.title}</span>
          {item.brand ? (
            <span className="block truncate text-[11px] uppercase tracking-[0.06em] text-[#9a9188]">{item.brand}</span>
          ) : null}
        </span>
      </button>
    );
  }

  const dropdown =
    showDropdown && panel ? (
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
        {items.map((item, index) => resultRow(item, index, "dropdown"))}
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
    <div ref={rootRef} className={`relative w-full ${panelLayout ? "flex min-h-0 flex-1 flex-col" : ""}`}>
      <form
        className={panelLayout ? "shrink-0" : undefined}
        onSubmit={(event) => {
          event.preventDefault();
          if (active >= 0 && items[active]) {
            goProduct(items[active].handle);
            return;
          }
          goFilter();
        }}
      >
        <div ref={inputWrapRef} className={`relative ${compact || panelLayout ? "w-full" : "max-w-[240px]"}`}>
          {panelLayout ? (
            <span className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-[#9a9188]">
              <svg viewBox="0 0 24 24" aria-hidden className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.7">
                <circle cx="11" cy="11" r="6.5" />
                <path d="M16 16.5 20 20.5" strokeLinecap="round" />
              </svg>
            </span>
          ) : null}
          {!compact && !panelLayout ? (
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
            aria-expanded={Boolean(showDropdown || showInline)}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
            aria-label={t.search}
            value={value}
            autoFocus={autoFocus}
            onChange={(event) => onChange(event.target.value)}
            onFocus={() => {
              if (panelLayout) return;
              if (value.trim()) {
                setOpen(true);
                placePanel();
              }
            }}
            onKeyDown={(event) => {
              if (!(open || showInline)) return;
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
            style={panelLayout ? { fontSize: 16 } : undefined}
            className={
              panelLayout
                ? `h-12 w-full rounded-lg border border-[#d8d0c4] bg-[#faf7f2] py-3 text-[16px] text-[#083534] shadow-[inset_0_1px_2px_rgba(8,53,52,0.04)] outline-none transition-[border-color,box-shadow,background-color] placeholder:text-[#9a9188] focus:border-[#c5a059] focus:bg-white focus:shadow-[0_0_0_3px_rgba(197,160,89,0.18)] ${
                    value ? "pl-11 pr-11" : "pl-11 pr-4"
                  }`
                : compact
                  ? "h-9 w-full rounded-full border border-line bg-white px-4 text-sm text-fg outline-none placeholder:text-muted focus:border-gold"
                  : bordered
                    ? "h-10 w-full rounded-full border border-[#C9BEB0] bg-white pl-10 pr-4 text-sm text-fg shadow-[0_1px_2px_rgba(26,20,24,0.06)] outline-none placeholder:text-[#9a9188] focus:border-[#083534]/35"
                    : "h-10 w-full rounded-full border border-white bg-white pl-10 pr-4 text-sm text-fg shadow-[0_1px_2px_rgba(26,20,24,0.06)] outline-none placeholder:text-[#9a9188] focus:border-[#d9d0c6]"
            }
          />
          {panelLayout && value ? (
            <button
              type="button"
              aria-label={t.close}
              onClick={() => {
                onChange("");
                setItems([]);
                setOpen(false);
                setActive(-1);
              }}
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-[#083534]/70 transition-colors hover:bg-[#083534]/8 hover:text-[#083534]"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          ) : null}
        </div>
      </form>

      {showInline ? (
        <div
          id={listId}
          role="listbox"
          className="mt-4 min-h-0 flex-1 overflow-y-auto overscroll-contain pb-6 [-webkit-overflow-scrolling:touch]"
        >
          <div className="flex flex-col gap-2.5">
            {loading && items.length === 0 ? (
              <p className="px-1 py-2 text-sm text-[#8a8178]">…</p>
            ) : null}
            {!loading && items.length === 0 ? (
              <p className="px-1 py-2 text-sm text-[#8a8178]">{t.searchNoResults}</p>
            ) : null}
            {items.map((item, index) => resultRow(item, index, "panel"))}
            {items.length > 0 ? (
              <button
                type="button"
                onClick={() => goFilter()}
                className="mt-1 flex w-full items-center justify-between rounded-xl border border-[#e8e2d8] bg-white px-4 py-3 text-left text-sm text-[#083534]"
              >
                <span>
                  {t.searchViewAll}
                  {value.trim() ? `: “${value.trim()}”` : ""}
                </span>
                <span aria-hidden>→</span>
              </button>
            ) : null}
          </div>
        </div>
      ) : panelLayout ? (
        <div className="min-h-0 flex-1" aria-hidden />
      ) : null}

      {!panelLayout && mounted ? createPortal(dropdown, document.body) : null}
    </div>
  );
}

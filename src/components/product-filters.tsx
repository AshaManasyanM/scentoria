"use client";

import { formatMoney } from "@/lib/format";
import { getDict } from "@/lib/i18n";
import { path } from "@/lib/path";
import { scrollToCatalog } from "@/lib/scroll-catalog";
import type { CatalogFilterGroup } from "@/lib/shopify/catalog";
import type { Locale } from "@/lib/types";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";

function CheckboxRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 py-1.5 text-sm text-[#083534]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 shrink-0 rounded-[2px] border border-[#D8D0C4] accent-[#083534]"
      />
      <span className="uppercase tracking-[0.04em]">{label}</span>
    </label>
  );
}

function SelectField({
  label,
  value,
  placeholder,
  options,
  onChange,
  className = "",
}: {
  label: string;
  value: string;
  placeholder: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    function onPointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, []);

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <p className="text-sm text-[#083534]">{label}</p>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="mt-2 flex h-11 w-full items-center justify-between rounded-[2px] border border-[#D8D0C4] bg-white px-3 text-left text-sm text-[#083534]"
      >
        <span className={selected ? "" : "text-[#083534]/45"}>{selected?.label ?? placeholder}</span>
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          aria-hidden
          className={open ? "rotate-180" : ""}
        >
          <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open ? (
        <ul
          role="listbox"
          className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-[2px] border border-[#D8D0C4] bg-white py-1 shadow-[0_8px_24px_rgba(8,53,52,0.08)]"
        >
          <li>
            <button
              type="button"
              role="option"
              aria-selected={value === ""}
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              className={`block w-full px-3 py-2 text-left text-sm ${value === "" ? "bg-[#083534] text-[#f7f2ea]" : "text-[#083534] hover:bg-[#f7f2ea]"}`}
            >
              {placeholder}
            </button>
          </li>
          {options.map((option) => (
            <li key={option.value}>
              <button
                type="button"
                role="option"
                aria-selected={option.value === value}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`block w-full px-3 py-2 text-left text-sm ${option.value === value ? "bg-[#083534] text-[#f7f2ea]" : "text-[#083534] hover:bg-[#f7f2ea]"}`}
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function Group({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div className="border-b border-[#D8D0C4] py-4">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between text-left text-xs font-semibold uppercase tracking-[0.14em] text-[#083534]"
        aria-expanded={open}
      >
        {title}
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          aria-hidden
          className={open ? "" : "rotate-180"}
        >
          <path d="m6 14 6-6 6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open ? <div className="mt-3">{children}</div> : null}
    </div>
  );
}

function PriceRangeField({
  label,
  locale,
  bounds,
  valueMin,
  valueMax,
  onCommit,
}: {
  label: string;
  locale: Locale;
  bounds: { min: number; max: number; currencyCode: string };
  valueMin: number;
  valueMax: number;
  onCommit: (min: number, max: number) => void;
}) {
  const [min, setMin] = useState(valueMin);
  const [max, setMax] = useState(valueMax);
  const live = useRef({ min: valueMin, max: valueMax });
  const span = Math.max(bounds.max - bounds.min, 1);
  const step = Math.max(1, Math.round(span / 100));

  useEffect(() => {
    setMin(valueMin);
    setMax(valueMax);
    live.current = { min: valueMin, max: valueMax };
  }, [valueMin, valueMax]);

  function money(amount: number) {
    return formatMoney({ amount: String(amount), currencyCode: bounds.currencyCode }, locale);
  }

  function commit(nextMin = live.current.min, nextMax = live.current.max) {
    const low = Math.min(nextMin, nextMax);
    const high = Math.max(nextMin, nextMax);
    live.current = { min: low, max: high };
    setMin(low);
    setMax(high);
    if (low === valueMin && high === valueMax) return;
    onCommit(low, high);
  }

  const lowPct = ((min - bounds.min) / span) * 100;
  const highPct = ((max - bounds.min) / span) * 100;

  return (
    <div className="border-b border-[#D8D0C4] py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#083534]">{label}</p>
      <p className="mt-3 text-sm text-[#083534]">
        {money(min)} – {money(max)}
      </p>
      <div className="relative mt-5 h-6">
        <div className="absolute left-0 right-0 top-1/2 h-[2px] -translate-y-1/2 rounded-full bg-[#D8D0C4]" />
        <div
          className="absolute top-1/2 h-[2px] -translate-y-1/2 rounded-full bg-[#083534]"
          style={{ left: `${lowPct}%`, right: `${100 - highPct}%` }}
        />
        <input
          type="range"
          min={bounds.min}
          max={bounds.max}
          step={step}
          value={min}
          aria-label={`${label} min`}
          onChange={(event) => {
            const next = Math.min(Number(event.target.value), live.current.max);
            live.current = { ...live.current, min: next };
            setMin(next);
          }}
          onPointerUp={() => commit()}
          onKeyUp={() => commit()}
          className="pointer-events-none absolute inset-0 w-full appearance-none bg-transparent [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-[#083534] [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:relative [&::-webkit-slider-thumb]:z-20 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#083534]"
        />
        <input
          type="range"
          min={bounds.min}
          max={bounds.max}
          step={step}
          value={max}
          aria-label={`${label} max`}
          onChange={(event) => {
            const next = Math.max(Number(event.target.value), live.current.min);
            live.current = { ...live.current, max: next };
            setMax(next);
          }}
          onPointerUp={() => commit()}
          onKeyUp={() => commit()}
          className="pointer-events-none absolute inset-0 w-full appearance-none bg-transparent [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-[#083534] [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:relative [&::-webkit-slider-thumb]:z-30 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#083534]"
        />
      </div>
    </div>
  );
}

const filterKeys = ["gender", "note", "season", "size"] as const;

type Draft = {
  selected: Record<string, string[]>;
  priceMin: number;
  priceMax: number;
};

export function ProductFilters({
  locale,
  groups,
  priceBounds,
  basePath = "/products",
}: {
  locale: Locale;
  groups: CatalogFilterGroup[];
  priceBounds: { min: number; max: number; currencyCode: string };
  basePath?: string;
}) {
  const t = getDict(locale);
  const router = useRouter();
  const searchParams = useSearchParams();
  const sort = searchParams.get("new") === "1" ? "new" : (searchParams.get("sort") ?? "");
  const selected: Record<string, string[]> = {
    note: searchParams.getAll("note"),
    gender: searchParams.getAll("gender"),
    season: searchParams.getAll("season"),
    size: searchParams.getAll("size"),
  };
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [drawerEntered, setDrawerEntered] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const searchText = searchParams.get("q") ?? "";
  const rawMin = searchParams.get("minPrice");
  const rawMax = searchParams.get("maxPrice");
  const parsedMin = rawMin != null && rawMin !== "" ? Number(rawMin) : Number.NaN;
  const parsedMax = rawMax != null && rawMax !== "" ? Number(rawMax) : Number.NaN;
  const priceMin =
    Number.isFinite(parsedMin)
      ? Math.min(Math.max(parsedMin, priceBounds.min), priceBounds.max)
      : priceBounds.min;
  const priceMax =
    Number.isFinite(parsedMax) && !(parsedMax === 0 && !Number.isFinite(parsedMin) && priceBounds.max > 0)
      ? Math.min(Math.max(parsedMax, priceBounds.min), priceBounds.max)
      : priceBounds.max;
  const priceActive = priceMin > priceBounds.min || priceMax < priceBounds.max;
  const hasPriceSlider = priceBounds.max > priceBounds.min;
  const hasFilters =
    Boolean(sort) ||
    Boolean(searchText) ||
    priceActive ||
    searchParams.getAll("brand").length > 0 ||
    filterKeys.some((key) => selected[key]?.length);

  const sortOptions = [
    { value: "price-asc", label: t.sortPriceAsc },
    { value: "price-desc", label: t.sortPriceDesc },
    { value: "name", label: t.sortName },
    { value: "new", label: t.sortNew },
  ];

  useEffect(() => {
    if (!drawerVisible) return;
    const html = document.documentElement;
    const body = document.body;
    const scrollY = window.scrollY;
    html.classList.add("overflow-hidden");
    body.classList.add("overflow-hidden");
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    return () => {
      html.classList.remove("overflow-hidden");
      body.classList.remove("overflow-hidden");
      body.style.position = "";
      body.style.top = "";
      body.style.left = "";
      body.style.right = "";
      body.style.width = "";
      window.scrollTo(0, scrollY);
    };
  }, [drawerVisible]);

  useEffect(() => {
    if (!drawerVisible || !drawerOpen) return;
    const frame = requestAnimationFrame(() => setDrawerEntered(true));
    return () => cancelAnimationFrame(frame);
  }, [drawerVisible, drawerOpen]);

  function toggle(list: string[], value: string, checked: boolean) {
    return checked ? [...list, value] : list.filter((item) => item !== value);
  }

  function closeDrawer() {
    setDrawerEntered(false);
    setDrawerOpen(false);
    window.setTimeout(() => {
      setDrawerVisible(false);
      setDraft(null);
    }, 280);
  }

  function navigate(next: {
    sort?: string;
    selected?: Record<string, string[]>;
    priceMin?: number;
    priceMax?: number;
  }) {
    const nextSort = next.sort ?? sort;
    const nextSelected = next.selected ?? selected;
    const nextPriceMin = next.priceMin ?? priceMin;
    const nextPriceMax = next.priceMax ?? priceMax;
    const params = new URLSearchParams();
    if (searchText) params.set("q", searchText);
    if (nextSort === "new") params.set("new", "1");
    else if (nextSort) params.set("sort", nextSort);
    filterKeys.forEach((key) => {
      (nextSelected[key] ?? []).forEach((value) => params.append(key, value));
    });
    searchParams.getAll("brand").forEach((value) => params.append("brand", value));
    if (nextPriceMin > priceBounds.min) params.set("minPrice", String(nextPriceMin));
    if (nextPriceMax < priceBounds.max) params.set("maxPrice", String(nextPriceMax));
    const qs = params.toString();
    router.push(path(locale, `${basePath}${qs ? `?${qs}` : ""}`), { scroll: false });
    scrollToCatalog();
  }

  function clear() {
    router.push(path(locale, basePath), { scroll: false });
    scrollToCatalog();
  }

  function openDrawer() {
    setDraft({
      selected: {
        note: [...selected.note],
        gender: [...selected.gender],
        season: [...selected.season],
        size: [...selected.size],
      },
      priceMin,
      priceMax,
    });
    setDrawerEntered(false);
    setDrawerVisible(true);
    setDrawerOpen(true);
  }

  function applyDraft() {
    if (!draft) return;
    navigate({
      selected: draft.selected,
      priceMin: draft.priceMin,
      priceMax: draft.priceMax,
    });
    closeDrawer();
  }

  function resetDraft() {
    setDraft({
      selected: { note: [], gender: [], season: [], size: [] },
      priceMin: priceBounds.min,
      priceMax: priceBounds.max,
    });
    clear();
    closeDrawer();
  }

  const activeSelected = draft?.selected ?? selected;
  const activePriceMin = draft?.priceMin ?? priceMin;
  const activePriceMax = draft?.priceMax ?? priceMax;

  function renderGroups(mode: "live" | "draft") {
    return (
      <>
        {hasPriceSlider ? (
          <PriceRangeField
            label={t.filterPrice}
            locale={locale}
            bounds={priceBounds}
            valueMin={Math.min(activePriceMin, activePriceMax)}
            valueMax={Math.max(activePriceMin, activePriceMax)}
            onCommit={(min, max) => {
              if (mode === "draft") {
                setDraft((current) =>
                  current
                    ? { ...current, priceMin: min, priceMax: max }
                    : { selected, priceMin: min, priceMax: max },
                );
                return;
              }
              navigate({ priceMin: min, priceMax: max });
            }}
          />
        ) : null}

        {groups.map((group) => {
          const values = activeSelected[group.id] ?? [];
          return (
            <Group
              key={group.id}
              title={group.title}
              open={open[group.id] !== false}
              onToggle={() => setOpen((current) => ({ ...current, [group.id]: current[group.id] === false }))}
            >
              <div>
                {group.items.map((item) => (
                  <CheckboxRow
                    key={item.value}
                    label={item.label}
                    checked={values.includes(item.value)}
                    onChange={(checked) => {
                      const nextSelected = {
                        ...activeSelected,
                        [group.id]: toggle(values, item.value, checked),
                      };
                      if (mode === "draft") {
                        setDraft((current) =>
                          current
                            ? { ...current, selected: nextSelected }
                            : { selected: nextSelected, priceMin, priceMax },
                        );
                        return;
                      }
                      navigate({ selected: nextSelected });
                    }}
                  />
                ))}
              </div>
            </Group>
          );
        })}
      </>
    );
  }

  return (
    <>
      {/* Mobile: Sort + Filter bar */}
      <div className="mb-6 flex items-end gap-3 lg:hidden">
        <SelectField
          className="min-w-0 flex-1"
          label={t.sortBy}
          value={sort}
          placeholder={t.sortSelect}
          onChange={(value) => navigate({ sort: value })}
          options={sortOptions}
        />
        <button
          type="button"
          onClick={openDrawer}
          className="inline-flex h-11 shrink-0 items-center gap-2 rounded-[2px] border border-[#D8D0C4] bg-white px-4 text-sm text-[#083534]"
        >
          {t.filter}
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
            <path d="M4 7h16M7 12h10M10 17h4" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Mobile filter sheet */}
      {drawerVisible ? (
        <div className="fixed inset-0 z-[80] lg:hidden" role="dialog" aria-modal="true" aria-label={t.filter}>
          <button
            type="button"
            aria-label={t.close}
            className={`absolute inset-0 bg-[#083534]/40 transition-opacity duration-[280ms] ease-out ${
              drawerEntered ? "opacity-100" : "opacity-0"
            }`}
            onClick={closeDrawer}
          />
          <div
            className={`absolute inset-x-0 bottom-0 flex max-h-[72dvh] flex-col rounded-t-2xl bg-white shadow-[0_-12px_40px_rgba(8,53,52,0.18)] transition-transform duration-[280ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
              drawerEntered ? "translate-y-0" : "translate-y-full"
            }`}
          >
            <div className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-[#D8D0C4]" aria-hidden />
            <div className="flex items-center justify-between border-b border-[#D8D0C4] px-5 py-3">
              <h2 className="font-serif text-xl text-[#083534]">{t.filter}</h2>
              <button
                type="button"
                aria-label={t.close}
                onClick={closeDrawer}
                className="inline-flex h-10 w-10 items-center justify-center text-[#083534]"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-4">
              {searchText ? <p className="mt-4 text-sm text-[#083534]">{t.search}: {searchText}</p> : null}
              {renderGroups("draft")}
            </div>
            <div className="shrink-0 space-y-3 border-t border-[#D8D0C4] bg-white px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <button
                type="button"
                onClick={resetDraft}
                className="inline-flex w-full items-center justify-center rounded-[2px] border border-[#D8D0C4] bg-[#F0EBE3] px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-[#083534]"
              >
                {t.filterReset}
              </button>
              <button
                type="button"
                onClick={applyDraft}
                className="inline-flex w-full items-center justify-center rounded-[2px] bg-[#083534] px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-[#f7f2ea]"
              >
                {t.filterApply}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Desktop sidebar */}
      <aside className="hidden w-full shrink-0 rounded-md border border-[#D8D0C4] bg-[#F7F2EA] px-5 py-5 lg:sticky lg:top-20 lg:block lg:max-h-[calc(100dvh-5.5rem)] lg:w-[280px] lg:self-start lg:overflow-y-auto">
        <SelectField
          label={t.sortBy}
          value={sort}
          placeholder={t.sortSelect}
          onChange={(value) => navigate({ sort: value })}
          options={sortOptions}
        />

        {searchText ? <p className="mt-4 text-sm text-[#083534]">{t.search}: {searchText}</p> : null}

        <div className="mt-4">{renderGroups("live")}</div>

        {hasFilters ? (
          <div className="mt-5">
            <button
              type="button"
              onClick={clear}
              className="inline-flex w-full items-center justify-center rounded-[2px] border border-[#D8D0C4] bg-white px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.08em] text-[#083534]"
            >
              {t.filterClear}
            </button>
          </div>
        ) : null}
      </aside>
    </>
  );
}

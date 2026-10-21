"use client";

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
}: {
  label: string;
  value: string;
  placeholder: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
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
    <div ref={rootRef} className="relative">
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

export function ProductFilters({
  locale,
  groups,
  basePath = "/products",
}: {
  locale: Locale;
  groups: CatalogFilterGroup[];
  basePath?: string;
}) {
  const t = getDict(locale);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sort, setSort] = useState(searchParams.get("new") === "1" ? "new" : (searchParams.get("sort") ?? ""));
  const [selectedBrands, setSelectedBrands] = useState(searchParams.getAll("brand"));
  const [selectedNotes, setSelectedNotes] = useState(searchParams.getAll("note"));
  const [selectedGenders, setSelectedGenders] = useState(searchParams.getAll("gender"));
  const [selectedSizes, setSelectedSizes] = useState(searchParams.getAll("size"));
  const [selectedDiscounts, setSelectedDiscounts] = useState(searchParams.getAll("discount"));
  const [open, setOpen] = useState<Record<string, boolean>>({});

  function toggle(list: string[], value: string, checked: boolean) {
    return checked ? [...list, value] : list.filter((item) => item !== value);
  }

  const searchText = searchParams.get("q") ?? "";

  function apply() {
    const params = new URLSearchParams();
    if (searchText) params.set("q", searchText);
    if (sort === "new") params.set("new", "1");
    else if (sort) params.set("sort", sort);
    selectedGenders.forEach((value) => params.append("gender", value));
    selectedBrands.forEach((value) => params.append("brand", value));
    selectedNotes.forEach((value) => params.append("note", value));
    selectedSizes.forEach((value) => params.append("size", value));
    selectedDiscounts.forEach((value) => params.append("discount", value));
    const qs = params.toString();
    router.push(path(locale, `${basePath}${qs ? `?${qs}` : ""}`), { scroll: false });
    scrollToCatalog();
  }

  function reset() {
    setSort("");
    setSelectedBrands([]);
    setSelectedNotes([]);
    setSelectedGenders([]);
    setSelectedSizes([]);
    setSelectedDiscounts([]);
    router.push(path(locale, basePath), { scroll: false });
    scrollToCatalog();
  }

  return (
    <aside className="w-full shrink-0 rounded-md border border-[#D8D0C4] bg-[#F7F2EA] px-5 py-5 lg:w-[280px]">
      <SelectField
        label={t.sortBy}
        value={sort}
        placeholder={t.sortSelect}
        onChange={setSort}
        options={[
          { value: "price-asc", label: t.sortPriceAsc },
          { value: "price-desc", label: t.sortPriceDesc },
          { value: "name", label: t.sortName },
          { value: "new", label: t.sortNew },
        ]}
      />

      {searchText ? <p className="mt-4 text-sm text-[#083534]">{t.search}: {searchText}</p> : null}

      <div className="mt-4">
        {groups.map((group) => {
          const selected =
            group.id === "brand"
              ? selectedBrands
              : group.id === "note"
                ? selectedNotes
                : group.id === "gender"
                  ? selectedGenders
                  : group.id === "size"
                    ? selectedSizes
                    : selectedDiscounts;
          const setSelected =
            group.id === "brand"
              ? setSelectedBrands
              : group.id === "note"
                ? setSelectedNotes
                : group.id === "gender"
                  ? setSelectedGenders
                  : group.id === "size"
                    ? setSelectedSizes
                    : setSelectedDiscounts;
          return (
            <Group
              key={group.id}
              title={group.title}
              open={open[group.id] !== false}
              onToggle={() => setOpen((current) => ({ ...current, [group.id]: current[group.id] === false }))}
            >
              <div className={group.id === "brand" ? "max-h-52 overflow-y-auto pr-1" : undefined}>
                {group.items.map((item) => (
                  <CheckboxRow
                    key={item.value}
                    label={item.label}
                    checked={selected.includes(item.value)}
                    onChange={(checked) => setSelected((current) => toggle(current, item.value, checked))}
                  />
                ))}
              </div>
            </Group>
          );
        })}
      </div>

      <div className="mt-5 flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex flex-1 items-center justify-center rounded-[2px] border border-[#D8D0C4] bg-white px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.08em] text-[#083534]"
        >
          {t.filterReset}
        </button>
        <button
          type="button"
          onClick={apply}
          className="inline-flex flex-1 items-center justify-center rounded-[2px] bg-[#083534] px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.08em] text-[#f7f2ea]"
        >
          {t.filterApply}
        </button>
      </div>
    </aside>
  );
}

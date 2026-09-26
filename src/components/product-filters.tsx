"use client";

import { getDict } from "@/lib/i18n";
import { path } from "@/lib/path";
import type { Locale } from "@/lib/types";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";

const sizes = [
  ["travel", "sizeTravel"],
  ["medium", "sizeMedium"],
  ["large", "sizeLarge"],
] as const;

const discounts = ["10", "20", "30", "40", "50", "60", "70"];

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
  brands,
  notes,
  basePath = "/products",
}: {
  locale: Locale;
  brands: string[];
  notes: string[];
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
  const [open, setOpen] = useState({
    brand: true,
    note: true,
    gender: true,
    size: true,
    discount: true,
  });

  function toggle(list: string[], value: string, checked: boolean) {
    return checked ? [...list, value] : list.filter((item) => item !== value);
  }

  function apply() {
    const params = new URLSearchParams();
    if (sort === "new") params.set("new", "1");
    else if (sort) params.set("sort", sort);
    selectedGenders.forEach((value) => params.append("gender", value));
    selectedBrands.forEach((value) => params.append("brand", value));
    selectedNotes.forEach((value) => params.append("note", value));
    selectedSizes.forEach((value) => params.append("size", value));
    selectedDiscounts.forEach((value) => params.append("discount", value));
    const qs = params.toString();
    router.push(path(locale, `${basePath}${qs ? `?${qs}` : ""}`));
  }

  function reset() {
    setSort("");
    setSelectedBrands([]);
    setSelectedNotes([]);
    setSelectedGenders([]);
    setSelectedSizes([]);
    setSelectedDiscounts([]);
    router.push(path(locale, basePath));
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

      <div className="mt-4">
        <Group title={t.filterBrand} open={open.brand} onToggle={() => setOpen((current) => ({ ...current, brand: !current.brand }))}>
          <div className="max-h-52 overflow-y-auto pr-1">
            {brands.map((brand) => (
              <CheckboxRow
                key={brand}
                label={brand}
                checked={selectedBrands.includes(brand)}
                onChange={(checked) => setSelectedBrands((current) => toggle(current, brand, checked))}
              />
            ))}
          </div>
        </Group>
        <Group title={t.filterNote} open={open.note} onToggle={() => setOpen((current) => ({ ...current, note: !current.note }))}>
          {notes.map((note) => (
            <CheckboxRow
              key={note}
              label={t.notes[note as keyof typeof t.notes]}
              checked={selectedNotes.includes(note)}
              onChange={(checked) => setSelectedNotes((current) => toggle(current, note, checked))}
            />
          ))}
        </Group>
        <Group title={t.filterGender} open={open.gender} onToggle={() => setOpen((current) => ({ ...current, gender: !current.gender }))}>
          {(
            [
              ["men", t.men],
              ["women", t.women],
              ["unisex", t.unisex],
            ] as const
          ).map(([value, label]) => (
            <CheckboxRow
              key={value}
              label={label}
              checked={selectedGenders.includes(value)}
              onChange={(checked) => setSelectedGenders((current) => toggle(current, value, checked))}
            />
          ))}
        </Group>
        <Group title={t.size} open={open.size} onToggle={() => setOpen((current) => ({ ...current, size: !current.size }))}>
          {sizes.map(([value, key]) => (
            <CheckboxRow
              key={value}
              label={t[key]}
              checked={selectedSizes.includes(value)}
              onChange={(checked) => setSelectedSizes((current) => toggle(current, value, checked))}
            />
          ))}
        </Group>
        <Group
          title={t.filterDiscount}
          open={open.discount}
          onToggle={() => setOpen((current) => ({ ...current, discount: !current.discount }))}
        >
          {discounts.map((value) => (
            <CheckboxRow
              key={value}
              label={`${value}%`}
              checked={selectedDiscounts.includes(value)}
              onChange={(checked) => setSelectedDiscounts((current) => toggle(current, value, checked))}
            />
          ))}
        </Group>
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

"use client";

import { getDict } from "@/lib/i18n";
import { path } from "@/lib/path";
import type { Locale } from "@/lib/types";
import { useRouter, useSearchParams } from "next/navigation";

const selectClass =
  "mt-1 h-10 w-full rounded-md border border-line bg-white px-3 font-[family-name:var(--font-tommy)] text-sm outline-none focus:border-gold";

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
    <label className="flex cursor-pointer items-center gap-2 py-1 font-[family-name:var(--font-tommy)] text-sm text-fg">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 shrink-0 accent-gold"
      />
      <span>{label}</span>
    </label>
  );
}

export function ProductFilters({
  locale,
  brands,
  notes,
}: {
  locale: Locale;
  brands: string[];
  notes: string[];
}) {
  const t = getDict(locale);
  const router = useRouter();
  const searchParams = useSearchParams();

  function setSort(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("sort");
    params.delete("new");
    if (value === "new") params.set("new", "1");
    else if (value) params.set("sort", value);
    const qs = params.toString();
    router.push(path(locale, `/products${qs ? `?${qs}` : ""}`));
  }

  function toggleParam(key: string, value: string, checked: boolean) {
    const params = new URLSearchParams(searchParams.toString());
    const current = params.getAll(key);
    const next = checked ? [...current, value] : current.filter((item) => item !== value);
    params.delete(key);
    next.forEach((item) => params.append(key, item));
    const qs = params.toString();
    router.push(path(locale, `/products${qs ? `?${qs}` : ""}`));
  }

  const sortValue = searchParams.get("new") === "1" ? "new" : (searchParams.get("sort") ?? "");
  const selectedGenders = searchParams.getAll("gender");
  const selectedBrands = searchParams.getAll("brand");
  const selectedNotes = searchParams.getAll("note");

  return (
    <aside className="mb-8 w-full shrink-0 md:mb-0 md:w-56">
      <p className="font-[family-name:var(--font-tommy)] text-sm font-medium">{t.sortBy}</p>
      <select className={selectClass} value={sortValue} onChange={(event) => setSort(event.target.value)}>
        <option value="">{t.sortSelect}</option>
        <option value="price-asc">{t.sortPriceAsc}</option>
        <option value="price-desc">{t.sortPriceDesc}</option>
        <option value="name">{t.sortName}</option>
        <option value="new">{t.sortNew}</option>
      </select>

      <p className="mt-8 font-[family-name:var(--font-tommy)] text-sm font-medium">{t.filter}</p>
      <p className="mt-4 font-[family-name:var(--font-tommy)] text-xs uppercase tracking-wide text-muted">
        {t.allFragrances}
      </p>
      <div className="mt-1">
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
            onChange={(checked) => toggleParam("gender", value, checked)}
          />
        ))}
      </div>

      <p className="mt-5 font-[family-name:var(--font-tommy)] text-xs uppercase tracking-wide text-muted">
        {t.nav.brands}
      </p>
      <div className="mt-1 max-h-48 overflow-y-auto">
        {brands.map((brand) => (
          <CheckboxRow
            key={brand}
            label={brand}
            checked={selectedBrands.includes(brand)}
            onChange={(checked) => toggleParam("brand", brand, checked)}
          />
        ))}
      </div>

      <p className="mt-5 font-[family-name:var(--font-tommy)] text-xs uppercase tracking-wide text-muted">
        {t.shopByNote}
      </p>
      <div className="mt-1">
        {notes.map((note) => (
          <CheckboxRow
            key={note}
            label={t.notes[note as keyof typeof t.notes]}
            checked={selectedNotes.includes(note)}
            onChange={(checked) => toggleParam("note", note, checked)}
          />
        ))}
      </div>
    </aside>
  );
}

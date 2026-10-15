"use client";

import type { AddressDraft, SavedAddress } from "@/lib/address-book";
import { countryChoices, isCountryCode } from "@/lib/countries";
import { getDict } from "@/lib/i18n";
import { isUsState, usStateChoices } from "@/lib/us-states";
import type { Locale } from "@/lib/types";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";

const labelClass = "block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#083534]";
const fieldClass =
  "mt-2 h-11 w-full rounded-sm border border-[#d8d0c4] bg-[#f7f2ea] px-3 text-sm text-[#083534] outline-none placeholder:text-[#083534]/45 focus:border-[#c5a059]";

type AddressSuggestion = {
  id: string;
  label: string;
  address1: string;
  city: string;
  zip: string;
  countryCode: string;
  provinceCode?: string;
  magicKey?: string;
};

const emptyDraft: AddressDraft = {
  label: "",
  firstName: "",
  lastName: "",
  phone: "",
  address1: "",
  city: "",
  zip: "",
  countryCode: "US",
  provinceCode: "",
  isDefault: false,
};

export function AddressPinIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-14 w-14 text-[#9a9188]"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 21s7-5.4 7-11a7 7 0 1 0-14 0c0 5.6 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

export function SavedAddresses({ locale }: { locale: Locale }) {
  const t = getDict(locale);
  const countries = useMemo(() => countryChoices(locale), [locale]);
  const states = useMemo(() => usStateChoices(), []);
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [draft, setDraft] = useState<AddressDraft>(emptyDraft);
  const [editing, setEditing] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [openId, setOpenId] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const pickedAddress = useRef("");

  async function reload() {
    const response = await fetch("/api/addresses");
    if (!response.ok) return;
    const data = (await response.json()) as { addresses: SavedAddress[] };
    setAddresses(data.addresses);
  }

  useEffect(() => {
    void reload();
  }, []);

  useEffect(() => {
    const query = draft.address1.trim();
    if (query.length < 3 || query === pickedAddress.current) {
      setSuggestions([]);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void fetch(`/api/address?q=${encodeURIComponent(query)}`, { signal: controller.signal })
        .then(async (response) => {
          if (!response.ok || pickedAddress.current === query) return;
          const matches = (await response.json()) as AddressSuggestion[];
          setSuggestions(matches);
          setSuggestOpen(matches.length > 0);
        })
        .catch(() => {
          if (!controller.signal.aborted) setSuggestions([]);
        });
    }, 120);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [draft.address1]);

  function setField(key: keyof AddressDraft, value: string | boolean) {
    setDraft((current) => ({
      ...current,
      [key]: value,
      ...(key === "countryCode" && value !== "US" ? { provinceCode: "" } : {}),
    }));
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/addresses", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing ? { ...draft, id: editing } : draft),
    });
    if (!response.ok) {
      setError(t.deliveryAddressError);
      return;
    }
    setDraft(emptyDraft);
    setEditing(null);
    setError("");
    setFormOpen(false);
    await reload();
  }

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
    setDraft(emptyDraft);
    setError("");
    setSuggestions([]);
    setSuggestOpen(false);
    pickedAddress.current = "";
  }

  function applySuggestion(match: AddressSuggestion) {
    pickedAddress.current = match.address1;
    setDraft((current) => ({
      ...current,
      address1: match.address1,
      city: match.city || current.city,
      zip: match.zip || current.zip,
      countryCode: isCountryCode(match.countryCode) ? match.countryCode : current.countryCode,
      provinceCode: isUsState(match.provinceCode ?? "")
        ? (match.provinceCode ?? "").toUpperCase()
        : match.countryCode && match.countryCode !== "US"
          ? ""
          : current.provinceCode,
    }));
  }

  async function chooseSuggestion(match: AddressSuggestion) {
    setSuggestions([]);
    setSuggestOpen(false);
    applySuggestion(match);
    if (!match.magicKey) return;
    try {
      const response = await fetch(
        `/api/address?magicKey=${encodeURIComponent(match.magicKey)}&text=${encodeURIComponent(match.label)}`,
      );
      if (!response.ok) return;
      const detail = (await response.json()) as AddressSuggestion;
      if (detail.address1) applySuggestion(detail);
    } catch {
      /* the street line is already filled */
    }
  }

  async function remove(id: number) {
    const response = await fetch(`/api/addresses?id=${id}`, { method: "DELETE" });
    if (!response.ok) return;
    if (editing === id) {
      setEditing(null);
      setDraft(emptyDraft);
    }
    await reload();
  }

  const showForm = formOpen;

  if (!showForm && addresses.length === 0) {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center px-4 py-10 text-center">
        <AddressPinIcon />
        <h1 className="mt-5 text-lg font-medium text-[#111]">{t.noSavedAddresses}</h1>
        <p className="mt-2 text-sm text-[#6b7280]">{t.emptyAddressesHint}</p>
        <button
          type="button"
          className="mt-6 inline-flex h-11 items-center rounded-[2px] bg-[#c5a059] px-8 text-xs font-semibold uppercase tracking-[0.12em] text-[#083534] transition-colors hover:bg-[#a9884a]"
          onClick={() => setFormOpen(true)}
        >
          {t.addAddress}
        </button>
      </div>
    );
  }

  return (
    <section className="max-w-xl">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-[22px] font-medium text-[#111]">{t.savedAddresses}</h2>
        {addresses.length > 0 && !showForm ? (
          <button
            type="button"
            className="text-sm text-[#083534] underline decoration-[#c5a059] underline-offset-4"
            onClick={() => {
              setEditing(null);
              setDraft(emptyDraft);
              setError("");
              setFormOpen(true);
            }}
          >
            {t.addAddress}
          </button>
        ) : null}
      </div>
      {addresses.length ? (
        <ul className="mt-4 space-y-3">
          {addresses.map((address) => {
            const open = openId === address.id;
            return (
              <li key={address.id} className="rounded-md border border-[#e4e4e7] px-4 py-3 text-sm text-[#111]">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-semibold">
                    {address.label || `${address.firstName} ${address.lastName}`}
                    {address.isDefault ? <span className="ml-2 font-medium text-[#c5a059]">{t.defaultAddress}</span> : null}
                  </p>
                  <button
                    type="button"
                    className="shrink-0 text-[#083534] underline decoration-[#c5a059] underline-offset-4"
                    onClick={() => setOpenId(open ? null : address.id)}
                  >
                    {open ? t.hideDetails : t.showDetails}
                  </button>
                </div>
                {open ? (
                  <>
                    <p className="mt-1 text-[#4b5563]">
                      {address.firstName} {address.lastName}
                    </p>
                    <p className="mt-1 text-[#4b5563]">
                      {address.address1}, {address.city}
                      {address.provinceCode ? ` ${address.provinceCode}` : ""} {address.zip} {address.countryCode}
                    </p>
                    {address.phone ? <p className="mt-1 text-[#4b5563]">{address.phone}</p> : null}
                    <div className="mt-2 flex gap-4">
                      <button
                        type="button"
                        className="text-[#083534] underline decoration-[#c5a059] underline-offset-4"
                        onClick={() => {
                          setEditing(address.id);
                          setDraft(address);
                          setError("");
                          setFormOpen(true);
                        }}
                      >
                        {t.editAddress}
                      </button>
                      <button type="button" className="text-[#b3413a]" onClick={() => void remove(address.id)}>
                        {t.deleteAddress}
                      </button>
                    </div>
                  </>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}

      {showForm ? (
      <form className="mt-6" onSubmit={(event) => void save(event)}>
        <label className={labelClass}>
          {t.addressLabel}
          <input
            value={draft.label}
            onChange={(event) => setField("label", event.target.value)}
            placeholder={t.addressNameHint}
            className={fieldClass}
          />
        </label>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className={labelClass}>
            {t.firstName}
            <input required value={draft.firstName} onChange={(event) => setField("firstName", event.target.value)} className={fieldClass} />
          </label>
          <label className={labelClass}>
            {t.lastName}
            <input required value={draft.lastName} onChange={(event) => setField("lastName", event.target.value)} className={fieldClass} />
          </label>
        </div>
        <label className={`${labelClass} relative mt-4 ${suggestOpen ? "z-30" : ""}`}>
          {t.address}
          <input
            required
            autoComplete="off"
            value={draft.address1}
            onChange={(event) => setField("address1", event.target.value)}
            onFocus={() => suggestions.length && setSuggestOpen(true)}
            onBlur={() => window.setTimeout(() => setSuggestOpen(false), 150)}
            className={fieldClass}
          />
          {suggestOpen && suggestions.length ? (
            <ul className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-sm border border-[#d8d0c4] bg-white shadow-lg normal-case tracking-normal">
              {suggestions.map((match) => (
                <li key={match.id}>
                  <button
                    type="button"
                    onMouseDown={(event) => {
                      event.preventDefault();
                      void chooseSuggestion(match);
                    }}
                    className="w-full px-3 py-2 text-left text-sm font-normal text-[#083534] hover:bg-[#f7f2ea]"
                  >
                    {match.label}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </label>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className={labelClass}>
            {t.city}
            <input required value={draft.city} onChange={(event) => setField("city", event.target.value)} className={fieldClass} />
          </label>
          <label className={labelClass}>
            {t.postalCode}
            <input value={draft.zip} onChange={(event) => setField("zip", event.target.value)} className={fieldClass} />
          </label>
          {draft.countryCode === "US" ? (
            <label className={labelClass}>
              {t.state}
              <select required value={draft.provinceCode} onChange={(event) => setField("provinceCode", event.target.value)} className={fieldClass}>
                <option value="">{t.state}</option>
                {states.map((state) => (
                  <option key={state.code} value={state.code}>
                    {state.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <label className={labelClass}>
            {t.country}
            <select value={draft.countryCode} onChange={(event) => setField("countryCode", event.target.value)} className={fieldClass}>
              {countries.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            {t.phone}
            <input value={draft.phone} onChange={(event) => setField("phone", event.target.value)} className={fieldClass} />
          </label>
        </div>
        <label className="mt-4 flex items-center gap-2 text-sm text-[#111]">
          <input type="checkbox" checked={draft.isDefault} onChange={(event) => setField("isDefault", event.target.checked)} />
          {t.defaultAddress}
        </label>
        {error ? <p className="mt-3 text-sm text-[#b3413a]">{error}</p> : null}
        <div className="mt-4 flex items-center gap-4">
          <button type="submit" className="inline-flex h-11 items-center rounded-[2px] bg-[#c5a059] px-8 text-xs font-semibold uppercase tracking-[0.12em] text-[#083534] transition-colors hover:bg-[#a9884a]">
            {editing ? t.saveChanges : t.addAddress}
          </button>
          <button type="button" className="text-sm text-[#6b7280]" onClick={closeForm}>
            {t.hideDetails}
          </button>
        </div>
      </form>
      ) : null}
    </section>
  );
}

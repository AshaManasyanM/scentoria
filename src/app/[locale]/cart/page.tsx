"use client";

import { CartBagIcon } from "@/components/account-empty-state";
import { useCart } from "@/components/cart-provider";
import type { SavedAddress } from "@/lib/address-book";
import { countryChoices, isCountryCode } from "@/lib/countries";
import { isUsState, usStateChoices } from "@/lib/us-states";
import { checkoutQuote, type CartCostQuote } from "@/lib/checkout-quote";
import { discountPercent, formatExactMoney, formatMoney } from "@/lib/format";
import { getDict, isLocale } from "@/lib/i18n";
import {
  customerShippingChoices,
  selectedShippingTotal,
  formatDayRange,
  shippingComparison,
  shippingFacts,
  type ShippingChoice,
  type ShippingSelection,
} from "@/lib/shipping-choices";
import { path } from "@/lib/path";
import type { CartLine, Money } from "@/lib/types";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";

function Steps({ labels, active }: { labels: string[]; active: number }) {
  return (
    <ol className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
      {labels.map((label, index) => {
        const on = index === active;
        return (
          <li key={label} className="flex items-center gap-3">
            {index > 0 ? <span className="h-px w-8 bg-[#e1e1e1] sm:w-14" /> : null}
            <span className={`flex items-center gap-2 ${on ? "text-[#1f6b45]" : "text-[#b5b5b5]"}`}>
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs ${
                  on ? "border-[#1f6b45]" : "border-[#d7d7d7]"
                }`}
              >
                {index + 1}
              </span>
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path strokeLinecap="round" d="M4 7h16" />
      <path strokeLinecap="round" d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.5 7l.8 12.2A1.5 1.5 0 0 0 8.8 20.5h6.4a1.5 1.5 0 0 0 1.5-1.3L17.5 7" />
      <path strokeLinecap="round" d="M10 11v6M14 11v6" />
    </svg>
  );
}

function sizeLabel(title: string) {
  const cleaned = title.trim();
  if (!cleaned || /^default title$/i.test(cleaned)) return "";
  return cleaned.replace(/\s*\/\s*[\d.]+\s*oz$/i, "");
}

export default function CartPage() {
  const params = useParams<{ locale: string }>();
  const locale = isLocale(params.locale) ? params.locale : "en";
  const t = getDict(locale);
  const { cart, updateQty } = useCart();
  const [code, setCode] = useState("");
  const [codeNote, setCodeNote] = useState("");
  const [step, setStep] = useState(0);
  const [payUrl, setPayUrl] = useState<string | null>(null);
  const [shippingOptions, setShippingOptions] = useState<ShippingChoice[]>([]);
  const [shippingSelection, setShippingSelection] = useState<ShippingSelection[]>([]);
  const [shippingNotice, setShippingNotice] = useState("");
  const [ratesPending, setRatesPending] = useState(false);
  const [shopifyCost, setShopifyCost] = useState<CartCostQuote | null>(null);
  const shippingCost = selectedShippingTotal(shippingOptions, shippingSelection);
  const cartKey = cart.lines.map((line) => `${line.merchandiseId}:${line.quantity}`).join("|");
  const currency = cart.lines[0]?.price.currencyCode ?? "AMD";
  const count = cart.lines.reduce((sum, line) => sum + line.quantity, 0);
  const money = (amount: number): Money => ({ amount: String(amount), currencyCode: currency });

  let products = 0;
  let payable = 0;
  for (const line of cart.lines) {
    const price = Number(line.price.amount);
    const compare = Number(line.compareAtPrice?.amount);
    const list = compare > price ? compare : price;
    products += list * line.quantity;
    payable += price * line.quantity;
  }
  const discount = Math.max(0, products - payable);
  const quote = checkoutQuote(shopifyCost, {
    products: payable,
    shipping: shippingAmount(shippingCost, currency),
    currency,
  });

  if (cart.lines.length === 0) {
    return (
      <section className="bg-white px-4 py-10 md:px-8 md:py-14">
        <div className="mx-auto max-w-[1080px]">
          <Steps labels={checkoutSteps(t)} active={0} />
          <h1 className="mt-8 font-serif text-4xl text-[#161616] md:text-5xl">{t.yourOrder}</h1>
          <div className="flex min-h-[280px] flex-col items-center justify-center text-center">
            <CartBagIcon className="h-14 w-14 text-[#9a9188]" />
            <p className="mt-5 text-[15px] leading-7 text-[#083534]">{t.emptyCart}</p>
            <p className="mt-2 max-w-md text-sm leading-6 text-[#6b7280]">{t.emptyCartHint}</p>
            <Link
              href={path(locale, "/products")}
              className="mt-6 inline-flex rounded-[2px] bg-[#083534] px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.08em] text-[#f7f2ea]"
            >
              {t.viewAllProducts}
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white px-4 py-8 md:px-8 md:py-12">
      <div className="mx-auto max-w-[1080px]">
        <Steps labels={checkoutSteps(t)} active={step} />
        <div className="mt-8 flex items-baseline gap-3">
          <h1 className="font-serif text-4xl text-[#161616] md:text-[52px] md:leading-none">
            {step === 0 ? t.yourOrder : step === 1 ? t.addressTitle : step === 2 ? t.deliveryTitle : t.paymentTitle}
          </h1>
          {step === 0 ? (
            <p className="text-sm text-[#8a8a8a]">{count === 1 ? t.oneItem : t.itemsCount.replace("{count}", String(count))}</p>
          ) : null}
        </div>

        {step > 0 ? (
          <div className={step === 1 ? "" : "hidden"}>
            <DeliveryStep
              locale={locale}
              labels={t}
              step={step}
              cartKey={cartKey}
              preference={shippingSelection}
              onPending={setRatesPending}
              onBack={() => setStep(0)}
              productsLabel={formatMoney(money(products), locale)}
              onReady={(result) => {
                setShippingOptions(result.options);
                setShippingSelection(result.selection);
                setShopifyCost(result.cost);
                setPayUrl(result.selectionMissing || !result.options.length ? null : result.checkoutUrl);
                setShippingNotice(
                  result.notice
                    ? result.notice
                    : result.selectionMissing
                      ? t.shippingSelectionGone
                      : result.options.length
                        ? ""
                        : t.shippingUnavailable,
                );
                setStep(2);
              }}
            />
          </div>
        ) : null}
        {step === 2 ? (
          <ShippingStep
            labels={t}
            options={shippingOptions}
            selection={shippingSelection}
            notice={shippingNotice}
            ratesPending={ratesPending}
            initialUrl={payUrl}
            onBack={() => setStep(1)}
            onChosen={(selection, options, url, cost) => {
              setShippingSelection(selection);
              setShippingOptions(options);
              setShopifyCost(cost);
              setPayUrl(url);
              setShippingNotice("");
            }}
            onPay={(url) => {
              setPayUrl(url);
              setStep(3);
            }}
          />
        ) : null}
        {step === 3 && payUrl ? (
          <PaymentStep
            labels={t}
            payUrl={payUrl}
            productsLabel={formatMoney(money(payable), locale)}
            shipping={shippingCost}
            quote={quote}
            onBack={() => setStep(2)}
          />
        ) : null}
        <div className={`mt-6 rounded-[28px] bg-[#083534] px-4 py-5 text-white md:px-8 md:py-8 ${step === 0 ? "" : "hidden"}`}>
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center">
            <div className="min-w-0 flex-1 space-y-6">
              {cart.lines.map((line) => (
                <OrderLine key={line.id} line={line} locale={locale} removeLabel={t.remove} onQty={updateQty} />
              ))}
            </div>

            <aside className="flex w-full shrink-0 flex-col rounded-[22px] border border-white/25 p-4 lg:w-[360px] lg:p-5">
              <form
                className="flex gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  setCodeNote(code.trim() ? t.promoInvalid : "");
                }}
              >
                <input
                  value={code}
                  onChange={(event) => {
                    setCode(event.target.value);
                    setCodeNote("");
                  }}
                  placeholder={t.promoCode}
                  className="h-11 min-w-0 flex-1 rounded-xl border border-white/20 bg-black/20 px-3 text-sm text-white outline-none placeholder:text-white/45"
                />
                <button
                  type="submit"
                  className="h-11 shrink-0 rounded-xl border border-white/30 px-4 text-sm text-white"
                >
                  {t.filterApply}
                </button>
              </form>
              {codeNote ? <p className="mt-2 text-xs text-white/70">{codeNote}</p> : null}

              <dl className="mt-5 space-y-3 text-sm text-white/80">
                <div className="flex items-center justify-between gap-4">
                  <dt>{t.productsTotal}</dt>
                  <dd className="text-white">{formatMoney(money(products), locale)}</dd>
                </div>
                {discount > 0 ? (
                  <div className="flex items-center justify-between gap-4">
                    <dt>{t.discounts}</dt>
                    <dd className="text-white">-{formatMoney(money(discount), locale)}</dd>
                  </div>
                ) : null}
                <div className="flex items-center justify-between gap-4">
                  <dt>{t.delivery}</dt>
                  <dd className="text-white">{t.freeDelivery}</dd>
                </div>
              </dl>

              <div className="mt-4 flex items-end justify-between gap-4 border-t border-white/15 pt-4">
                <p className="text-sm text-white/80">{t.orderTotal}</p>
                <p className="text-2xl font-medium tracking-tight">{formatMoney(money(payable), locale)}</p>
              </div>

              {cart.checkoutUrl ? (
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="mt-5 flex h-12 items-center justify-center rounded-xl bg-white text-sm font-medium text-[#083534]"
                >
                  {t.nextAddress} →
                </button>
              ) : (
                <p className="mt-5 text-center text-sm leading-6 text-white/70">
                  Connect the Shopify Storefront token to enable checkout. See ADMIN.md.
                </p>
              )}
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
}

const checkoutSteps = (t: ReturnType<typeof getDict>) => [t.stepBag, t.stepAddress, t.stepDelivery, t.stepPayment];

type DeliveryRates = {
  options: ShippingChoice[];
  checkoutUrl: string;
  selection: ShippingSelection[];
  selectionMissing: boolean;
  cost: CartCostQuote | null;
  notice?: string;
};

function shippingAmount(money: Money | null, currency: string) {
  if (!money || money.currencyCode !== currency) return 0;
  const amount = Number(money.amount);
  return Number.isFinite(amount) ? amount : 0;
}

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

const countryChevron = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 7.5 10 12.5 15 7.5"/></svg>`,
)}")`;

function DeliveryStep({
  locale,
  labels: t,
  step,
  cartKey,
  preference,
  onPending,
  onBack,
  productsLabel,
  onReady,
}: {
  locale: "en" | "hy";
  labels: ReturnType<typeof getDict>;
  step: number;
  cartKey: string;
  preference: ShippingSelection[];
  onPending: (pending: boolean) => void;
  onBack: () => void;
  productsLabel: string;
  onReady: (result: DeliveryRates) => void;
}) {
  const [form, setForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    address1: "",
    city: "",
    zip: "",
    countryCode: "AM",
    provinceCode: "",
  });
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const pickedAddress = useRef("");
  const formRef = useRef(form);
  const preferenceRef = useRef(preference);
  const ratedKey = useRef<string | null>(null);
  const requestId = useRef(0);
  const countries = useMemo(() => countryChoices(locale), [locale]);
  const states = useMemo(() => usStateChoices(), []);
  const field = "h-11 w-full rounded-xl border border-white/20 bg-black/20 px-3 text-sm text-white outline-none placeholder:text-white/40";

  useEffect(() => {
    formRef.current = form;
    preferenceRef.current = preference;
  }, [form, preference]);

  useEffect(() => {
    void fetch("/api/addresses").then(async (response) => {
      if (!response.ok) return;
      const data = (await response.json()) as { addresses?: SavedAddress[] };
      setSavedAddresses(data.addresses ?? []);
    });
  }, []);

  useEffect(() => {
    const query = form.address1.trim();
    if (query.length < 3 || query === pickedAddress.current) {
      setSuggestions([]);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/address?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });
        if (!res.ok) return;
        const matches = (await res.json()) as AddressSuggestion[];
        if (pickedAddress.current === query) return;
        setSuggestions(matches);
        setSuggestOpen(matches.length > 0);
      } catch {
        if (!controller.signal.aborted) setSuggestions([]);
      }
    }, 120);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [form.address1]);

  function applyAddress(match: AddressSuggestion) {
    pickedAddress.current = match.address1;
    setForm((current) => ({
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
    setError("");
  }

  async function chooseAddress(match: AddressSuggestion) {
    setSuggestions([]);
    setSuggestOpen(false);
    applyAddress(match);
    if (!match.magicKey) return;
    try {
      const res = await fetch(
        `/api/address?magicKey=${encodeURIComponent(match.magicKey)}&text=${encodeURIComponent(match.label)}`,
      );
      if (!res.ok) return;
      const detail = (await res.json()) as AddressSuggestion;
      if (detail.address1) applyAddress(detail);
    } catch {
      /* the street line is already filled */
    }
  }

  function applySaved(address: SavedAddress) {
    pickedAddress.current = address.address1;
    setForm((current) => ({
      ...current,
      firstName: address.firstName,
      lastName: address.lastName,
      phone: address.phone,
      address1: address.address1,
      city: address.city,
      zip: address.zip,
      countryCode: isCountryCode(address.countryCode) ? address.countryCode : current.countryCode,
      provinceCode: address.provinceCode,
    }));
    setError("");
  }

  function set(key: keyof typeof form, value: string) {
    setForm((current) => ({
      ...current,
      [key]: value,
      ...(key === "countryCode" && value !== "US" ? { provinceCode: "" } : {}),
    }));
    setError("");
  }

  async function requestRates(delivery: typeof form, key: string) {
    const id = ++requestId.current;
    setPending(true);
    onPending(true);
    setError("");
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delivery", delivery, selected: preferenceRef.current }),
      });
      const data = (await res.json()) as {
        ok: boolean;
        error?: string;
        checkoutUrl?: string;
        options?: ShippingChoice[];
        selection?: ShippingSelection[];
        selectionMissing?: boolean;
        cost?: CartCostQuote | null;
      };
      if (id !== requestId.current) return;
      if (!data.ok || !data.checkoutUrl || !data.options) {
        const message =
          data.error === "rate"
            ? t.tooManyAttempts
            : data.error === "stock"
              ? t.deliveryStock
              : data.error === "market"
                ? t.deliveryMarketError
                : data.error === "address"
                  ? t.deliveryAddressError
                  : data.error === "shipping"
                    ? t.shippingUnavailable
                    : t.deliverySaveError;
        setError(message);
        if (ratedKey.current) {
          onReady({ options: [], checkoutUrl: "", selection: [], selectionMissing: false, cost: null, notice: message });
        }
        return;
      }
      ratedKey.current = key;
      onReady({
        options: data.options,
        checkoutUrl: data.checkoutUrl,
        selection: data.selection ?? [],
        selectionMissing: Boolean(data.selectionMissing),
        cost: data.cost ?? null,
      });
    } catch {
      if (id === requestId.current) {
        setError(t.deliverySaveError);
        if (ratedKey.current) {
          onReady({ options: [], checkoutUrl: "", selection: [], selectionMissing: false, cost: null, notice: t.deliverySaveError });
        }
      }
    } finally {
      if (id === requestId.current) {
        setPending(false);
        onPending(false);
      }
    }
  }

  useEffect(() => {
    if (step < 2 || !ratedKey.current || ratedKey.current === cartKey) return;
    void requestRates(formRef.current, cartKey);
    // Rates are refreshed only after the cart itself changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartKey, step]);

  function submit(event: FormEvent) {
    event.preventDefault();
    void requestRates(form, cartKey);
  }

  return (
    <form onSubmit={submit} className="mt-6 rounded-[28px] bg-[#083534] px-4 py-5 text-white md:px-8 md:py-8">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1">
          <button type="button" onClick={onBack} className="text-sm text-white/70">
            ← {t.backToBag}
          </button>
          {savedAddresses.length ? (
            <label className="mt-4 block text-xs text-white/70">
              {t.useSavedAddress}
              <select
                defaultValue=""
                onChange={(event) => {
                  const address = savedAddresses.find((item) => String(item.id) === event.target.value);
                  if (address) applySaved(address);
                }}
                className={`${field} mt-1`}
              >
                <option value="" className="text-[#083534]">
                  {t.useSavedAddress}
                </option>
                {savedAddresses.map((address) => (
                  <option key={address.id} value={address.id} className="text-[#083534]">
                    {address.label || `${address.firstName} ${address.lastName}, ${address.city}`}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-xs text-white/70">
              {t.email}
              <input required type="email" value={form.email} onChange={(event) => set("email", event.target.value)} className={`${field} mt-1`} />
            </label>
            <label className="text-xs text-white/70">
              {t.phone}
              <input value={form.phone} onChange={(event) => set("phone", event.target.value)} className={`${field} mt-1`} />
            </label>
            <label className="text-xs text-white/70">
              {t.firstName}
              <input required value={form.firstName} onChange={(event) => set("firstName", event.target.value)} className={`${field} mt-1`} />
            </label>
            <label className="text-xs text-white/70">
              {t.lastName}
              <input required value={form.lastName} onChange={(event) => set("lastName", event.target.value)} className={`${field} mt-1`} />
            </label>
            <label className={`relative text-xs text-white/70 sm:col-span-2 ${suggestOpen ? "z-30" : ""}`}>
              {t.address}
              <input
                required
                autoComplete="off"
                value={form.address1}
                onChange={(event) => set("address1", event.target.value)}
                onFocus={() => suggestions.length && setSuggestOpen(true)}
                onBlur={() => window.setTimeout(() => setSuggestOpen(false), 150)}
                className={`${field} mt-1`}
              />
              {suggestOpen && suggestions.length ? (
                <ul className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-xl border border-white/20 bg-[#062826] shadow-lg">
                  {suggestions.map((match) => (
                    <li key={match.id}>
                      <button
                        type="button"
                        onMouseDown={(event) => {
                          event.preventDefault();
                          chooseAddress(match);
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-white hover:bg-white/10"
                      >
                        {match.label}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </label>
            <label className="text-xs text-white/70">
              {t.city}
              <input required value={form.city} onChange={(event) => set("city", event.target.value)} className={`${field} mt-1`} />
            </label>
            {form.countryCode === "US" ? (
              <label className="text-xs text-white/70">
                {t.state}
                <select
                  required
                  value={form.provinceCode}
                  onChange={(event) => set("provinceCode", event.target.value)}
                  className={`${field} mt-1 appearance-none bg-no-repeat pr-12 [background-position:right_22px_center] [background-size:14px_14px]`}
                  style={{ backgroundImage: countryChevron }}
                >
                  <option value="" className="text-[#083534]">
                    {t.state}
                  </option>
                  {states.map((state) => (
                    <option key={state.code} value={state.code} className="text-[#083534]">
                      {state.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <label className="text-xs text-white/70">
              {t.postalCode}
              <input value={form.zip} onChange={(event) => set("zip", event.target.value)} className={`${field} mt-1`} />
            </label>
            <label className="text-xs text-white/70 sm:col-span-2">
              {t.country}
              <select
                value={form.countryCode}
                onChange={(event) => set("countryCode", event.target.value)}
                className={`${field} mt-1 appearance-none bg-no-repeat pr-12 [background-position:right_22px_center] [background-size:14px_14px]`}
                style={{ backgroundImage: countryChevron }}
              >
                {countries.map((country) => (
                  <option key={country.code} value={country.code} className="text-[#083534]">
                    {country.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {error ? <p className="mt-4 text-sm text-white/80">{error}</p> : null}
        </div>
        <aside className="flex w-full shrink-0 flex-col rounded-[22px] border border-white/25 p-4 lg:w-[360px] lg:p-5">
          <dl className="space-y-3 text-sm text-white/80">
            <div className="flex items-center justify-between gap-4">
              <dt>{t.productsTotal}</dt>
              <dd className="text-white">{productsLabel}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt>{t.delivery}</dt>
              <dd className="text-white">—</dd>
            </div>
          </dl>
          <button type="submit" disabled={pending} className="mt-5 flex h-12 items-center justify-center rounded-xl bg-white text-sm font-medium text-[#083534] disabled:opacity-60">
            {pending ? t.shippingLoading : `${t.nextDelivery} →`}
          </button>
          <p className="mt-3 text-center text-xs leading-5 text-white/60">{t.paymentOnShopify}</p>
        </aside>
      </div>
    </form>
  );
}

function shippingPrice(option: ShippingChoice, freeLabel: string) {
  if (Number(option.amount) === 0) return freeLabel;
  return formatExactMoney(option);
}

function optionHeading(option: ShippingChoice, t: ReturnType<typeof getDict>) {
  if (option.kind === "cheapest") return t.shippingCheapest;
  if (option.kind === "faster") return t.shippingFaster;
  return option.title || t.shippingMethod;
}

function optionDetail(option: ShippingChoice) {
  const facts = shippingFacts(option);
  const lines: string[] = [];
  const title = option.title.trim();
  const named = facts.carrier && !title.toLowerCase().startsWith(facts.carrier.toLowerCase())
    ? `${facts.carrier} · ${title}`
    : title;
  if ((option.kind === "cheapest" || option.kind === "faster") && named) lines.push(named);
  else if (option.kind === "option" && facts.carrier && named !== title) lines.push(facts.carrier);
  if (option.description && option.description !== option.title && !lines.includes(option.description) && !deliveryAlreadyShown(option)) {
    lines.push(option.description);
  }
  return lines.join(" — ");
}

function deliveryAlreadyShown(option: ShippingChoice) {
  return Boolean(shippingFacts(option).days && option.description && /^\d/.test(option.description.trim()));
}

function optionDays(option: ShippingChoice, t: ReturnType<typeof getDict>) {
  const days = shippingFacts(option).days;
  if (!days) return "";
  return t.shippingBusinessDays.replace("{range}", formatDayRange(days));
}

function optionComparison(option: ShippingChoice, options: ShippingChoice[], t: ReturnType<typeof getDict>) {
  const compared = shippingComparison(option, options);
  const parts: string[] = [];
  if (compared.daysDifference) {
    const count = Math.abs(compared.daysDifference);
    const sooner = compared.daysDifference > 0;
    const label = count === 1
      ? (sooner ? t.shippingSooner : t.shippingLater)
      : (sooner ? t.shippingSoonerPlural : t.shippingLaterPlural);
    parts.push(label.replace("{count}", String(count)));
  }
  if (compared.priceDifference) {
    parts.push(`+${formatExactMoney({ amount: compared.priceDifference, currencyCode: option.currencyCode })}`);
  }
  return parts.join(" · ");
}

function ShippingStep({
  labels: t,
  options,
  selection,
  notice,
  ratesPending,
  initialUrl,
  onBack,
  onChosen,
  onPay,
}: {
  labels: ReturnType<typeof getDict>;
  options: ShippingChoice[];
  selection: ShippingSelection[];
  notice: string;
  ratesPending: boolean;
  initialUrl: string | null;
  onBack: () => void;
  onChosen: (selection: ShippingSelection[], options: ShippingChoice[], url: string, cost: CartCostQuote | null) => void;
  onPay: (url: string) => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const cost = selectedShippingTotal(options, selection);
  const ready = Boolean(cost && initialUrl && !ratesPending && !pending);

  async function choose(option: ShippingChoice) {
    if (ratesPending || pending) return;
    const next = [
      ...selection.filter((item) => item.groupId !== option.groupId),
      { groupId: option.groupId, handle: option.handle },
    ];
    setPending(true);
    setError("");
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "shipping", selected: next }),
      });
      const data = (await res.json()) as {
        ok: boolean;
        error?: string;
        checkoutUrl?: string;
        confirmed?: {
          groupId: string;
          handle: string;
          title: string;
          description: string;
          amount: string;
          currencyCode: string;
        }[];
        cost?: CartCostQuote | null;
      };
      if (!data.ok || !data.checkoutUrl || !data.confirmed) {
        setError(data.error === "unavailable" ? t.shippingSelectionGone : t.shippingUpdateError);
        return;
      }
      const priced = customerShippingChoices(options.map((item) => {
        const match = data.confirmed?.find((confirmed) => confirmed.groupId === item.groupId && confirmed.handle === item.handle);
        if (!match) return item;
        return {
          ...item,
          title: match.title || item.title,
          description: match.description || item.description,
          amount: match.amount,
          currencyCode: match.currencyCode,
        };
      }));
      onChosen(next, priced, data.checkoutUrl, data.cost ?? null);
    } catch {
      setError(t.deliverySaveError);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-6 rounded-[28px] bg-[#083534] px-4 py-5 text-white md:px-8 md:py-8">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1">
          <button type="button" onClick={onBack} className="text-sm text-white/70">
            ← {t.backToAddress}
          </button>
          <fieldset className="mt-5" disabled={ratesPending || pending}>
            <legend className="text-xs uppercase tracking-[0.14em] text-white/55">{t.shippingMethod}</legend>
            {ratesPending ? <p className="mt-3 text-sm text-white/70">{t.shippingLoading}</p> : null}
            {notice ? <p className="mt-3 text-sm text-white/80">{notice}</p> : null}
            {error ? <p className="mt-3 text-sm text-white/80">{error}</p> : null}
            {!ratesPending && !options.length && !notice ? <p className="mt-3 text-sm text-white/80">{t.shippingUnavailable}</p> : null}
            <div className="mt-3 space-y-3">
              {options.map((option) => {
                const key = `${option.groupId}:${option.handle}`;
                const on = selection.some((item) => item.groupId === option.groupId && item.handle === option.handle);
                const detail = optionDetail(option);
                const days = optionDays(option, t);
                const comparison = optionComparison(option, options, t);
                return (
                  <label
                    key={key}
                    className={`flex cursor-pointer items-center justify-between gap-4 rounded-2xl border px-4 py-4 transition-colors ${
                      on ? "border-[#c5a059] bg-[#c5a059]/12" : "border-white/15 bg-black/15 hover:border-white/35"
                    }`}
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <input
                        type="radio"
                        name={`shipping-${option.groupId}`}
                        checked={on}
                        onChange={() => void choose(option)}
                        className="sr-only"
                      />
                      <span
                        aria-hidden
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                          on ? "border-[#c5a059]" : "border-white/40"
                        }`}
                      >
                        <span className={`h-2.5 w-2.5 rounded-full bg-[#c5a059] ${on ? "opacity-100" : "opacity-0"}`} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[15px] font-medium leading-5">{optionHeading(option, t)}</span>
                        {detail ? <span className="mt-0.5 block text-xs leading-4 text-white/55">{detail}</span> : null}
                        {days ? <span className="mt-0.5 block text-xs leading-4 text-white/55">{days}</span> : null}
                        {comparison ? (
                          <span className={`mt-0.5 block text-xs leading-4 ${on ? "text-[#c5a059]" : "text-white/80"}`}>{comparison}</span>
                        ) : null}
                      </span>
                    </span>
                    <span className={`shrink-0 text-sm font-medium tabular-nums ${on ? "text-[#c5a059]" : "text-white"}`}>
                      {shippingPrice(option, t.shippingFree)}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        </div>
        <aside className="flex w-full shrink-0 flex-col rounded-[22px] border border-white/25 p-4 lg:w-[360px] lg:p-5">
          <dl className="space-y-3 text-sm text-white/80">
            <div className="flex items-center justify-between gap-4">
              <dt>{t.delivery}</dt>
              <dd className="text-white">{cost ? (Number(cost.amount) === 0 ? t.shippingFree : formatExactMoney(cost)) : "—"}</dd>
            </div>
          </dl>
          <button
            type="button"
            disabled={!ready}
            onClick={() => {
              if (!initialUrl || !cost) return;
              onPay(initialUrl);
            }}
            className="mt-5 flex h-12 items-center justify-center rounded-xl bg-white text-sm font-medium text-[#083534] disabled:opacity-60"
          >
            {ratesPending || pending ? t.shippingLoading : `${t.nextPayment} →`}
          </button>
        </aside>
      </div>
    </div>
  );
}

function PaymentStep({
  labels: t,
  payUrl,
  productsLabel,
  shipping,
  quote,
  onBack,
}: {
  labels: ReturnType<typeof getDict>;
  payUrl: string;
  productsLabel: string;
  shipping: Money | null;
  quote: ReturnType<typeof checkoutQuote>;
  onBack: () => void;
}) {
  const payClass = "mt-5 flex h-12 items-center justify-center rounded-xl bg-white text-sm font-medium text-[#083534] disabled:opacity-60";
  const shownTotal = quote.verified ? quote.total : quote.estimatedTotal;
  return (
    <div className="mt-6 rounded-[28px] bg-[#083534] px-4 py-5 text-white md:px-8 md:py-8">
      <button type="button" onClick={onBack} className="text-sm text-white/70">
        ← {t.backToDelivery}
      </button>
      <div className="mt-6 rounded-[22px] border border-white/25 p-4 md:p-6">
        <dl className="space-y-3 text-sm text-white/80">
          <div className="flex items-center justify-between gap-4">
            <dt>{t.productsTotal}</dt>
            <dd className="text-white">{productsLabel}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt>{t.delivery}</dt>
            <dd className="text-white">
              {shipping ? (Number(shipping.amount) === 0 ? t.shippingFree : formatExactMoney(shipping)) : "—"}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt>{t.tax}</dt>
            <dd className="text-right text-white">{quote.tax ? formatExactMoney(quote.tax) : t.taxAtCheckout}</dd>
          </div>
        </dl>
        <div className="mt-4 flex items-end justify-between gap-4 border-t border-white/15 pt-4">
          <p className="text-sm text-white/80">{quote.verified ? t.orderTotal : t.estimatedTotal}</p>
          <p className="text-2xl font-medium tracking-tight">{shownTotal ? formatExactMoney(shownTotal) : "—"}</p>
        </div>
        <a href={payUrl} className={`${payClass} w-full`}>
          {t.payNow} →
        </a>
      </div>
    </div>
  );
}

function OrderLine({
  line,
  locale,
  removeLabel,
  onQty,
}: {
  line: CartLine;
  locale: "en" | "hy";
  removeLabel: string;
  onQty: (lineId: string, quantity: number) => void;
}) {
  const percent = discountPercent(line.price, line.compareAtPrice);
  const size = sizeLabel(line.variantTitle);
  const meta = [size, percent ? `-${percent}%` : ""].filter(Boolean).join(" · ");
  const linePrice: Money = { ...line.price, amount: String(Number(line.price.amount) * line.quantity) };
  const lineCompare: Money | null =
    percent && line.compareAtPrice
      ? { ...line.compareAtPrice, amount: String(Number(line.compareAtPrice.amount) * line.quantity) }
      : null;

  return (
    <div className="flex flex-wrap items-center gap-4 sm:gap-8">
      <Link
        href={path(locale, `/products/${line.handle}`)}
        className="flex h-[88px] w-[88px] shrink-0 items-center justify-center rounded-2xl bg-white p-2"
      >
        {line.image ? (
          <Image src={line.image} alt="" width={72} height={72} className="h-full w-full object-contain" />
        ) : null}
      </Link>
      <div className="min-w-0">
        {line.brand ? (
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/55">{line.brand}</p>
        ) : null}
        <Link href={path(locale, `/products/${line.handle}`)} className="block text-lg font-medium leading-6">
          {line.title}
        </Link>
        {meta ? <p className="mt-1 text-sm text-white/60">{meta}</p> : null}
        <div className="mt-3 inline-flex items-center gap-2.5 rounded-full bg-black/20 px-2.5 py-1.5 text-sm">
          <button
            type="button"
            onClick={() => onQty(line.id, line.quantity - 1)}
            className="flex h-6 w-6 items-center justify-center text-white"
            aria-label={line.quantity === 1 ? removeLabel : "Decrease quantity"}
          >
            {line.quantity === 1 ? <TrashIcon /> : "−"}
          </button>
          <span className="min-w-3 text-center">{line.quantity}</span>
          <button
            type="button"
            onClick={() => onQty(line.id, line.quantity + 1)}
            className="flex h-6 w-6 items-center justify-center text-lg leading-none"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
      </div>
      <div className="shrink-0 sm:ml-4">
        <p className="text-lg font-medium">{formatMoney(linePrice, locale)}</p>
        {lineCompare ? (
          <p className="text-sm text-white/45 line-through">{formatMoney(lineCompare, locale)}</p>
        ) : null}
      </div>
    </div>
  );
}

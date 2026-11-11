import { NAV, hrefFor } from "@/lib/nav";
import { getDict } from "@/lib/i18n";
import { path } from "@/lib/path";
import { getShopPolicies } from "@/lib/shopify/catalog";
import type { Locale } from "@/lib/types";
import Link from "next/link";
import Image from "next/image";

const policyFallback = [
  { handle: "privacy-policy", key: "privacyPolicy" as const },
  { handle: "refund-policy", key: "refundPolicy" as const },
  { handle: "shipping-policy", key: "shippingPolicy" as const },
  { handle: "terms-of-service", key: "termsOfService" as const },
];

export async function Footer({ locale, hiddenNav = [] }: { locale: Locale; hiddenNav?: string[] }) {
  const t = getDict(locale);
  const shopPolicies = await getShopPolicies();
  const policies = policyFallback.map((item) => {
    const live = shopPolicies.find((policy) => policy.handle === item.handle);
    return {
      handle: item.handle,
      title: live?.title || t[item.key],
    };
  });

  return (
    <footer className="mt-auto bg-[#083534] text-[#f7f2ea]">
      <div className="mx-auto grid max-w-[min(100%,80rem)] gap-8 px-[clamp(1rem,2.5vw,2rem)] py-[clamp(2.5rem,4vw,3.5rem)] md:grid-cols-[1.1fr_0.8fr_0.8fr_1fr] md:gap-10 xl:gap-12">
        <div className="text-center md:text-left">
          <div className="inline-flex flex-col items-center">
            <Link href={path(locale)} className="inline-flex">
              <Image
                src="/brand/scentoria-prive.png"
                alt={t.brand}
                width={220}
                height={180}
                unoptimized
                className="h-16 w-auto object-contain object-center md:h-[4.5rem]"
              />
            </Link>
            <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#c5a059]">
              {t.footerSlogan}
            </p>
          </div>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-[#c5a059]">
            {t.footerJoin}
          </p>
          <div className="mt-4 flex justify-center gap-3 md:justify-start">
            <Link
              href={path(locale, "/signup")}
              className="inline-flex rounded-[2px] bg-[#c5a059] px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.08em] text-[#083534]"
            >
              {t.signUp}
            </Link>
            <Link
              href={path(locale, "/login")}
              className="inline-flex rounded-[2px] border border-[#f7f2ea] px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.08em]"
            >
              {t.signIn}
            </Link>
          </div>
        </div>

        <nav aria-label="Footer" className="text-center md:text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#c5a059]">
            {t.navLabel}
          </p>
          <ul className="mt-5 space-y-3 text-sm">
            {NAV.filter((key) => !hiddenNav.includes(key)).map((key) => (
              <li key={key}>
                <Link href={hrefFor(locale, key)} className="hover:text-[#c5a059]">
                  {t.nav[key]}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label={t.policies} className="text-center md:text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#c5a059]">{t.policies}</p>
          <ul className="mt-5 space-y-3 text-sm">
            {policies.map((policy) => (
              <li key={policy.handle}>
                <Link href={path(locale, `/policies/${policy.handle}`)} className="hover:text-[#c5a059]">
                  {policy.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="text-center text-sm md:text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#c5a059]">{t.contact}</p>
          <p className="mt-5 text-[#f7f2ea]/80">{t.yourEmail}</p>
          <a href="mailto:scentoria.la@gmail.com" className="mt-1 block hover:text-[#c5a059]">
            scentoria.la@gmail.com
          </a>
          <p className="mt-4 text-[#f7f2ea]/80">{t.workingHours}</p>
          <p className="mt-1">{t.hoursValue}</p>
          <p className="mt-4 text-[#f7f2ea]/80">{t.followUsShort}</p>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noreferrer"
            aria-label="Instagram"
            className="mt-2 inline-flex hover:text-[#c5a059]"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
              <rect x="3" y="3" width="18" height="18" rx="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
            </svg>
          </a>
        </div>
      </div>
      <div className="mx-auto max-w-[min(100%,80rem)] px-[clamp(1rem,2.5vw,2rem)]">
        <div className="border-t border-[#f7f2ea]/30" />
        <p className="py-6 text-center text-xs text-[#f7f2ea]/80">{t.copyright}</p>
      </div>
    </footer>
  );
}

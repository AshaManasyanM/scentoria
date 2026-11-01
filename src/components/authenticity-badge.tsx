import { getDict } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

function ShieldIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-7 w-7" fill="none" aria-hidden>
      <path
        d="M24 6 10 12.2v11.2c0 9.2 6 17.6 14 21.4 8-3.8 14-12.2 14-21.4V12.2L24 6z"
        fill="#083534"
      />
      <path
        d="m18.5 24.2 4.2 4.2 8-8"
        stroke="#c5a059"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function AuthenticityBadge({ locale }: { locale: Locale }) {
  const t = getDict(locale);

  return (
    <div className="relative overflow-hidden rounded-xl border border-[#e6e6e6] bg-gradient-to-br from-white via-white to-[#f7f2ea] px-5 py-5 shadow-[0_1px_0_rgba(8,53,52,0.04)] md:px-6 md:py-6">
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-[#c5a059] via-[#c5a059] to-[#083534]"
        aria-hidden
      />
      <div className="flex items-start gap-4 pl-2 md:gap-5">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#083534]/[0.06] ring-1 ring-[#083534]/10">
          <ShieldIcon />
        </span>
        <div className="min-w-0 pt-0.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#c5a059]">
            {t.authenticShort}
          </p>
          <h2 className="mt-1.5 font-serif text-xl leading-snug text-[#083534] md:text-[22px]">
            {t.authenticTitle}
          </h2>
          <p className="mt-3 text-sm leading-7 text-[#5c564f]">{t.authenticBody}</p>
        </div>
      </div>
    </div>
  );
}

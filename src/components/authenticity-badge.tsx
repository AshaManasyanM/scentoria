import { getDict } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

function ShieldIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-6 w-6" fill="none" aria-hidden>
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
    <div className="rounded-xl border border-[#e6e6e6] bg-gradient-to-br from-white via-white to-[#f7f2ea] px-5 py-4 shadow-[0_1px_0_rgba(8,53,52,0.04)] md:px-5 md:py-5">
      <div className="flex items-center justify-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#083534]/[0.06] ring-1 ring-[#083534]/10">
          <ShieldIcon />
        </span>
        <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-[#083534] md:text-[13px]">
          {t.authenticTitle}
        </h2>
      </div>
    </div>
  );
}

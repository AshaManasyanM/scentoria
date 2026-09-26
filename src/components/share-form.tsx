import { getDict } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

const fieldClass =
  "mt-2 block h-11 w-full rounded-sm border border-[#f7f2ea] bg-[#f7f2ea] px-3 text-sm text-[#083534] outline-none placeholder:text-[#083534]/45";

export function ShareForm({ locale }: { locale: Locale }) {
  const t = getDict(locale);

  return (
    <section className="bg-[#c5a059] px-4 py-10 text-[#083534] md:px-8 md:py-20">
      <div className="mx-auto grid max-w-[1280px] items-start gap-12 md:grid-cols-[0.85fr_1.15fr] md:gap-16">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em]">• {t.contact}</p>
          <h2 className="mt-6 font-serif text-[32px] font-medium leading-[1.1] sm:text-[clamp(40px,4.5vw,56px)]">
            {t.shareTitle.split("\n").map((line, index) => (
              <span key={line} className={index === 0 ? "block sm:whitespace-nowrap" : "block"}>
                {line}
              </span>
            ))}
          </h2>
          <p className="mt-8 max-w-md text-[15px] leading-7">{t.shareDescription}</p>
          <a href="mailto:hello@scentoria.am" className="mt-8 flex items-center gap-3 text-sm">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
              <rect x="3" y="5" width="18" height="14" rx="1.5" />
              <path d="m4 7 8 6 8-6" />
            </svg>
            hello@scentoria.am
          </a>
          <a href="tel:+37400000000" className="mt-3 flex items-center gap-3 text-sm">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
              <path d="M7 3h3l1.5 4-2 1.5a12 12 0 0 0 6 6L17 13l4 1.5V18a2 2 0 0 1-2 2A15 15 0 0 1 4 5a2 2 0 0 1 2-2Z" />
            </svg>
            +374 00 000 000
          </a>
        </div>

        <form action="mailto:hello@scentoria.am" method="get" className="grid gap-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="text-[11px] font-semibold uppercase tracking-[0.12em]">
              {t.shareFullName}
              <input name="fullName" type="text" required placeholder={t.shareFullNamePh} className={fieldClass} />
            </label>
            <label className="text-[11px] font-semibold uppercase tracking-[0.12em]">
              {t.shareEmail}
              <input name="email" type="email" required placeholder={t.shareEmailPh} className={fieldClass} />
            </label>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="text-[11px] font-semibold uppercase tracking-[0.12em]">
              {t.shareSubject}
              <input name="subject" type="text" required placeholder={t.shareSubjectPh} className={fieldClass} />
            </label>
            <label className="text-[11px] font-semibold uppercase tracking-[0.12em]">
              {t.sharePhone}
              <input name="phone" type="tel" placeholder={t.sharePhonePh} className={fieldClass} />
            </label>
          </div>
          <label className="text-[11px] font-semibold uppercase tracking-[0.12em]">
            {t.shareDetails}
            <textarea
              name="details"
              rows={6}
              placeholder={t.shareDetailsPh}
              className={`${fieldClass} h-auto min-h-[140px] py-3`}
            />
          </label>
          <button
            type="submit"
            className="mt-1 inline-flex w-fit rounded-[2px] bg-[#083534] px-8 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#f7f2ea]"
          >
            {t.shareSubmit}
          </button>
        </form>
      </div>
    </section>
  );
}

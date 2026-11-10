"use client";

import { sendContactMessage } from "@/lib/contact-message";
import { getDict } from "@/lib/i18n";
import type { Locale } from "@/lib/types";
import { useActionState, useEffect, useRef } from "react";

const fieldClass =
  "mt-2 block h-11 w-full rounded-xl border border-[#f7f2ea]/0 bg-[#f7f2ea] px-3 text-sm text-[#083534] outline-none placeholder:text-[#083534]/45";

export function ShareForm({ locale }: { locale: Locale }) {
  const t = getDict(locale);
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState(sendContactMessage, null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <section className="bg-[#c5a059] px-[clamp(1rem,2.5vw,2rem)] py-[clamp(2rem,4vw,3.25rem)] text-[#083534]">
      <div className="mx-auto grid max-w-[min(100%,72rem)] items-start gap-8 md:grid-cols-[0.9fr_1.1fr] md:gap-12">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em]">• {t.contact}</p>
          <h2 className="mt-3 font-serif text-[clamp(1.5rem,1.1rem+1.2vw,2rem)] font-medium leading-[1.2]">
            {t.shareTitle.split("\n").map((line, index) => (
              <span key={line} className={index === 0 ? "block sm:whitespace-nowrap" : "block"}>
                {line}
              </span>
            ))}
          </h2>
          <p className="mt-4 max-w-md text-sm leading-6 md:text-[15px] md:leading-7">{t.shareDescription}</p>
          <a href="mailto:scentoria.la@gmail.com" className="mt-6 flex items-center gap-3 text-sm">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
              <rect x="3" y="5" width="18" height="14" rx="1.5" />
              <path d="m4 7 8 6 8-6" />
            </svg>
            scentoria.la@gmail.com
          </a>
          <a href="tel:+37400000000" className="mt-3 flex items-center gap-3 text-sm">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
              <path d="M7 3h3l1.5 4-2 1.5a12 12 0 0 0 6 6L17 13l4 1.5V18a2 2 0 0 1-2 2A15 15 0 0 1 4 5a2 2 0 0 1 2-2Z" />
            </svg>
            +374 00 000 000
          </a>
        </div>

        <form ref={formRef} action={action} className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-[11px] font-semibold uppercase tracking-[0.12em]">
              {t.shareFullName}
              <input name="fullName" type="text" required placeholder={t.shareFullNamePh} className={fieldClass} />
            </label>
            <label className="text-[11px] font-semibold uppercase tracking-[0.12em]">
              {t.shareEmail}
              <input name="email" type="email" required placeholder={t.shareEmailPh} className={fieldClass} />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
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
              rows={5}
              placeholder={t.shareDetailsPh}
              className={`${fieldClass} h-auto min-h-[120px] py-3`}
            />
          </label>
          <button
            type="submit"
            disabled={pending}
            className="mt-1 inline-flex w-fit rounded-full bg-[#083534] px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#f7f2ea] transition hover:bg-[#0e4544] disabled:opacity-60"
          >
            {t.shareSubmit}
          </button>
          {state?.ok ? <p className="text-sm">{t.shareSent}</p> : null}
          {state && !state.ok ? <p className="text-sm">{t.shareSendFailed}</p> : null}
        </form>
      </div>
    </section>
  );
}

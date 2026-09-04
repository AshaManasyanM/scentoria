import { getDict } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

const fieldClass =
  "mt-1 block h-10 w-full rounded-[4px] border border-line bg-white px-3 text-sm text-fg outline-none";

export function ShareForm({ locale }: { locale: Locale }) {
  const t = getDict(locale);

  return (
    <section className="mx-auto bg-gold-2 px-4 py-10 text-white md:min-h-[850px] md:px-[5px]">
      <div className="mt-2 mb-4 flex flex-col items-center gap-0.5 text-center md:mb-10">
        <h2 className="font-serif text-[clamp(28px,5.56vw,48px)] font-medium leading-tight sm:leading-[1.2] md:leading-tight">
          {t.shareTitle}
        </h2>
        <p className="mb-2 max-w-[900px] px-2.5 text-[clamp(14px,3.4vw,22px)] leading-relaxed tracking-[0.25px] md:mb-6 md:px-[30px]">
          {t.shareDescription}
        </p>
      </div>

      <form
        action="mailto:hello@scentoria.am"
        method="get"
        className="mb-5 mt-[15px] flex min-h-[250px] flex-col gap-6 px-5 sm:px-[50px] md:mt-[67px] md:mb-0 md:min-h-[500px] md:gap-10 lg:flex-row xl:px-[115px]"
      >
        <div className="flex flex-1 items-stretch">
          <div className="relative h-[300px] w-full overflow-hidden rounded-[20px] md:h-[85%]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/hero/05.webp"
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        </div>

        <div className="flex w-auto flex-1 flex-col justify-between">
          <div className="flex h-full flex-col gap-6">
            <div className="flex flex-col gap-2.5 md:flex-row md:gap-[30px]">
              <label className="block flex-1 text-[15px] font-normal md:text-lg">
                {t.shareFullName}
                <input
                  name="fullName"
                  type="text"
                  required
                  placeholder={t.shareFullNamePh}
                  className={fieldClass}
                />
              </label>
              <label className="block flex-1 text-[15px] font-normal md:text-lg">
                {t.shareEmail}
                <input
                  name="email"
                  type="email"
                  required
                  placeholder={t.shareEmailPh}
                  className={fieldClass}
                />
              </label>
            </div>
            <div className="flex flex-col gap-2.5 md:flex-row md:gap-[30px]">
              <label className="block flex-1 text-[15px] font-normal md:text-lg">
                {t.shareSubject}
                <input
                  name="subject"
                  type="text"
                  required
                  placeholder={t.shareSubjectPh}
                  className={fieldClass}
                />
              </label>
              <label className="block flex-1 text-[15px] font-normal md:text-lg">
                {t.sharePhone}
                <input
                  name="phone"
                  type="tel"
                  placeholder={t.sharePhonePh}
                  className={fieldClass}
                />
              </label>
            </div>
            <label className="block text-[15px] font-normal md:text-lg">
              {t.shareDetails}
              <textarea
                name="details"
                rows={3}
                placeholder={t.shareDetailsPh}
                className="mt-1 block min-h-[58px] w-full rounded-[4px] border border-line bg-white px-3 py-2 text-sm text-fg outline-none"
              />
            </label>
            <button
              type="submit"
              className="h-[49px] w-full rounded-lg bg-white text-sm font-medium text-gold hover:bg-nav md:w-[255px]"
            >
              {t.shareSubmit}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}

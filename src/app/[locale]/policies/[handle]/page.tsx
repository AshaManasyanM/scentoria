import { getDict } from "@/lib/i18n";
import { localeFrom } from "@/lib/locale-params";
import { getShopPolicy } from "@/lib/shopify/catalog";
import { notFound } from "next/navigation";

const knownHandles = ["privacy-policy", "refund-policy", "shipping-policy", "terms-of-service"] as const;

function policyTextHtml(html: string) {
  return html
    .replace(/<img\b[^>]*>/gi, "")
    .replace(/<picture\b[^>]*>[\s\S]*?<\/picture>/gi, "")
    .replace(/<figure\b[^>]*>[\s\S]*?<\/figure>/gi, "")
    .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, "");
}

export default async function PolicyPage({
  params,
}: {
  params: Promise<{ locale: string; handle: string }>;
}) {
  const { handle } = await params;
  const locale = await localeFrom(params);
  if (!knownHandles.includes(handle as (typeof knownHandles)[number])) notFound();
  const t = getDict(locale);
  const policy = await getShopPolicy(handle);
  const fallbackTitle =
    handle === "privacy-policy"
      ? t.privacyPolicy
      : handle === "refund-policy"
        ? t.refundPolicy
        : handle === "shipping-policy"
          ? t.shippingPolicy
          : t.termsOfService;

  return (
    <>
      <section className="bg-[#083534] px-4 py-12 md:px-8 md:py-16">
        <div className="mx-auto w-full max-w-[1320px]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#c5a059]">{t.policies}</p>
          <h1 className="mt-3 max-w-3xl font-serif text-[32px] font-medium leading-[1.15] text-[#f7f2ea] md:text-[clamp(40px,4.5vw,56px)]">
            {policy?.title || fallbackTitle}
          </h1>
        </div>
      </section>

      <section className="bg-[#f7f2ea] px-4 py-10 md:px-8 md:py-20">
        <div className="mx-auto max-w-[820px]">
          {policy?.body ? (
            <div
              className="text-[15px] leading-7 text-[#083534] [&_a]:font-medium [&_a]:text-[#c5a059] [&_a]:underline [&_a]:underline-offset-4 [&_h1]:mb-4 [&_h1]:font-serif [&_h1]:text-[28px] [&_h1]:font-medium [&_h1]:leading-[1.2] [&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:font-serif [&_h2]:text-[24px] [&_h2]:font-medium [&_h2]:leading-[1.25] [&_h3]:mt-8 [&_h3]:mb-2 [&_h3]:font-serif [&_h3]:text-[20px] [&_h3]:font-medium [&_img]:hidden [&_li]:ml-5 [&_li]:list-disc [&_li]:pl-1 [&_ol>li]:list-decimal [&_p+p]:mt-4 [&_strong]:font-semibold [&_ul]:mt-3 [&_ul]:mb-5 [&_ul]:space-y-2"
              dangerouslySetInnerHTML={{ __html: policyTextHtml(policy.body) }}
            />
          ) : (
            <p className="text-[15px] leading-7 text-[#6b635c]">{t.policyMissing}</p>
          )}
        </div>
      </section>
    </>
  );
}

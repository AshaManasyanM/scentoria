import { localeFrom } from "@/lib/locale-params";
import { path } from "@/lib/path";
import { popularBrands } from "@/lib/popular-brands";
import { brandHandle, getCatalog, uniqueBrands } from "@/lib/shopify/catalog";
import { redirect } from "next/navigation";

export default async function BrandPage({
  params,
}: {
  params: Promise<{ locale: string; brand: string }>;
}) {
  const locale = await localeFrom(params);
  const { brand } = await params;
  const known = popularBrands.find((item) => item.handle === brand);
  const { products } = await getCatalog();
  const name =
    known?.name ??
    uniqueBrands(products).find((item) => brandHandle(item) === brand) ??
    brand
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");

  redirect(path(locale, `/products?brand=${encodeURIComponent(name)}`));
}

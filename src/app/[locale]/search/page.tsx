import { localeFrom } from "@/lib/locale-params";
import { path } from "@/lib/path";
import { redirect } from "next/navigation";

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const locale = await localeFrom(params);
  const { q = "" } = await searchParams;
  const term = q.trim();
  redirect(path(locale, term ? `/products?q=${encodeURIComponent(term)}` : "/products"));
}

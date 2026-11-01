import { catalogHref } from "@/lib/catalog-page";
import { localeFrom } from "@/lib/locale-params";
import { getNotes } from "@/lib/shopify/catalog";
import { notFound, redirect } from "next/navigation";

export default async function NotePage({
  params,
}: {
  params: Promise<{ locale: string; note: string }>;
}) {
  const locale = await localeFrom(params);
  const { note } = await params;
  const match = (await getNotes()).find((item) => item.key === note);
  if (!match) notFound();
  redirect(catalogHref(locale, "/products", { note }, 1));
}

import { localeFrom } from "@/lib/locale-params";
import { redirect } from "next/navigation";
import { path } from "@/lib/path";

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = await localeFrom(params);
  redirect(path(locale));
}

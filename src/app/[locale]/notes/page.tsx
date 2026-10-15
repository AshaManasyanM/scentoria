import { localeFrom } from "@/lib/locale-params";
import { redirect } from "next/navigation";

export default async function NotesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = await localeFrom(params);
  redirect(`/${locale}#shop-by-note`);
}

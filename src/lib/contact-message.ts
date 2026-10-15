"use server";

import { clientKey, consumeLimit } from "@/lib/rate-limit";
import { contactFieldsValid } from "@/lib/security";
import { getContactEmail } from "@/lib/shopify/catalog";
import { headers } from "next/headers";

export async function sendContactMessage(_prev: { ok: boolean } | null, formData: FormData) {
  const headerList = await headers();
  const request = new Request("http://local", { headers: headerList });
  if (!(await consumeLimit(clientKey(request, "contact"), 5, 15 * 60 * 1000))) return { ok: false };

  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const details = String(formData.get("details") ?? "").trim();

  if (!contactFieldsValid({ fullName, email, subject, phone, details })) return { ok: false };

  const to = await getContactEmail();
  const origin = (await headers()).get("origin") || "http://localhost:3000";

  try {
    const res = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(to)}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Origin: origin,
        Referer: `${origin}/`,
      },
      body: JSON.stringify({
        name: fullName,
        email,
        subject,
        phone: phone || "—",
        message: details,
        _replyto: email,
        _subject: `Scentoria: ${subject}`,
        _template: "table",
        _captcha: "false",
      }),
    });
    const data = (await res.json()) as { success?: string | boolean; message?: string };
    const success = data.success === true || data.success === "true";
    return { ok: res.ok && success };
  } catch {
    return { ok: false };
  }
}

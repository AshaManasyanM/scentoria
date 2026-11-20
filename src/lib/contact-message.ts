"use server";

import { contactInbox, sendFormMail } from "@/lib/form-mail";
import { clientKey, consumeLimit } from "@/lib/rate-limit";
import { contactFieldsValid } from "@/lib/security";
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

  const origin = (await headers()).get("origin") || "http://localhost:3000";
  const result = await sendFormMail({
    origin,
    payload: {
      name: fullName,
      email,
      subject,
      phone: phone || "—",
      message: details,
      _replyto: email,
      _subject: `Scentoria Prive: ${subject}`,
      _template: "table",
      // Helps operators see the public inbox this copy was meant for.
      support_inbox: contactInbox,
    },
  });

  return { ok: result.ok };
}

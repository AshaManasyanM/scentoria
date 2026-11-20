/** Public contact address shown on the site. */
export const contactInbox = "support@scentoriaprive.com";

/**
 * FormSubmit requires a one-time activation email to the endpoint address.
 * GoDaddy often blocks that mail, so we post to the already-activated Gmail
 * endpoint and CC the public support inbox.
 */
const formSubmitEndpoint = "scentoria.la@gmail.com";

export async function sendFormMail({
  origin,
  payload,
}: {
  origin: string;
  payload: Record<string, string>;
}): Promise<{ ok: boolean; activateRequired: boolean; message?: string }> {
  try {
    const res = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(formSubmitEndpoint)}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Origin: origin,
        Referer: `${origin}/`,
      },
      body: JSON.stringify({
        ...payload,
        _cc: contactInbox,
        _captcha: payload._captcha ?? "false",
      }),
    });
    const data = (await res.json().catch(() => null)) as {
      success?: string | boolean;
      message?: string;
    } | null;
    const success = data?.success === true || data?.success === "true";
    const message = data?.message;
    return {
      ok: Boolean(res.ok && success),
      activateRequired: Boolean(message?.toLowerCase().includes("activation")),
      message,
    };
  } catch {
    return { ok: false, activateRequired: false };
  }
}

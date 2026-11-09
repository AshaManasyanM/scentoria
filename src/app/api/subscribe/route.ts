import { clientKey, consumeLimit } from "@/lib/rate-limit";
import { getContactEmail } from "@/lib/shopify/catalog";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

const STORE_PATH = path.join(process.cwd(), "data", "subscribers.json");
const DISCOUNT_CODE = (process.env.NEXT_PUBLIC_SUBSCRIBE_DISCOUNT_CODE || "WELCOME10").trim();

type Subscriber = { email: string; createdAt: string };

function emailOk(email: string) {
  return email.includes("@") && email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function loadSubscribers(): Promise<Subscriber[]> {
  try {
    const raw = await readFile(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw) as Subscriber[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveSubscriber(email: string) {
  await mkdir(path.dirname(STORE_PATH), { recursive: true });
  const list = await loadSubscribers();
  if (list.some((item) => item.email === email)) return false;
  list.push({ email, createdAt: new Date().toISOString() });
  await writeFile(STORE_PATH, `${JSON.stringify(list, null, 2)}\n`, "utf8");
  return true;
}

export async function POST(request: Request) {
  if (!(await consumeLimit(clientKey(request, "subscribe"), 8, 15 * 60 * 1000))) {
    return NextResponse.json({ ok: false, error: "rate" }, { status: 429 });
  }

  const body = (await request.json().catch(() => null)) as { email?: string; locale?: string } | null;
  const email = String(body?.email ?? "")
    .trim()
    .toLowerCase();
  const locale = body?.locale === "hy" ? "hy" : "en";
  if (!emailOk(email)) return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });

  const isNew = await saveSubscriber(email);
  const origin = request.headers.get("origin") || "http://127.0.0.1:3000";
  const shopLink = `${origin}/${locale}?welcome=${encodeURIComponent(DISCOUNT_CODE)}`;
  const autoReply =
    `Thanks for subscribing to Scentoria Prive.\n\n` +
    `Your first-order discount code: ${DISCOUNT_CODE}\n\n` +
    `Open the shop and use your code:\n${shopLink}\n\n` +
    `Enter the code at Shopify checkout. One use per customer.`;

  let emailed = false;
  let activateRequired = false;

  try {
    const to = await getContactEmail();
    const res = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(to)}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Origin: origin,
        Referer: `${origin}/`,
      },
      body: JSON.stringify({
        name: "Scentoria subscriber",
        email,
        _replyto: email,
        _subject: `Scentoria Prive: your discount code ${DISCOUNT_CODE}`,
        message: `${isNew ? "New" : "Repeat"} subscriber: ${email}\nCode: ${DISCOUNT_CODE}\nLink: ${shopLink}`,
        discount_code: DISCOUNT_CODE,
        shop_link: shopLink,
        _autoresponse: autoReply,
        _template: "table",
        _captcha: "false",
      }),
    });
    const data = (await res.json().catch(() => null)) as {
      success?: string | boolean;
      message?: string;
    } | null;
    const success = data?.success === true || data?.success === "true";
    emailed = Boolean(res.ok && success);
    activateRequired = Boolean(data?.message?.toLowerCase().includes("activation"));
  } catch {
    emailed = false;
  }

  // Always succeed after saving the subscriber. If FormSubmit is not activated yet,
  // the widget shows the code on-screen as a fallback.
  return NextResponse.json({
    ok: true,
    code: DISCOUNT_CODE,
    isNew,
    emailed,
    activateRequired,
    link: shopLink,
  });
}

import { addressDraftError, cleanAddressDraft, type AddressDraft } from "@/lib/address-book";
import { clientKey, consumeLimit, readJson, tooManyRequests } from "@/lib/rate-limit";
import {
  countAddresses,
  createAddress,
  deleteAddress,
  findUserBySession,
  listAddresses,
  updateAddress,
} from "@/lib/users-db";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const SESSION = "scentoria_session";

async function currentUser() {
  const jar = await cookies();
  return await findUserBySession(jar.get(SESSION)?.value ?? "");
}

function draftFrom(body: Partial<AddressDraft> | null): AddressDraft | null {
  if (!body) return null;
  return cleanAddressDraft({
    label: body.label ?? "",
    firstName: body.firstName ?? "",
    lastName: body.lastName ?? "",
    phone: body.phone ?? "",
    address1: body.address1 ?? "",
    city: body.city ?? "",
    zip: body.zip ?? "",
    countryCode: body.countryCode ?? "",
    provinceCode: body.provinceCode ?? "",
    isDefault: Boolean(body.isDefault),
  });
}

export async function GET(request: Request) {
  if (!(await consumeLimit(clientKey(request, "addresses"), 60, 60_000))) return tooManyRequests();
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "missing" }, { status: 401 });
  return NextResponse.json({ addresses: await listAddresses(user.id) });
}

export async function POST(request: Request) {
  if (!(await consumeLimit(clientKey(request, "addresses-write"), 30, 60_000))) return tooManyRequests();
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "missing" }, { status: 401 });
  const draft = draftFrom(await readJson<Partial<AddressDraft>>(request, 4_000));
  if (!draft || addressDraftError(draft)) return NextResponse.json({ error: "address" }, { status: 400 });
  const addressCount = await countAddresses(user.id);
  if (addressCount >= 12) return NextResponse.json({ error: "address" }, { status: 400 });
  const saved = await createAddress(user.id, { ...draft, isDefault: draft.isDefault || addressCount === 0 });
  return NextResponse.json({ address: saved });
}

export async function PATCH(request: Request) {
  if (!(await consumeLimit(clientKey(request, "addresses-write"), 30, 60_000))) return tooManyRequests();
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "missing" }, { status: 401 });
  const body = await readJson<Partial<AddressDraft> & { id?: number }>(request, 4_000);
  const draft = draftFrom(body);
  const id = Number(body?.id);
  if (!draft || !Number.isInteger(id) || addressDraftError(draft)) {
    return NextResponse.json({ error: "address" }, { status: 400 });
  }
  const saved = await updateAddress(user.id, id, draft);
  if (!saved) return NextResponse.json({ error: "address" }, { status: 404 });
  return NextResponse.json({ address: saved });
}

export async function DELETE(request: Request) {
  if (!(await consumeLimit(clientKey(request, "addresses-write"), 30, 60_000))) return tooManyRequests();
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "missing" }, { status: 401 });
  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!Number.isInteger(id) || !(await deleteAddress(user.id, id))) {
    return NextResponse.json({ error: "address" }, { status: 404 });
  }
  return NextResponse.json({ addresses: await listAddresses(user.id) });
}

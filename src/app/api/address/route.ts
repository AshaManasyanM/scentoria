import { toCountryCode } from "@/lib/countries";
import { clientKey, consumeLimit, tooManyRequests } from "@/lib/rate-limit";
import { isUsState } from "@/lib/us-states";
import { NextResponse } from "next/server";

type Suggestion = {
  id: string;
  label: string;
  address1: string;
  city: string;
  zip: string;
  countryCode: string;
  provinceCode: string;
  magicKey: string;
};

const cache = new Map<string, { at: number; suggestions: Suggestion[] }>();
const CACHE_MS = 10 * 60 * 1000;

function cached(key: string) {
  const hit = cache.get(key);
  if (!hit || Date.now() - hit.at > CACHE_MS) return null;
  return hit.suggestions;
}

function remember(key: string, suggestions: Suggestion[]) {
  if (cache.size > 80) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
  cache.set(key, { at: Date.now(), suggestions });
}

export async function GET(request: Request) {
  if (!(await consumeLimit(clientKey(request, "address"), 60, 60_000))) return tooManyRequests();
  const { searchParams } = new URL(request.url);
  const magicKey = searchParams.get("magicKey")?.trim() ?? "";
  const text = searchParams.get("text")?.trim() ?? "";
  if (magicKey && text) return NextResponse.json(await resolveAddress(text, magicKey));

  const query = searchParams.get("q")?.trim().slice(0, 80) ?? "";
  if (query.length < 3) return NextResponse.json([]);
  const key = query.toLowerCase();
  const hit = cached(key);
  if (hit) return NextResponse.json(hit);

  const url = new URL("https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/suggest");
  url.searchParams.set("text", query);
  url.searchParams.set("f", "json");
  url.searchParams.set("maxSuggestions", "5");

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Scentoria" },
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return NextResponse.json([]);
    const data = (await res.json()) as {
      suggestions?: { text?: string; magicKey?: string; isCollection?: boolean }[];
    };
    const suggestions = (data.suggestions ?? []).flatMap((item) => {
      if (!item.text || !item.magicKey || item.isCollection) return [];
      return [{
        id: item.magicKey,
        label: item.text,
        address1: item.text.split(",")[0]?.trim() ?? item.text,
        city: "",
        zip: "",
        countryCode: "",
        provinceCode: "",
        magicKey: item.magicKey,
      }];
    });
    remember(key, suggestions);
    return NextResponse.json(suggestions);
  } catch {
    return NextResponse.json([]);
  }
}

async function resolveAddress(text: string, magicKey: string): Promise<Suggestion> {
  const fallback: Suggestion = {
    id: magicKey,
    label: text,
    address1: text.split(",")[0]?.trim() ?? text,
    city: "",
    zip: "",
    countryCode: "",
    provinceCode: "",
    magicKey,
  };
  const url = new URL("https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates");
  url.searchParams.set("SingleLine", text);
  url.searchParams.set("magicKey", magicKey);
  url.searchParams.set("f", "json");
  url.searchParams.set("maxLocations", "1");
  url.searchParams.set("outFields", "StAddr,City,Postal,Country,RegionAbbr");
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Scentoria" },
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return fallback;
    const data = (await res.json()) as {
      candidates?: { attributes?: { StAddr?: string; City?: string; Postal?: string; Country?: string; RegionAbbr?: string } }[];
    };
    const place = data.candidates?.[0]?.attributes;
    if (!place) return fallback;
    const region = place.RegionAbbr?.toUpperCase() ?? "";
    return {
      ...fallback,
      address1: place.StAddr || fallback.address1,
      city: place.City ?? "",
      zip: place.Postal ?? "",
      countryCode: toCountryCode(place.Country ?? ""),
      provinceCode: isUsState(region) ? region : "",
    };
  } catch {
    return fallback;
  }
}

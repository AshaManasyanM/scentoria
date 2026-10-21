"use server";

import { clientKey, consumeLimit } from "@/lib/rate-limit";
import { statOptions, type StatCategory } from "@/lib/stat-math";
import { addStatVote, statVoteCounts } from "@/lib/users-db";
import { headers } from "next/headers";

export async function voteStat(handle: string, category: string, option: string, voterId: string) {
  const request = new Request("http://local", { headers: await headers() });
  if (!(await consumeLimit(clientKey(request, "vote"), 30, 60 * 60 * 1000))) {
    return { ok: false as const, error: "invalid" as const };
  }
  const key = category as StatCategory;
  const choices = statOptions[key];
  const optionKey = option.trim().toLowerCase();
  if (!handle || !choices || !(choices as readonly string[]).includes(optionKey)) {
    return { ok: false as const, error: "invalid" as const };
  }
  if (!/^[a-zA-Z0-9-]{8,80}$/.test(voterId)) return { ok: false as const, error: "invalid" as const };
  const saved = await addStatVote(handle, key, optionKey, voterId);
  if (!saved) return { ok: false as const, error: "once" as const };
  return { ok: true as const, counts: (await statVoteCounts(handle))[key] ?? {} };
}

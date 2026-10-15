import type { StatBar } from "@/lib/types";

export const statOptions = {
  longevity: ["weak", "moderate", "long lasting", "eternal"],
  season: ["winter", "spring", "summer", "autumn"],
  sillage: ["intimate", "moderate", "strong", "enormous"],
  time: ["day", "night"],
} as const;

export type StatCategory = keyof typeof statOptions;

export function withVotes(items: StatBar[], counts: Record<string, number> = {}) {
  const weights = items.map((item) => Math.max(0, item.value) + (counts[item.label.toLowerCase()] ?? 0));
  const total = weights.reduce((sum, value) => sum + value, 0);
  if (!total) return items;
  const exact = weights.map((weight) => (weight / total) * 100);
  const values = exact.map((value) => Math.floor(value));
  let left = 100 - values.reduce((sum, value) => sum + value, 0);
  const order = exact
    .map((value, index) => ({ index, fraction: value - values[index] }))
    .sort((a, b) => b.fraction - a.fraction);
  for (const entry of order) {
    if (left <= 0) break;
    values[entry.index] += 1;
    left -= 1;
  }
  return items.map((item, index) => ({ ...item, value: values[index] }));
}

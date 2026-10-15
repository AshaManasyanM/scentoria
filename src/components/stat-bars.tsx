"use client";

import { voteStat } from "@/lib/stat-votes";
import { withVotes, type StatCategory } from "@/lib/stat-math";
import type { StatBar } from "@/lib/types";
import { useEffect, useState } from "react";

function voterId() {
  const key = "scentoria_voter";
  const current = localStorage.getItem(key);
  if (current) return current;
  const next = crypto.randomUUID();
  localStorage.setItem(key, next);
  return next;
}

function votedKey(handle: string) {
  return `scentoria_stat_votes:${handle}`;
}

export function StatBars({
  title,
  handle,
  category,
  items,
  counts,
}: {
  title: string;
  handle: string;
  category: StatCategory;
  items: StatBar[];
  counts: Record<string, number>;
}) {
  const [extra, setExtra] = useState(counts);
  const [voted, setVoted] = useState(false);
  const bars = withVotes(items, extra);

  useEffect(() => {
    setExtra(counts);
  }, [counts]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem(votedKey(handle)) || "[]") as string[];
    setVoted(saved.includes(category));
  }, [handle, category]);

  async function vote(label: string) {
    if (voted) return;
    const id = voterId();
    const option = label.toLowerCase();
    const next = { ...extra, [option]: (extra[option] ?? 0) + 1 };
    setExtra(next);
    setVoted(true);
    const saved = JSON.parse(localStorage.getItem(votedKey(handle)) || "[]") as string[];
    localStorage.setItem(votedKey(handle), JSON.stringify([...new Set([...saved, category])]));
    const result = await voteStat(handle, category, option, id);
    if (result.ok) {
      setExtra(result.counts);
      return;
    }
    setExtra(counts);
    if (result.error !== "once") {
      setVoted(false);
      localStorage.setItem(votedKey(handle), JSON.stringify(saved));
    }
  }

  return (
    <div className="rounded-xl border border-[#e6e6e6] bg-white px-5 py-4">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-[#111]">{title}</h3>
      <div className="mt-4 space-y-3">
        {bars.map((item) => (
          <div key={item.label} className="grid grid-cols-[8.5rem_2.75rem_minmax(0,1fr)_1.75rem] items-center gap-3 text-sm text-[#222]">
            <span>{item.label}</span>
            <span className="text-right tabular-nums">{item.value}%</span>
            <span className="h-3 overflow-hidden rounded-full bg-[#ececec]">
              <span
                className="block h-full rounded-full bg-[#1f7a4d]"
                style={{ width: `${Math.max(0, Math.min(100, item.value))}%` }}
              />
            </span>
            <button
              type="button"
              aria-label={`Vote ${item.label}`}
              disabled={voted}
              onClick={() => vote(item.label)}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-[#d8d0c4] text-lg leading-none text-[#1f7a4d] disabled:opacity-40"
            >
              +
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";

import { submitReview } from "@/lib/reviews";
import { getDict } from "@/lib/i18n";
import { path } from "@/lib/path";
import type { Locale } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useState } from "react";

function Stars({
  value,
  onPick,
  onHover,
  compact = false,
}: {
  value: number;
  onPick?: (star: number) => void;
  onHover?: (star: number) => void;
  compact?: boolean;
}) {
  return (
    <span className={`inline-flex ${compact ? "gap-0.5" : "gap-1"}`} onMouseLeave={onHover ? () => onHover(0) : undefined}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= value;
        const mark = (
          <span className={`leading-none ${compact ? "text-sm" : "text-xl"} ${filled ? "text-[#e0a106]" : "text-[#d5d5d5]"}`}>★</span>
        );
        if (!onPick) return <span key={star}>{mark}</span>;
        return (
          <button
            key={star}
            type="button"
            aria-label={`${star}`}
            onMouseEnter={() => onHover?.(star)}
            onClick={() => onPick(star)}
            className="px-0.5"
          >
            {mark}
          </button>
        );
      })}
    </span>
  );
}

export function ProductReviews({
  locale,
  handle,
  rating,
  count,
  mine,
  author,
  loggedIn,
}: {
  locale: Locale;
  handle: string;
  rating: number;
  count: number;
  mine: number;
  author: string;
  loggedIn: boolean;
}) {
  const t = getDict(locale);
  const router = useRouter();
  const [score, setScore] = useState(mine);
  const [hover, setHover] = useState(0);
  const [shownRating, setShownRating] = useState(rating);
  const [shownCount, setShownCount] = useState(count);
  const [writing, setWriting] = useState(false);
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  async function onSubmit() {
    if (!loggedIn) {
      router.push(path(locale, "/login"));
      return;
    }
    if (score < 1) return;
    setPending(true);
    setFailed(false);
    const result = await submitReview(handle, score, body);
    setPending(false);
    if (!result.ok) {
      if (result.error === "login") router.push(path(locale, "/login"));
      if (result.error === "save") setFailed(true);
      return;
    }
    setShownRating(result.rating);
    setShownCount(result.count);
    setHover(0);
  }

  return (
    <>
    <div className="rounded-2xl border border-[#ececec] bg-white p-5">
      <p className="text-sm text-[#222]">{t.overallRating}</p>
      <div className="mt-2 flex items-center gap-2">
        <Stars value={Math.round(shownRating)} />
        <span className="text-sm text-[#222]">
          {shownRating.toFixed(1)} ({shownCount} {t.reviews})
        </span>
      </div>
      <div className="mt-4 rounded-xl border border-[#f0e2bc] bg-[#fafafa] p-4">
        <p className="text-base font-semibold text-[#111]">{t.rateProduct}</p>
        <div className="mt-3 flex justify-center rounded-full border border-[#ead9a4] bg-white py-3">
          <Stars value={hover || score} onPick={setScore} onHover={setHover} />
        </div>
        {writing ? (
          <>
            <input
              value={author}
              readOnly
              className="mt-3 w-full rounded-xl border border-[#e6e6e6] bg-white px-4 py-3 text-sm text-[#222]"
            />
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              rows={5}
              placeholder={t.shareThoughts}
              className="mt-3 min-h-[148px] w-full resize-y rounded-xl border border-[#e6e6e6] bg-white px-4 py-3 text-sm text-[#222] placeholder:text-[#b5b5b5]"
            />
            <p className="mt-3 text-sm text-[#9a9a9a]">{t.reviewsAfterApproval}</p>
            {failed ? <p className="mt-2 text-sm text-[#9a3b3b]">{t.reviewNotSent}</p> : null}
            <button
              type="button"
              onClick={onSubmit}
              disabled={pending}
              className="mt-4 w-full rounded-xl bg-[#1f6b45] py-3.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {t.submitReview}
            </button>
          </>
        ) : null}
        <button
          type="button"
          onClick={() => setWriting((open) => !open)}
          className="mt-3 w-full rounded-xl border border-[#e6e6e6] bg-white py-3.5 text-sm text-[#666]"
        >
          {writing ? t.readLess : t.writeReview}
        </button>
      </div>
    </div>
    </>
  );
}

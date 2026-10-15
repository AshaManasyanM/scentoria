"use client";

import { NoteTile } from "@/components/note-tile";
import { useState } from "react";

const visibleLimit = 8;

export function NoteGrid({
  notes,
  viewAllLabel,
  showLessLabel,
}: {
  notes: { key: string; href: string; image: string; label: string }[];
  viewAllLabel: string;
  showLessLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const canToggle = notes.length > visibleLimit;
  const visible = canToggle && !open ? notes.slice(0, visibleLimit) : notes;

  return (
    <>
      <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-5">
        {visible.map((note) => (
          <NoteTile key={note.key} href={note.href} image={note.image} label={note.label} variant="home" />
        ))}
      </div>
      {canToggle ? (
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
          className="mt-8 inline-flex rounded-[2px] bg-[#083534] px-5 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#f7f2ea]"
        >
          {open ? showLessLabel : viewAllLabel}
        </button>
      ) : null}
    </>
  );
}

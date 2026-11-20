const accordColors: Record<string, string> = {
  amber: "#c46b28",
  balsamic: "#c4b08a",
  smoky: "#8d7b8c",
  "warm spicy": "#e04b32",
  spicy: "#e04b32",
  woody: "#6d4428",
  floral: "#c45b78",
  citrus: "#d4a017",
  leather: "#5c4033",
  oriental: "#a65d3f",
  aquatic: "#6a9eae",
  sweet: "#c9899a",
  fruity: "#e07a5f",
  vanilla: "#c4a574",
  tobacco: "#7a5c3a",
  oud: "#5a4030",
};

const accordWidths = [92, 58, 48, 38, 28];

/** Rank accords strongest-first using level when present (same ranking as the main accord bars). */
export function rankMainAccords(accords: { name: string; level: number | null }[]) {
  let auto = 0;
  return accords
    .map((accord) => ({
      ...accord,
      width: accord.level ?? accordWidths[auto++] ?? Math.max(18, 22),
    }))
    .sort((a, b) => b.width - a.width || a.name.localeCompare(b.name));
}

function titleCaseAccord(name: string) {
  return name
    .split(/[\s/_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

/** Top 1–2 main accords for the product header subtitle (strongest first). */
export function topMainAccordLabel(accords: { name: string; level: number | null }[], limit = 2) {
  return rankMainAccords(accords)
    .slice(0, limit)
    .map((accord) => titleCaseAccord(accord.name))
    .join(" & ");
}

export function AccordBars({
  title,
  accords,
}: {
  title: string;
  accords: { name: string; level: number | null }[];
}) {
  if (!accords.length) return null;

  const rows = rankMainAccords(accords);

  return (
    <div className="mt-8">
      <h2 className="text-[22px] font-bold uppercase tracking-wide text-[#111] underline decoration-2 underline-offset-[6px]">
        {title}
      </h2>
      <div className="mt-5 space-y-3">
        {rows.map((accord) => (
          <div key={accord.name} className="relative h-9 w-full overflow-hidden rounded-full bg-[#e6e6e6]">
            <div
              className="flex h-full min-w-fit items-center rounded-full px-4 text-[13px] font-semibold uppercase tracking-[0.04em] text-white"
              style={{
                width: `${accord.width}%`,
                backgroundColor: accordColors[accord.name] ?? "#8a8178",
              }}
            >
              {accord.name}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

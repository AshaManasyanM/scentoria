const quotes = [
  "A woman without perfume is like a flower without scent. — Coco Chanel",
  "Perfume is the art of transforming simple emotions into scents. — Jean-Paul Gaultier",
  "Scent is poetry in the air. — Jean-Claude Ellena",
  "Every scent is like a portrait. It reveals what words cannot say. — Kilian Hennessy",
];

export function QuoteBar() {
  const line = quotes.join("     •     ") + "     •     ";
  return (
    <div className="flex h-7 items-center overflow-hidden bg-[#083534] text-[#f7f2ea] sm:h-8">
      <div className="flex w-max animate-[scentoria-marquee_40s_linear_infinite]">
        <p className="whitespace-nowrap px-6 font-serif text-[0.875rem] leading-none sm:px-8 sm:text-base">{line}</p>
        <p className="whitespace-nowrap px-6 font-serif text-[0.875rem] leading-none sm:px-8 sm:text-base">{line}</p>
      </div>
    </div>
  );
}

import type { StatBar } from "@/lib/types";

export function StatBars({ title, items }: { title: string; items: StatBar[] }) {
  return (
    <div>
      <h3 className="text-xs uppercase tracking-[0.2em] text-gold">{title}</h3>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={item.label}>
            <div className="flex justify-between text-xs text-muted">
              <span>{item.label}</span>
              <span>{item.value}%</span>
            </div>
            <div className="mt-1 h-1.5 bg-bg-2">
              <div className="h-full bg-gold" style={{ width: `${item.value}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

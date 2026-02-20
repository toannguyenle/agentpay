import { formatCurrency } from "@/lib/utils";

type Point = { day: string; total: number };

type Props = {
  data: Point[];
};

export default function SpendChart({ data }: Props) {
  const points = [...data].reverse();
  const max = Math.max(...points.map((p) => p.total), 1);
  const height = 120;
  const width = 320;
  const path = points
    .map((point, idx) => {
      const x = (idx / Math.max(points.length - 1, 1)) * width;
      const y = height - (point.total / max) * height;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="rounded-2xl border border-white/10 bg-card/90 p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.2em] text-white/40">Daily spend</p>
        <p className="text-xs text-white/60">Last 30 days</p>
      </div>
      <div className="mt-4">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-32 w-full">
          <polyline
            fill="none"
            stroke="#10b981"
            strokeWidth="2"
            points={path}
          />
        </svg>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-white/50">
        <span>Low {formatCurrency(0)}</span>
        <span>High {formatCurrency(max)}</span>
      </div>
    </div>
  );
}

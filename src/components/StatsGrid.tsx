import { formatCurrency } from "@/lib/utils";

type Props = {
  totalSpent: number;
  totalRequests: number;
  pendingCount: number;
};

export default function StatsGrid({ totalSpent, totalRequests, pendingCount }: Props) {
  const stats = [
    { label: "Total spent", value: formatCurrency(totalSpent) },
    { label: "Requests", value: totalRequests.toString() },
    { label: "Pending", value: pendingCount.toString() }
  ];
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-2xl border border-white/10 bg-card/90 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-white/40">{stat.label}</p>
          <p className="mt-3 font-mono text-2xl text-white">{stat.value}</p>
        </div>
      ))}
    </div>
  );
}

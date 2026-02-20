import { formatCurrency } from "@/lib/utils";

type Props = {
  name: string;
  dailyLimit: number;
  autoApproveBelow: number;
  spendToday: number;
};

export default function AgentBadge({ name, dailyLimit, autoApproveBelow, spendToday }: Props) {
  const remaining = Math.max(dailyLimit - spendToday, 0);
  return (
    <div className="rounded-2xl border border-white/10 bg-card/90 p-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-white">{name}</h4>
        <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/60">
          Auto-approve below {formatCurrency(autoApproveBelow)}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-white/70">
        <div>
          <p className="text-white/40">Spend today</p>
          <p className="font-mono text-base text-white">{formatCurrency(spendToday)}</p>
        </div>
        <div>
          <p className="text-white/40">Remaining</p>
          <p className="font-mono text-base text-white">{formatCurrency(remaining)}</p>
        </div>
      </div>
    </div>
  );
}

import { formatCurrency, timeRemaining } from "@/lib/utils";

type Props = {
  id: string;
  agentName: string;
  amount: number;
  currency: string;
  merchant: string;
  description: string;
  category?: string | null;
  status: string;
  approvalToken?: string | null;
  expiresAt?: string | null;
};

export default function RequestCard({
  id,
  agentName,
  amount,
  currency,
  merchant,
  description,
  category,
  status,
  approvalToken,
  expiresAt
}: Props) {
  return (
    <div className="rounded-2xl border border-white/10 bg-card/90 p-5 shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-white/50">{agentName}</p>
          <h3 className="mt-2 text-lg font-semibold text-white">{merchant}</h3>
          <p className="mt-1 text-sm text-white/70">{description}</p>
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-white/60">
            <span className="rounded-full border border-white/10 px-3 py-1">{category || "General"}</span>
            <span className="rounded-full border border-white/10 px-3 py-1">{status}</span>
            <span className="rounded-full border border-white/10 px-3 py-1">
              {timeRemaining(expiresAt)}
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="font-mono text-xl text-white">{formatCurrency(amount, currency)}</p>
          <p className="text-xs text-white/50">{id}</p>
        </div>
      </div>
      {status === "pending" && approvalToken ? (
        <form
          action={`/api/approve/${approvalToken}`}
          method="POST"
          className="mt-4 flex flex-wrap items-center gap-3"
        >
          <input
            name="note"
            placeholder="Optional note"
            className="min-w-[180px] flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 placeholder:text-white/40"
          />
          <button
            name="decision"
            value="approved"
            className="rounded-full bg-emerald px-4 py-2 text-sm font-semibold text-black"
          >
            Approve
          </button>
          <button
            name="decision"
            value="denied"
            className="rounded-full border border-red-400/40 px-4 py-2 text-sm font-semibold text-red-200"
          >
            Deny
          </button>
        </form>
      ) : null}
    </div>
  );
}

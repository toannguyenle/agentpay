import RequestCard from "@/components/RequestCard";
import StatsGrid from "@/components/StatsGrid";
import AgentBadge from "@/components/AgentBadge";
import SpendChart from "@/components/SpendChart";
import { getDb, listRequests, listTransactions, getStats, getDailySpendLast30Days, listAgents } from "@/lib/db";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  const stats = getStats();
  const pending = listRequests("pending", 10);
  const transactions = listTransactions(10);
  const dailySpend = getDailySpendLast30Days();
  const agents = listAgents();

  const db = getDb();
  const spendToday = db.prepare(
    `SELECT agent_id, SUM(amount) as total
     FROM transactions
     WHERE status = 'approved' AND DATE(created_at) = DATE('now')
     GROUP BY agent_id`
  ).all() as { agent_id: string; total: number }[];

  const spendLookup = new Map(spendToday.map((row) => [row.agent_id, row.total || 0]));

  return (
    <main className="min-h-screen bg-base px-6 py-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <div>
          <h1 className="text-3xl font-semibold text-white">Dashboard</h1>
          <p className="mt-2 text-white/60">Monitor pending approvals and recent spend.</p>
        </div>

        <StatsGrid
          totalSpent={stats.total_spent}
          totalRequests={stats.total_requests}
          pendingCount={stats.pending_count}
        />

        <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white">Pending approvals</h2>
            {pending.length === 0 ? (
              <p className="text-sm text-white/60">No pending requests.</p>
            ) : (
              pending.map((request) => (
                <RequestCard
                  key={request.id}
                  id={request.id}
                  agentName={request.agent_name}
                  amount={request.amount}
                  currency={request.currency}
                  merchant={request.merchant}
                  description={request.description}
                  category={request.category}
                  status={request.status}
                  approvalToken={request.approval_token}
                  expiresAt={request.expires_at}
                />
              ))
            )}
          </div>
          <SpendChart data={dailySpend} />
        </div>

        <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white">Recent transactions</h2>
            <div className="space-y-3">
              {transactions.length === 0 ? (
                <p className="text-sm text-white/60">No transactions yet.</p>
              ) : (
                transactions.map((txn) => (
                  <div
                    key={txn.id}
                    className="rounded-2xl border border-white/10 bg-card/90 p-4 text-sm"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-white">{txn.merchant}</p>
                      <span
                        className={`rounded-full px-3 py-1 text-xs ${
                          txn.status === "approved"
                            ? "bg-emerald/20 text-emerald"
                            : "bg-red-500/20 text-red-200"
                        }`}
                      >
                        {txn.status}
                      </span>
                    </div>
                    <p className="mt-1 text-white/60">{txn.description}</p>
                    <p className="mt-2 font-mono text-white">${txn.amount.toFixed(2)}</p>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white">Agents</h2>
            <div className="space-y-3">
              {agents.length === 0 ? (
                <p className="text-sm text-white/60">No agents yet. Run setup.</p>
              ) : (
                agents.map((agent) => (
                  <AgentBadge
                    key={agent.id}
                    name={agent.name}
                    dailyLimit={agent.daily_limit}
                    autoApproveBelow={agent.auto_approve_below}
                    spendToday={spendLookup.get(agent.id) || 0}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

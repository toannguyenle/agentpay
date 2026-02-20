import { getRequestByToken, expireOldRequests } from "@/lib/db";
import { formatCurrency, timeRemaining } from "@/lib/utils";
import ApproveForm from "./approve-form";

export const dynamic = "force-dynamic";

export default function ApprovePage({ params }: { params: { token: string } }) {
  expireOldRequests();
  const request = getRequestByToken(params.token);

  if (!request) {
    return (
      <main className="min-h-screen bg-base px-6 py-16 text-white">
        <div className="mx-auto max-w-lg text-center">
          <h1 className="text-2xl font-semibold">Request not found</h1>
          <p className="mt-3 text-white/60">This approval link is invalid or has expired.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-base px-6 py-10 text-white">
      <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center">
        <div className="rounded-3xl border border-white/10 bg-card/90 p-6 shadow-soft">
          <p className="text-xs uppercase tracking-[0.2em] text-white/50">{request.agent_name}</p>
          <h1 className="mt-3 text-3xl font-semibold">{request.merchant}</h1>
          <p className="mt-2 text-white/70">{request.description}</p>

          <div className="mt-6 grid gap-3 text-sm text-white/70">
            <div className="flex items-center justify-between">
              <span>Amount</span>
              <span className="font-mono text-lg text-white">
                {formatCurrency(request.amount, request.currency)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Category</span>
              <span>{request.category || "General"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Expires</span>
              <span>{timeRemaining(request.expires_at)}</span>
            </div>
          </div>

          <ApproveForm status={request.status} token={params.token} />
        </div>
      </div>
    </main>
  );
}

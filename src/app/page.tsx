import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-base">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-16">
        <div className="animate-fadeUp space-y-8">
          <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/70">
            AgentPay • approval rails for AI spend
          </div>
          <h1 className="text-4xl font-semibold leading-tight text-white md:text-6xl">
            Let your AI agents spend money safely.
          </h1>
          <p className="max-w-2xl text-lg text-white/70">
            AgentPay is a self-hosted approval layer for AI purchases. Agents request, humans approve from
            Telegram, and every transaction is logged in one place.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/setup"
              className="rounded-full bg-emerald px-6 py-3 text-sm font-semibold text-black shadow-soft transition hover:-translate-y-0.5"
            >
              Get Started
            </Link>
            <Link
              href="/dashboard"
              className="rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-white/80 transition hover:border-white/40"
            >
              View Dashboard
            </Link>
          </div>
          <div className="grid gap-4 text-sm text-white/60 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-card/80 p-4">
              <p className="font-mono text-white">Webhook + polling</p>
              <p className="mt-2">Approve in Telegram with instant callbacks or fallback links.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-card/80 p-4">
              <p className="font-mono text-white">SQLite + API keys</p>
              <p className="mt-2">Zero external services. Agents authenticate with secure bearer tokens.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-card/80 p-4">
              <p className="font-mono text-white">Audit-ready</p>
              <p className="mt-2">Every approval or denial is written to the transaction log.</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

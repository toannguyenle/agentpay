"use client";

import { useState } from "react";

export default function SetupForm() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    api_key?: string;
    id?: string;
    name?: string;
    daily_limit?: number;
    auto_approve_below?: number;
  } | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const formData = new FormData(event.currentTarget);
    const payload = {
      name: formData.get("name"),
      daily_limit: Number(formData.get("daily_limit") || 500),
      auto_approve_below: Number(formData.get("auto_approve_below") || 0)
    };
    const response = await fetch("/api/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    setResult(data);
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-xs uppercase tracking-[0.2em] text-white/50">Agent name</label>
          <input
            name="name"
            required
            placeholder="Kai"
            className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-[0.2em] text-white/50">Daily limit</label>
          <input
            name="daily_limit"
            type="number"
            step="0.01"
            defaultValue={500}
            className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-[0.2em] text-white/50">Auto-approve below</label>
          <input
            name="auto_approve_below"
            type="number"
            step="0.01"
            defaultValue={0}
            className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-[0.2em] text-white/50">Telegram bot token</label>
          <input
            name="telegram_token"
            placeholder="Set via TELEGRAM_BOT_TOKEN"
            className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-[0.2em] text-white/50">Telegram chat ID</label>
          <input
            name="telegram_chat_id"
            placeholder="Set via TELEGRAM_CHAT_ID"
            className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white"
          />
        </div>
      </div>
      <p className="text-sm text-white/60">
        Telegram credentials are read from environment variables. Update <code>.env</code> with the values
        above for notifications.
      </p>
      <button
        type="submit"
        disabled={loading}
        className="rounded-full bg-emerald px-6 py-3 text-sm font-semibold text-black"
      >
        {loading ? "Creating..." : "Create Agent"}
      </button>

      {result?.api_key ? (
        <div className="rounded-2xl border border-emerald/40 bg-emerald/10 p-4 text-sm text-white">
          <p className="font-semibold">Agent created!</p>
          <p className="mt-2 text-white/70">API Key</p>
          <p className="mt-1 break-all font-mono text-emerald">{result.api_key}</p>
          <p className="mt-3 text-white/70">Example request</p>
          <pre className="mt-2 overflow-auto rounded-xl bg-black/40 p-3 text-xs text-white/80">
{`curl -X POST \"/api/requests\" \\
  -H \"Authorization: Bearer ${result.api_key}\" \\
  -H \"Content-Type: application/json\" \\
  -d '{"amount": 719.85, "merchant": "Tactics.com", "description": "Burton snowboard gear", "category": "shopping", "currency": "USD"}'`}
          </pre>
        </div>
      ) : null}
    </form>
  );
}

"use client";

import { useState } from "react";

export default function ApproveForm({ status, token }: { status: string; token: string }) {
  const [note, setNote] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (status !== "pending") {
    return (
      <p className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-center text-sm text-white/70">
        This request is already {status}.
      </p>
    );
  }

  async function submit(decision: "approved" | "denied") {
    setLoading(true);
    const response = await fetch(`/api/approve/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision, note })
    });
    const data = await response.json();
    setResult(data.status || "done");
    setLoading(false);
  }

  if (result) {
    return (
      <p className="mt-6 rounded-2xl border border-emerald/40 bg-emerald/10 p-4 text-center text-sm text-emerald">
        Decision recorded: {result}.
      </p>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      <textarea
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="Optional note"
        className="min-h-[90px] w-full rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-white/80"
      />
      <div className="grid gap-3 md:grid-cols-2">
        <button
          disabled={loading}
          onClick={() => submit("approved")}
          className="rounded-2xl bg-emerald px-4 py-3 text-sm font-semibold text-black"
        >
          Approve
        </button>
        <button
          disabled={loading}
          onClick={() => submit("denied")}
          className="rounded-2xl border border-red-400/40 px-4 py-3 text-sm font-semibold text-red-200"
        >
          Deny
        </button>
      </div>
    </div>
  );
}

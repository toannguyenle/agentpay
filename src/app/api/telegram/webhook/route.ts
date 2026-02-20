import { NextRequest, NextResponse } from "next/server";
import { getDb, expireOldRequests } from "@/lib/db";
import { answerCallbackQuery } from "@/lib/telegram";
import { generateId } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const payload = await req.json().catch(() => null);
  if (!payload) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (payload.callback_query) {
    const callbackId = payload.callback_query.id as string;
    const data = String(payload.callback_query.data || "");
    const [action, token] = data.split(":");

    if (!token || (action !== "approve" && action !== "deny")) {
      await answerCallbackQuery(callbackId, "Invalid action");
      return NextResponse.json({ ok: true });
    }

    expireOldRequests();
    const db = getDb();
    const request = db
      .prepare(`SELECT * FROM requests WHERE approval_token = ?`)
      .get(token) as any;

    if (!request) {
      await answerCallbackQuery(callbackId, "Request not found");
      return NextResponse.json({ ok: true });
    }

    if (request.status !== "pending") {
      await answerCallbackQuery(callbackId, `Already ${request.status}`);
      return NextResponse.json({ ok: true });
    }

    const decision = action === "approve" ? "approved" : "denied";
    const decidedAt = new Date().toISOString();
    db.prepare(
      `UPDATE requests
       SET status = ?, decided_at = ?
       WHERE approval_token = ?`
    ).run(decision, decidedAt, token);

    db.prepare(
      `INSERT INTO transactions (id, request_id, agent_id, amount, merchant, description, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(
      generateId("txn_"),
      request.id,
      request.agent_id,
      request.amount,
      request.merchant,
      request.description,
      decision
    );

    await answerCallbackQuery(callbackId, `Marked ${decision}`);
  }

  return NextResponse.json({ ok: true });
}

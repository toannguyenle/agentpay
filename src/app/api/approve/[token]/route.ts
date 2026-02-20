import { NextRequest, NextResponse } from "next/server";
import { getDb, expireOldRequests } from "@/lib/db";
import { corsHeaders, generateId } from "@/lib/utils";

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders });
}

async function parseBody(req: NextRequest) {
  const contentType = req.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return req.json().catch(() => ({}));
  }
  if (contentType.includes("application/x-www-form-urlencoded")) {
    const form = await req.formData();
    return Object.fromEntries(form.entries());
  }
  return {};
}

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  expireOldRequests();
  const body = await parseBody(req);
  const decision = String(body.decision || "").toLowerCase();
  const note = body.note ? String(body.note) : null;

  if (decision !== "approved" && decision !== "denied") {
    return NextResponse.json({ error: "Invalid decision" }, { status: 400, headers: corsHeaders });
  }

  const db = getDb();
  const request = db
    .prepare(`SELECT * FROM requests WHERE approval_token = ?`)
    .get(params.token) as any;

  if (!request) {
    return NextResponse.json({ error: "Not found" }, { status: 404, headers: corsHeaders });
  }

  if (request.status !== "pending") {
    return NextResponse.json({ status: request.status }, { headers: corsHeaders });
  }

  const decidedAt = new Date().toISOString();
  db.prepare(
    `UPDATE requests
     SET status = ?, decision_note = ?, decided_at = ?
     WHERE approval_token = ?`
  ).run(decision, note, decidedAt, params.token);

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

  return NextResponse.json({ status: decision, decided_at: decidedAt }, { headers: corsHeaders });
}

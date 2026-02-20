import { NextRequest, NextResponse } from "next/server";
import { getDb, expireOldRequests } from "@/lib/db";
import { getAgentFromRequest, rateLimit } from "@/lib/auth";
import {
  addHours,
  clampLimit,
  corsHeaders,
  generateApprovalToken,
  generateId,
  getBaseUrl
} from "@/lib/utils";
import { sendApprovalRequest } from "@/lib/telegram";

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  const agent = getAgentFromRequest(req);
  if (!agent) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });
  }
  const limiter = rateLimit(agent.api_key);
  if (!limiter.ok) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429, headers: corsHeaders });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400, headers: corsHeaders });
  }

  const amount = Number(body.amount);
  const merchant = String(body.merchant || "").trim();
  const description = String(body.description || "").trim();
  const category = body.category ? String(body.category) : null;
  const currency = body.currency ? String(body.currency) : "USD";

  if (!Number.isFinite(amount) || amount <= 0 || !merchant || !description) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400, headers: corsHeaders });
  }

  expireOldRequests();

  const db = getDb();
  const requestId = generateId("req_");
  const approvalToken = generateApprovalToken();
  const now = new Date();
  const expiryHours = Number(process.env.DEFAULT_EXPIRY_HOURS || 24);
  const expiresAt = addHours(now, expiryHours);

  let status: "pending" | "approved" = "pending";
  let decidedAt: string | null = null;
  let approvalTokenValue: string | null = approvalToken;

  if (amount < agent.auto_approve_below) {
    status = "approved";
    decidedAt = now.toISOString();
    approvalTokenValue = null;
  }

  db.prepare(
    `INSERT INTO requests
      (id, agent_id, amount, currency, merchant, description, category, status, approval_token, expires_at, decided_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    requestId,
    agent.id,
    amount,
    currency,
    merchant,
    description,
    category,
    status,
    approvalTokenValue,
    expiresAt,
    decidedAt
  );

  if (status === "approved") {
    db.prepare(
      `INSERT INTO transactions (id, request_id, agent_id, amount, merchant, description, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(generateId("txn_"), requestId, agent.id, amount, merchant, description, "approved");
  } else {
    await sendApprovalRequest({
      token: approvalToken,
      agentName: agent.name,
      amount,
      currency,
      merchant,
      description,
      category,
      expiresAt
    });
  }

  const approvalUrl = status === "pending" ? `${getBaseUrl()}/approve/${approvalToken}` : null;

  return NextResponse.json(
    {
      id: requestId,
      status,
      approval_url: approvalUrl,
      expires_at: expiresAt
    },
    { status: 201, headers: corsHeaders }
  );
}

export async function GET(req: NextRequest) {
  const agent = getAgentFromRequest(req);
  if (!agent) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });
  }
  expireOldRequests();

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || undefined;
  const limit = clampLimit(searchParams.get("limit"), 20);

  const db = getDb();
  const stmt = db.prepare(
    `SELECT requests.*, agents.name as agent_name
     FROM requests
     JOIN agents ON agents.id = requests.agent_id
     ${status ? "WHERE requests.status = ?" : ""}
     ORDER BY requests.created_at DESC
     LIMIT ?`
  );
  const rows = status ? stmt.all(status, limit) : stmt.all(limit);

  return NextResponse.json({ data: rows }, { headers: corsHeaders });
}

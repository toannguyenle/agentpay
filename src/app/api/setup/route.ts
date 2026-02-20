import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getDb } from "@/lib/db";
import { corsHeaders, generateId } from "@/lib/utils";

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400, headers: corsHeaders });
  }

  const name = String(body.name || "").trim();
  const dailyLimit = Number(body.daily_limit || 500);
  const autoApproveBelow = Number(body.auto_approve_below || 0);

  if (!name) {
    return NextResponse.json({ error: "Name required" }, { status: 400, headers: corsHeaders });
  }

  const db = getDb();
  const id = generateId("agt_");
  const apiKey = crypto.randomBytes(24).toString("hex");
  db.prepare(
    `INSERT INTO agents (id, name, api_key, daily_limit, auto_approve_below)
     VALUES (?, ?, ?, ?, ?)`
  ).run(id, name, apiKey, dailyLimit, autoApproveBelow);

  return NextResponse.json(
    {
      id,
      name,
      api_key: apiKey,
      daily_limit: dailyLimit,
      auto_approve_below: autoApproveBelow
    },
    { status: 201, headers: corsHeaders }
  );
}

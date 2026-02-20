import { NextRequest, NextResponse } from "next/server";
import { getDb, expireOldRequests } from "@/lib/db";
import { getAgentFromRequest } from "@/lib/auth";
import { corsHeaders } from "@/lib/utils";

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders });
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const agent = getAgentFromRequest(req);
  if (!agent) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });
  }

  expireOldRequests();
  const db = getDb();
  const stmt = db.prepare(
    `SELECT * FROM requests WHERE id = ? AND agent_id = ?`
  );
  const request = stmt.get(params.id, agent.id) as Record<string, unknown> | undefined;
  if (!request) {
    return NextResponse.json({ error: "Not found" }, { status: 404, headers: corsHeaders });
  }

  return NextResponse.json(request, { headers: corsHeaders });
}

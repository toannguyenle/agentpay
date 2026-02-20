import { NextRequest, NextResponse } from "next/server";
import { getDailySpendLast30Days, getStats } from "@/lib/db";
import { getAgentFromRequest } from "@/lib/auth";
import { corsHeaders } from "@/lib/utils";

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders });
}

export async function GET(req: NextRequest) {
  const agent = getAgentFromRequest(req);
  if (!agent) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });
  }

  const stats = getStats();
  const daily = getDailySpendLast30Days();
  return NextResponse.json({ stats, daily }, { headers: corsHeaders });
}

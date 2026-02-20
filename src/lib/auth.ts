import { NextRequest } from "next/server";
import { getDb, AgentRow } from "./db";

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 120;

export function rateLimit(key: string) {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true };
  }
  if (entry.count >= MAX_REQUESTS) {
    return { ok: false, resetAt: entry.resetAt };
  }
  entry.count += 1;
  return { ok: true };
}

export function getAgentFromRequest(req: NextRequest): AgentRow | null {
  const authHeader = req.headers.get("authorization") || "";
  const [, token] = authHeader.split(" ");
  if (!token) return null;
  const db = getDb();
  const stmt = db.prepare(`SELECT * FROM agents WHERE api_key = ?`);
  const agent = stmt.get(token) as AgentRow | undefined;
  return agent || null;
}

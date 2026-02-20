import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

let db: Database.Database | null = null;

function getDbPath() {
  const dbPath = process.env.DATABASE_PATH || "./data/agentpay.db";
  if (dbPath.startsWith("./") || dbPath.startsWith("../")) {
    return path.resolve(process.cwd(), dbPath);
  }
  return dbPath;
}

function ensureDataDir(dbPath: string) {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function getDb() {
  if (db) return db;
  const dbPath = getDbPath();
  ensureDataDir(dbPath);
  db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS agents (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      api_key TEXT NOT NULL UNIQUE,
      daily_limit REAL DEFAULT 500,
      auto_approve_below REAL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS requests (
      id TEXT PRIMARY KEY,
      agent_id TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT DEFAULT 'USD',
      merchant TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT,
      status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'expired')),
      decision_note TEXT,
      approval_token TEXT UNIQUE,
      expires_at TEXT,
      decided_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (agent_id) REFERENCES agents(id)
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      request_id TEXT NOT NULL,
      agent_id TEXT NOT NULL,
      amount REAL NOT NULL,
      merchant TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (request_id) REFERENCES requests(id)
    );

    CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
    CREATE INDEX IF NOT EXISTS idx_requests_agent ON requests(agent_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_agent ON transactions(agent_id);
  `);

  return db;
}

export type AgentRow = {
  id: string;
  name: string;
  api_key: string;
  daily_limit: number;
  auto_approve_below: number;
  created_at: string;
};

export type RequestRow = {
  id: string;
  agent_id: string;
  amount: number;
  currency: string;
  merchant: string;
  description: string;
  category: string | null;
  status: "pending" | "approved" | "denied" | "expired";
  decision_note: string | null;
  approval_token: string | null;
  expires_at: string | null;
  decided_at: string | null;
  created_at: string;
};

export type TransactionRow = {
  id: string;
  request_id: string;
  agent_id: string;
  amount: number;
  merchant: string;
  description: string;
  status: "approved" | "denied";
  created_at: string;
};

export function expireOldRequests(nowIso = new Date().toISOString()) {
  const db = getDb();
  const stmt = db.prepare(
    `UPDATE requests
     SET status = 'expired'
     WHERE status = 'pending' AND expires_at IS NOT NULL AND expires_at < ?`
  );
  stmt.run(nowIso);
}

export function getRequestByToken(token: string) {
  const db = getDb();
  const stmt = db.prepare(
    `SELECT requests.*, agents.name as agent_name
     FROM requests
     JOIN agents ON agents.id = requests.agent_id
     WHERE approval_token = ?`
  );
  return stmt.get(token) as (RequestRow & { agent_name: string }) | undefined;
}

export function getRequestById(id: string) {
  const db = getDb();
  const stmt = db.prepare(
    `SELECT requests.*, agents.name as agent_name
     FROM requests
     JOIN agents ON agents.id = requests.agent_id
     WHERE requests.id = ?`
  );
  return stmt.get(id) as (RequestRow & { agent_name: string }) | undefined;
}

export function listRequests(status?: string, limit = 20) {
  const db = getDb();
  const params: (string | number)[] = [];
  let where = "";
  if (status) {
    where = "WHERE requests.status = ?";
    params.push(status);
  }
  params.push(limit);
  const stmt = db.prepare(
    `SELECT requests.*, agents.name as agent_name
     FROM requests
     JOIN agents ON agents.id = requests.agent_id
     ${where}
     ORDER BY requests.created_at DESC
     LIMIT ?`
  );
  return stmt.all(...params) as (RequestRow & { agent_name: string })[];
}

export function listAgents() {
  const db = getDb();
  const stmt = db.prepare(`SELECT * FROM agents ORDER BY created_at DESC`);
  return stmt.all() as AgentRow[];
}

export function listTransactions(limit = 20) {
  const db = getDb();
  const stmt = db.prepare(
    `SELECT transactions.*, agents.name as agent_name
     FROM transactions
     JOIN agents ON agents.id = transactions.agent_id
     ORDER BY transactions.created_at DESC
     LIMIT ?`
  );
  return stmt.all(limit) as (TransactionRow & { agent_name: string })[];
}

export function getDailySpendLast30Days() {
  const db = getDb();
  const stmt = db.prepare(
    `SELECT DATE(created_at) as day, SUM(amount) as total
     FROM transactions
     WHERE status = 'approved'
     GROUP BY DATE(created_at)
     ORDER BY DATE(created_at) DESC
     LIMIT 30`
  );
  return stmt.all() as { day: string; total: number }[];
}

export function getStats() {
  const db = getDb();
  const totals = db
    .prepare(
      `SELECT SUM(amount) as total_spent, COUNT(*) as total_requests
       FROM transactions
       WHERE status = 'approved'`
    )
    .get() as { total_spent: number | null; total_requests: number };

  const pending = db
    .prepare(`SELECT COUNT(*) as pending_count FROM requests WHERE status = 'pending'`)
    .get() as { pending_count: number };

  return {
    total_spent: totals.total_spent || 0,
    total_requests: totals.total_requests || 0,
    pending_count: pending.pending_count || 0
  };
}

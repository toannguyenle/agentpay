import crypto from "crypto";

export function generateId(prefix: string) {
  return `${prefix}${crypto.randomUUID()}`;
}

export function generateApprovalToken() {
  return crypto.randomBytes(16).toString("hex");
}

export function addHours(date: Date, hours: number) {
  const next = new Date(date.getTime() + hours * 60 * 60 * 1000);
  return next.toISOString();
}

export function getBaseUrl() {
  return process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
}

export function formatCurrency(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency
  }).format(amount);
}

export function timeRemaining(expiresAt?: string | null) {
  if (!expiresAt) return "";
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function clampLimit(limit?: string | null, fallback = 20) {
  const parsed = Number(limit);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, 100);
}

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};

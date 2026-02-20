import { getBaseUrl, formatCurrency } from "./utils";

type TelegramResponse = {
  ok: boolean;
  result?: unknown;
  description?: string;
};

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

function getApiUrl(method: string) {
  return `https://api.telegram.org/bot${BOT_TOKEN}/${method}`;
}

export async function sendTelegramMessage(payload: Record<string, unknown>) {
  if (!BOT_TOKEN || !CHAT_ID) return;
  const response = await fetch(getApiUrl("sendMessage"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: CHAT_ID, ...payload })
  });
  const data = (await response.json()) as TelegramResponse;
  if (!data.ok) {
    console.error("Telegram error", data.description || data);
  }
}

export async function answerCallbackQuery(callbackQueryId: string, text?: string) {
  if (!BOT_TOKEN) return;
  await fetch(getApiUrl("answerCallbackQuery"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text })
  });
}

export async function sendApprovalRequest({
  token,
  agentName,
  amount,
  currency,
  merchant,
  description,
  category,
  expiresAt
}: {
  token: string;
  agentName: string;
  amount: number;
  currency: string;
  merchant: string;
  description: string;
  category?: string | null;
  expiresAt?: string | null;
}) {
  if (!BOT_TOKEN || !CHAT_ID) return;
  const approvalUrl = `${getBaseUrl()}/approve/${token}`;
  const prettyAmount = formatCurrency(amount, currency);
  const categoryLabel = category ? category[0].toUpperCase() + category.slice(1) : "General";
  const expiresLabel = expiresAt ? "24h" : "soon";
  const text = `🔔 Payment Request from ${agentName}\n\n💰 ${prettyAmount} ${currency}\n🏪 ${merchant}\n📝 ${description}\n🏷️ ${categoryLabel}\n⏰ Expires in ${expiresLabel}`;

  await sendTelegramMessage({
    text,
    reply_markup: {
      inline_keyboard: [
        [
          { text: "Approve ✅", callback_data: `approve:${token}` },
          { text: "Deny ❌", callback_data: `deny:${token}` }
        ],
        [{ text: "Open approval page", url: approvalUrl }]
      ]
    }
  });
}

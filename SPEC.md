# AgentPay — Specification

## What Is This?

AgentPay lets AI agents request purchases/payments, and humans approve them from their phone via a simple link. Think "Stripe Checkout but for AI agent approvals."

**Open source. MIT license. Self-hostable.**

## Patient Zero Flow

1. **Agent calls API**: `POST /api/requests` — "I want to buy Burton snowboard gear for $719 on Tactics.com"
2. **AgentPay creates a pending request** and sends a **Telegram notification** to the human with an approval link
3. **Human taps the link** → sees request details → taps Approve or Deny
4. **Agent polls or gets webhook callback** with the decision
5. **Transaction is logged**

## Architecture

```
┌─────────────┐     POST /api/requests      ┌──────────────┐
│  AI Agent   │ ──────────────────────────→  │   AgentPay   │
│  (e.g. Kai) │ ←── GET /api/requests/:id ── │   (Next.js)  │
└─────────────┘     (poll for decision)      └──────┬───────┘
                                                    │
                                              Telegram Bot API
                                                    │
                                                    ▼
                                             ┌──────────────┐
                                             │    Human      │
                                             │  (Telegram)   │
                                             └──────────────┘
                                                    │
                                              clicks link
                                                    │
                                                    ▼
                                             ┌──────────────┐
                                             │  /approve/:id │
                                             │  (web page)   │
                                             └──────────────┘
```

## Tech Stack

- **Next.js 14** (App Router)
- **SQLite** via `better-sqlite3` (zero external deps, single file DB)
- **Tailwind CSS** for UI
- **Telegram Bot API** for notifications (via fetch, no SDK needed)

## Database Schema (SQLite)

### `agents` table
- `id` TEXT PRIMARY KEY (uuid)
- `name` TEXT NOT NULL (e.g. "Kai")
- `api_key` TEXT NOT NULL UNIQUE (bearer token for auth)
- `daily_limit` REAL DEFAULT 500
- `auto_approve_below` REAL DEFAULT 0 (auto-approve requests under this amount)
- `created_at` TEXT DEFAULT CURRENT_TIMESTAMP

### `requests` table
- `id` TEXT PRIMARY KEY (uuid)
- `agent_id` TEXT NOT NULL (FK to agents)
- `amount` REAL NOT NULL
- `currency` TEXT DEFAULT 'USD'
- `merchant` TEXT NOT NULL
- `description` TEXT NOT NULL
- `category` TEXT (e.g. "shopping", "software", "food")
- `status` TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'expired'))
- `decision_note` TEXT (human's note when approving/denying)
- `approval_token` TEXT UNIQUE (short random token for the approval URL)
- `expires_at` TEXT (auto-expire after 24h)
- `decided_at` TEXT
- `created_at` TEXT DEFAULT CURRENT_TIMESTAMP

### `transactions` table (log of completed requests)
- `id` TEXT PRIMARY KEY (uuid)
- `request_id` TEXT NOT NULL (FK to requests)
- `agent_id` TEXT NOT NULL
- `amount` REAL NOT NULL
- `merchant` TEXT NOT NULL
- `description` TEXT NOT NULL
- `status` TEXT NOT NULL ('approved' or 'denied')
- `created_at` TEXT DEFAULT CURRENT_TIMESTAMP

## API Endpoints

### `POST /api/requests` — Agent creates a payment request
**Auth**: Bearer token (agent's api_key)
```json
{
  "amount": 719.85,
  "merchant": "Tactics.com",
  "description": "Burton snowboard gear — Smalls board + bindings + boots for Ha",
  "category": "shopping",
  "currency": "USD"
}
```
**Response** (201):
```json
{
  "id": "req_abc123",
  "status": "pending",
  "approval_url": "https://agentpay.example.com/approve/tok_xyz",
  "expires_at": "2026-02-21T11:42:00Z"
}
```
If amount < agent's `auto_approve_below`, returns `status: "approved"` immediately.

### `GET /api/requests/:id` — Agent polls for decision
**Auth**: Bearer token
```json
{
  "id": "req_abc123",
  "status": "approved",
  "amount": 719.85,
  "merchant": "Tactics.com",
  "decided_at": "2026-02-20T11:45:00Z",
  "decision_note": "go for it"
}
```

### `GET /approve/:token` — Human approval page (NO auth, token-based)
Beautiful mobile-friendly page showing:
- Agent name, amount, merchant, description, category
- Time remaining before expiry
- **Approve** button (green) + optional note field
- **Deny** button (red) + optional reason field

### `POST /api/approve/:token` — Submit decision
```json
{
  "decision": "approved",
  "note": "looks good"
}
```

### `GET /api/requests` — List all requests (for dashboard)
**Auth**: Bearer token
Query params: `?status=pending&limit=20`

### `GET /api/agents` — List agents (for dashboard)
### `POST /api/agents` — Create a new agent
### `GET /api/stats` — Dashboard stats (total spent, pending count, etc.)

## Pages

### `/` — Landing page
Clean, minimal. "Let your AI agents spend money safely." 
CTA: "Get Started" → `/setup`

### `/setup` — First-time setup
1. Create your first agent (name, daily limit, auto-approve threshold)
2. Connect Telegram (enter bot token + your chat ID)
3. Get your agent's API key
4. Show example curl command

### `/dashboard` — Main dashboard
- Pending approvals (with quick approve/deny buttons)
- Recent transactions
- Agent overview (spend today, daily limit remaining)
- Simple charts (daily spend over last 30 days)

### `/approve/:token` — Mobile approval page
- Full-screen, mobile-optimized
- Shows request details
- Approve/Deny with optional note
- Success/error states

## Telegram Integration

When a new request comes in:
```
🔔 Payment Request from Kai

💰 $719.85 USD
🏪 Tactics.com
📝 Burton snowboard gear — Smalls board + bindings + boots for Ha
🏷️ Shopping
⏰ Expires in 24h

[Approve ✅] [Deny ❌]
```

The Approve/Deny buttons are inline keyboard buttons. Tapping them either:
- Opens the approval web page, OR
- Directly approves/denies via Telegram callback (preferred — fewer taps)

Support BOTH flows:
1. **Inline buttons** that call back to the bot (instant, no browser needed)
2. **Web link** as fallback

### Telegram Bot Setup
Env vars:
- `TELEGRAM_BOT_TOKEN` — from BotFather
- `TELEGRAM_CHAT_ID` — owner's chat ID
- `NEXT_PUBLIC_BASE_URL` — for approval links (e.g. https://agentpay.vercel.app)

## Environment Variables

```env
# Required
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_CHAT_ID=your-chat-id  
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Optional
DATABASE_PATH=./data/agentpay.db
DEFAULT_EXPIRY_HOURS=24
```

## Design

- Dark theme (bg: #0a0a0a, cards: #1a1a1a)
- Accent: emerald green (#10b981)
- Clean, minimal — inspired by Vercel/Linear aesthetic
- Mobile-first for the approval page
- Monospace for amounts/IDs
- Subtle animations (fade in, slide up)

## File Structure

```
agentpay/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Landing page
│   │   ├── layout.tsx            # Root layout
│   │   ├── globals.css           # Tailwind globals
│   │   ├── setup/
│   │   │   └── page.tsx          # Setup wizard
│   │   ├── dashboard/
│   │   │   └── page.tsx          # Main dashboard
│   │   ├── approve/
│   │   │   └── [token]/
│   │   │       └── page.tsx      # Approval page
│   │   └── api/
│   │       ├── requests/
│   │       │   ├── route.ts      # POST (create) + GET (list)
│   │       │   └── [id]/
│   │       │       └── route.ts  # GET (poll status)
│   │       ├── approve/
│   │       │   └── [token]/
│   │       │       └── route.ts  # POST (submit decision)
│   │       ├── agents/
│   │       │   └── route.ts      # GET + POST
│   │       ├── stats/
│   │       │   └── route.ts      # GET
│   │       ├── setup/
│   │       │   └── route.ts      # POST (first-time setup)
│   │       └── telegram/
│   │           └── webhook/
│   │               └── route.ts  # POST (Telegram callback)
│   ├── lib/
│   │   ├── db.ts                 # SQLite initialization + queries
│   │   ├── telegram.ts           # Telegram bot helpers
│   │   ├── auth.ts               # Bearer token validation
│   │   └── utils.ts              # Helpers
│   └── components/
│       ├── RequestCard.tsx
│       ├── AgentBadge.tsx
│       ├── StatsGrid.tsx
│       └── SpendChart.tsx
├── data/                         # SQLite DB lives here (gitignored)
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
├── .env.example
├── .gitignore
├── LICENSE                       # MIT
└── README.md
```

## README.md Content

Should include:
1. What it is (one-liner)
2. Screenshot/demo GIF placeholder
3. Quick start (env vars, npm install, npm run dev)
4. Agent integration example (curl + Node.js SDK)
5. Self-hosting on Vercel
6. Architecture diagram (ASCII)
7. API reference (brief)
8. License (MIT)

## Key Implementation Notes

- Use `crypto.randomUUID()` for IDs, prefix with `req_`, `agt_`, `txn_`
- Approval tokens: 32-char random hex (crypto.randomBytes)
- SQLite DB auto-creates on first request
- Telegram webhook optional — polling works too (simpler for local dev)
- Auto-expire pending requests after 24h (check on read, no cron needed)
- Rate limit agent requests (simple in-memory counter)
- CORS headers on API routes for external agent access

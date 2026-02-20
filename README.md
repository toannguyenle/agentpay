# AgentPay

Let your AI agents spend money safely. AgentPay adds a human approval layer with Telegram notifications and an auditable SQLite log.

## Quick start

```bash
cp .env.example .env
npm install
npm run dev
```

Set `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, and `NEXT_PUBLIC_BASE_URL` in `.env` before creating requests.

## Agent integration

### cURL
```bash
curl -X POST "http://localhost:3000/api/requests" \
  -H "Authorization: Bearer YOUR_AGENT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"amount": 719.85, "merchant": "Tactics.com", "description": "Burton snowboard gear", "category": "shopping", "currency": "USD"}'
```

### Node.js helper
```js
import fetch from "node-fetch";

async function createRequest() {
  const res = await fetch("http://localhost:3000/api/requests", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.AGENTPAY_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      amount: 199.0,
      merchant: "Linear",
      description: "Annual pro plan",
      category: "software",
      currency: "USD"
    })
  });
  return res.json();
}
```

## Deploy on Vercel

1. Push this repo to GitHub.
2. Create a new Vercel project.
3. Add the env vars from `.env.example` in Vercel.
4. Deploy. Set `NEXT_PUBLIC_BASE_URL` to your Vercel URL.

## Architecture

```
┌─────────────┐     POST /api/requests      ┌──────────────┐
│  AI Agent   │ ──────────────────────────→ │   AgentPay   │
│  (e.g. Kai) │ ←── GET /api/requests/:id ─ │   (Next.js)  │
└─────────────┘     (poll for decision)     └──────┬───────┘
                                                   │
                                             Telegram Bot API
                                                   │
                                                   ▼
                                            ┌──────────────┐
                                            │    Human      │
                                            │  (Telegram)   │
                                            └──────────────┘
```

## API reference (brief)

- `POST /api/requests` Create a request (bearer token required).
- `GET /api/requests/:id` Poll for a decision.
- `GET /api/requests` List requests (`status`, `limit`).
- `POST /api/approve/:token` Submit approval/denial.
- `GET /api/agents` List agents.
- `POST /api/agents` Create an agent.
- `GET /api/stats` Dashboard stats.
- `POST /api/setup` First-time setup.

## License

MIT

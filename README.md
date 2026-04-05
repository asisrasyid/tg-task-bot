# tg-task-bot

A Telegram bot for managing tasks directly from chat — connected to [SheetMaster](https://github.com/asisrasyid/SheetMaster), a self-hosted task management system built on Google Sheets.

Built with **Node.js**, **Telegraf v4**, **TypeScript**, and optionally powered by **Claude AI** for natural language task creation.

---

## Features

| Command | Description |
|---------|-------------|
| `/task` | Create a task with guided multi-step flow (board → column → title → priority → deadline) |
| `/task-claude` | Create a task from a natural language message — Claude extracts the details |
| `/boards` | View all boards and browse tasks per column |
| `/done` | Mark a task as done — moves it to the Done column in SheetMaster |
| `/snap` | Project snapshot — task counts per board and column |

- **Auth guard** — only your Telegram user ID can interact with the bot
- **Inline keyboards** — tap to select board, column, and priority
- **Graceful fallback** — `/task-claude` falls back to a manual prompt if Claude API is unavailable
- **Railway-ready** — includes `railway.json` for zero-config deployment

---

## Architecture

```
src/
├── index.ts              # Bot entry point, command routing, callback handler
├── sm.ts                 # SheetMaster client wrapper
├── types.ts              # Conversation state types
├── card.ts               # Message formatters and inline keyboard builders
└── commands/
    ├── task.ts           # /task — multi-step conversation state machine
    ├── taskClaude.ts     # /task-claude — Claude AI task parser
    ├── boards.ts         # /boards — board and task viewer
    ├── done.ts           # /done — mark task complete
    └── snap.ts           # /snap — project snapshot
```

**Conversation state** for `/task` is managed in-memory with a `Map<userId, ConversationState>`, tracking each step of the flow per user.

---

## Tech Stack

- **Runtime:** Node.js
- **Language:** TypeScript
- **Bot Framework:** [Telegraf v4](https://telegraf.js.org/)
- **Task API:** [sheetmaster-sdk](https://github.com/asisrasyid/sheetmaster-sdk)
- **AI (optional):** [Claude Haiku](https://www.anthropic.com/) via Anthropic SDK
- **Deployment:** [Railway](https://railway.app/)

---

## Prerequisites

1. A running **SheetMaster** instance ([setup guide](https://github.com/asisrasyid/SheetMaster))
2. A Telegram bot token from [@BotFather](https://t.me/BotFather)
3. Your Telegram user ID (get it from [@userinfobot](https://t.me/userinfobot))
4. *(Optional)* An Anthropic API key for `/task-claude`

---

## Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/asisrasyid/tg-task-bot.git
cd tg-task-bot
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Fill in `.env`:

```env
BOT_TOKEN=your_telegram_bot_token
ALLOWED_USER_ID=your_telegram_user_id

SHEETMASTER_KEY=sm_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SHEETMASTER_URL=https://script.google.com/macros/s/[SCRIPT_ID]/exec

# Optional
ANTHROPIC_API_KEY=sk-ant-xxxxxxxx
```

### 3. Build & Run

```bash
npm run build
npm start
```

Open Telegram and send `/start` to your bot.

---

## Demo

### `/task` — Guided Flow

```
You:  /task
Bot:  📋 Pilih board:
      [ Personal Branding ] [ Portfolio Website ] [ Finance AI Agent ]

You:  [tap] Portfolio Website
Bot:  📌 Portfolio Website
      Pilih kolom:
      [ Backlog ] [ Design ] [ Development ] [ QA & Testing ]

You:  [tap] Development
Bot:  Ketik judul task:

You:  Build Hero section
Bot:  ⚡ Pilih prioritas:
      [ 🟢 low ] [ 🟡 medium ] [ 🔴 high ] [ 🚨 urgent ]

You:  [tap] high
Bot:  Ketik deadline (YYYY-MM-DD) atau /skip

You:  2026-04-30
Bot:  ✅ Task dibuat!
      📝 Build Hero section
      📋 Board: Portfolio Website
      📌 Kolom: Development
      🔴 Prioritas: high
      📅 Deadline: 2026-04-30
```

### `/task-claude` — Natural Language

```
You:  /task-claude Fix login bug, urgent, deadline this Friday
Bot:  🤖 Menganalisis pesan...
      ✅ Task dibuat!
      📝 Fix login bug
      📋 Board: Personal Branding Road Map
      📌 Kolom: To Do
      🚨 Prioritas: urgent
      📅 Deadline: 2026-04-11
```

---

## Deployment (Railway)

1. Push this repo to GitHub
2. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub**
3. Select this repo
4. Add environment variables in the Railway dashboard (same as `.env`)
5. Railway will auto-build and deploy

The `railway.json` in this repo handles build and restart configuration automatically.

---

## Related Projects

- [SheetMaster](https://github.com/asisrasyid/SheetMaster) — The task management backend (Google Apps Script + Sheets)
- [sheetmaster-sdk](https://github.com/asisrasyid/sheetmaster-sdk) — TypeScript SDK for SheetMaster

---

## License

MIT © [asisrasyid](https://github.com/asisrasyid)

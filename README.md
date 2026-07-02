# Trip Planner — Multi-Agent AI Trip Logistics Coordinator

> A team of specialized AI agents that negotiate, collaborate, and adapt in real time to build the perfect trip itinerary within your budget.

---

## What It Does

Trip Planner is an agentic AI system where instead of one AI generating a generic itinerary, multiple specialized agents each own one part of the trip planning process. They coordinate with each other, reject over-budget picks, retry with adjusted constraints, and show you every step of their reasoning — live, in the UI.

Sign up or log in, enter your trip details (travelling from, destination, dates, budget, travellers), and watch the agents negotiate your perfect trip in real time.

---

## Agents

| Agent | Role |
|---|---|
| **Orchestrator** | Receives the user's trip request, decomposes it into sub-tasks, delegates to specialist agents, merges outputs, and resolves conflicts |
| **Transport** | Compares flights, trains, and road options — recommends the best based on budget and user preference |
| **Hotels** | Searches lodging options matching the destination, dates, and budget |
| **Activities** | Builds a day-by-day plan using RAG-powered local knowledge + live places data |
| **Budget** | Tracks running cost against the user's cap — rejects over-budget picks and triggers renegotiation |
| **Executioner** | Simulates final booking only when user clicks "Book This Trip" — no real bookings without a deliberate click |

---

## Key Features

- **Login & Signup** — clean auth flow before accessing the planner
- **Visible agent negotiation** — real-time feed shows each agent's status, rejection reasons, and retries. Not a black box.
- **Live budget progress bar** — updates as each agent works, never a surprise total at the end
- **Multi-modal transport** — Transport Agent compares flights, trains, and road trips and picks the best option
- **RAG-powered recommendations** — Activities agent pulls from a curated knowledge base of destination guides and local tips, not generic top-10 lists
- **"Why this?" transparency** — every itinerary item has an expandable note explaining the agent's reasoning
- **Day-by-day flashcard itinerary** — navigate days with pill tabs and prev/next buttons instead of a long scroll
- **Explicit booking consent** — "Book This Trip" button triggers the Executioner Agent, nothing books automatically

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, Tailwind CSS, Framer Motion, shadcn/ui |
| Backend | Node.js, Express 5, TypeScript |
| AI / Agents | LangChain.js, Google Gemini API |
| RAG | Chroma vector store, Google embeddings |
| APIs | Amadeus (flights + hotels), Google Places (activities) |
| Database | PostgreSQL + Drizzle ORM |
| Validation | Zod |
| Workspace | pnpm workspaces, Node.js 24, TypeScript 5.9 |

---

## Project Structure

```
Travel-Agent-AI/
├── artifacts/
│   ├── api-server/          # Express backend — agents, routes, auth
│   │   └── src/
│   │       ├── agents/      # Each agent as a separate file
│   │       ├── routes/      # API endpoints
│   │       └── rag/         # Vector store setup and retrieval
│   └── trip-planner/        # React frontend
│       └── src/
│           ├── components/  # UI components (AgentActivityFeed, ItineraryDayCard, etc.)
│           ├── pages/       # Main page (index.tsx)
│           └── hooks/       # useAgentStream, useAuth, etc.
├── lib/                     # Shared libraries
├── scripts/                 # Build and utility scripts
├── .env                     # API keys (never commit this)
├── package.json             # Root workspace config
└── pnpm-workspace.yaml      # Workspace definition
```

---

## Getting Started

### Prerequisites

- Node.js 24+
- pnpm (`npm install -g pnpm`)
- A Google Gemini API key (free tier at aistudio.google.com)

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd Travel-Agent-AI
pnpm install
```

> Always run `pnpm install` from the root — never `npm install` inside a subfolder.

### 2. Set Up Environment Variables

Create a `.env` file in the root folder:

```env
GOOGLE_API_KEY=your_gemini_api_key_here
PORT=5000
```

That's all that's required to run the app locally. The app handles auth and data internally without needing additional secrets.

### 3. Run the App

Open **two terminals** and run one command in each:

**Terminal 1 — Backend (port 5000):**
```bash
cd artifacts/api-server
npm run dev
```

**Terminal 2 — Frontend (port 5173):**
```bash
cd artifacts/trip-planner
npm run dev
```

> Always start the backend first — the frontend proxies API calls to port 5000. If backend isn't running you'll get `ECONNREFUSED` on login.

Then open your browser at:
```
http://localhost:5173
```

Sign up for an account, then start planning your trip.

---

## How It Works

```
User logs in → enters trip details (Travelling From, Destination, Dates, Budget)
    ↓
Orchestrator Agent — decomposes the trip request into sub-tasks
    ↓
Transport Agent    Hotels Agent    Activities Agent   ← run in parallel
    ↓                   ↓                ↓
Budget Agent — validates total cost, rejects if over budget
    ↓
[If rejected] → sends back to relevant agent with lower cap → agent retries
    ↓
[If approved] → Final itinerary shown as day-by-day flashcards
    ↓
User clicks "Book This Trip" button
    ↓
Executioner Agent — simulates booking confirmation (demo mode, no real bookings)
```

---

## Architecture Decisions

- **Orchestrator-worker pattern** — one lead agent owns the goal and dispatches sub-tasks rather than agents talking freely to each other, which is more reliable and predictable
- **Streaming agent status via SSE** — agent negotiation is streamed to the frontend in real time so the user sees the system thinking, not just a final result appearing
- **RAG for static knowledge, live APIs for dynamic data** — destination guides and local tips come from a vector store; prices and availability come from live API calls
- **Explicit booking step** — the Executioner Agent is gated behind a user button rather than auto-triggering, making the system transparent and trustworthy
- **Transport Agent over Flights Agent** — covers flights, trains, and road options in one agent so users get the best mode for their budget, not just the cheapest flight
- **cross-env for Windows compatibility** — `npm run dev` works on both Windows and Unix without separate scripts
- **pnpm workspaces** — frontend and backend share types and API contracts through workspace packages, keeping everything in sync without duplication

---

## API Keys Required

| Key | Where to get it | Purpose |
|---|---|---|
| `GOOGLE_API_KEY` | aistudio.google.com | Gemini LLM + embeddings |
| `PORT` | Set to `5000` | Backend server port |

> **Gemini free tier note:** Limited to 20 requests/day on `gemini-2.5-flash`. For more headroom, switch to `gemini-1.5-flash` (1500 req/day free) or upgrade to pay-as-you-go at aistudio.google.com.

---

## Gotchas

- Always run `pnpm install` from the **root folder** — npm will fail with `EUNSUPPORTEDPROTOCOL` inside subfolders
- Start the **backend before the frontend** — frontend proxies to port 5000, you'll get `ECONNREFUSED` on login if backend isn't running
- The `.env` file must be in the **root folder** — api-server reads it with `--env-file=../../.env` relative to its dist folder
- Only two env vars needed: `GOOGLE_API_KEY` and `PORT=5000` — the app runs without any other secrets
- `cross-env` is required for `npm run dev` to work on Windows — already installed as a dev dependency in both packages
- Gemini free tier hits 20 requests/day quickly during testing — save real API calls for full agent flow testing, not UI work

---

## Useful Commands

```bash
# Install all dependencies (always from root)
pnpm install

# Run backend (Terminal 1)
cd artifacts/api-server
npm run dev

# Run frontend (Terminal 2)
cd artifacts/trip-planner
npm run dev

# Full typecheck across all packages
pnpm run typecheck

# Build all packages
pnpm run build
```

---

## Competition & Credits

Built as a university competition project exploring multi-agent AI architectures applied to real-world travel logistics. The core differentiator is transparency — visible agent negotiation, explicit booking consent, and reasoning notes on every recommendation.

**Inspired by the question:** *What if AI trip planning felt less like a black box and more like watching a team of specialists do their jobs?*

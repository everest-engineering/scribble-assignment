# Quickstart / Validation Guide: Game Start & Drawer Flow

Proves Scenario 2 end-to-end. See [contracts/rooms-api.md](./contracts/rooms-api.md) for the HTTP
contract and [data-model.md](./data-model.md) for entity details. Builds on Group 1.

## Prerequisites

- Node.js 18+, npm 9+
- Two browser tabs (or two browsers) — one host/drawer, one joiner/guesser

## Setup

```bash
# Terminal 1 — backend
cd backend
npm install
npm run dev      # http://localhost:3001  (GET /health → { "ok": true })

# Terminal 2 — frontend
cd frontend
npm install
npm run dev      # http://localhost:5173
```

## Automated checks

```bash
cd backend && npm test     # wordSelection determinism; start assigns roles+word; guesser word hidden; isolation; name validation
cd frontend && npm test    # api client snapshot type usage
cd backend && npm run build && cd ../frontend && npm run build
```

## Manual validation (two tabs)

| # | Action | Expected (requirement) |
|---|--------|------------------------|
| 1 | Tab 1: Create Room with name `"   "` (spaces) | Blocked with a validation message; no room created (FR-020, FR-022, SC-001) |
| 2 | Tab 1: Create Room with name `"  Alice "` | Succeeds; participant stored as `Alice` (trimmed) (FR-021) |
| 3 | Tab 2: Join with empty/whitespace name | Blocked with a message; no join (FR-020, FR-022) |
| 4 | Tab 2: Join with name `"Bob"` and the code | Both tabs in the same lobby (Group 1) |
| 5 | Tab 1 (host) with Alice+Bob: click Start | Both tabs land on `/game`; status `started` (Group 1 + FR-025) |
| 6 | Tab 1 (host/drawer) game screen | Alice shown as **drawer**; the **secret word is visible** (FR-023, FR-028, FR-031) |
| 7 | Tab 2 (guesser) game screen | Alice shown as drawer; **no secret word** anywhere (FR-024, FR-029, FR-031, SC-002) |
| 8 | Tab 2: open DevTools → inspect `GET /rooms/:code` response | Response has **no `secretWord` field** (FR-029, FR-030, SC-004) |
| 9 | Refresh both tabs | Drawer still sees the word; guesser still does not (FR-027) |
| 10 | Create a 2nd room in a 3rd tab and start it | Its word/drawer are independent; no leakage into room 1 (SC-005) |

## Determinism spot-check (optional)

```bash
# Same code must always map to the same word
cd backend && npx tsx -e "import {selectWord} from './src/services/wordSelection.ts'; import {STARTER_WORDS} from './src/seed/starterData.ts'; console.log(selectWord('ABCD', STARTER_WORDS), selectWord('ABCD', STARTER_WORDS));"
```

## Notes

- Drawing, guessing, scoring, results, and restart are **not** in this group (Groups 3–4, FR-032).
- The guesser never receives the word over the wire — hiding is server-side, not UI-only (FR-030).
- Restarting the backend clears all rooms (in-memory only).

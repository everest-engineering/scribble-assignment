# Quickstart / Validation Guide: Room Setup & Lobby

Proves Scenario 1 end-to-end. See [contracts/rooms-api.md](./contracts/rooms-api.md) for the HTTP
contract and [data-model.md](./data-model.md) for entity details.

## Prerequisites

- Node.js 18+, npm 9+
- Two browser tabs (or two browsers)

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
cd backend && npm test     # roomStore + schemas: host set, start gates, isolation
cd frontend && npm test    # api client: startGame target
cd backend && npm run build && cd ../frontend && npm run build
```

## Manual validation (two tabs)

| # | Action | Expected (requirement) |
|---|--------|------------------------|
| 1 | Tab 1: Create Room, name "Alice" | Lobby shows uppercase code; Alice marked **host** (FR-001, FR-002, FR-005a) |
| 2 | Tab 2: Join Room with that code, name "Bob" | Both tabs resolve to same room (FR-004) |
| 3 | Watch Tab 1 without clicking | Bob appears within ~2s, no manual refresh (FR-009, SC-003) |
| 4 | Tab 2: try Join with a random code | "Room not found"; stays on join screen (FR-006) |
| 5 | Tab 2: try Join with empty code | Clear validation message; no join (FR-007) |
| 6 | Tab 1 with only Alice present | Start disabled, explains 2-player minimum (FR-013, FR-016) |
| 7 | Tab 2 (non-host) view | No enabled start control; "waiting for host" (FR-012, FR-016) |
| 8 | Tab 1 (host) with Alice+Bob | Start enabled; click it | Both tabs land on game screen; status `started` (FR-017, SC-007) |
| 9 | (optional) curl start as Bob's id | `403 Only the host can start` (FR-014) |
| 10 | Create a second room in a 3rd tab | Players/actions never leak into the first room (FR-008, SC-005) |

## Notes

- After start, the game screen is still the existing placeholder — drawer/word arrive in Group 2.
- Restarting the backend clears all rooms (in-memory only).

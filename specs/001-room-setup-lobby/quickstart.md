# Quickstart & Validation: Room Setup & Lobby

How to run the feature and verify every Scenario 1 acceptance criterion with two browser tabs.

## Run

```bash
# Terminal 1
cd backend && npm install && npm run dev      # http://localhost:3001

# Terminal 2
cd frontend && npm install && npm run dev     # http://localhost:5173
```

Health check: `http://localhost:3001/` returns `{ "ok": true, "service": "scribble-api" }`.

## Build (before handoff)

```bash
cd backend && npm run build
cd frontend && npm run build
```

## Unit tests

```bash
cd backend && npm test     # roomStore + schemas: host, canStart, validation, isolation
cd frontend && npm test    # api request shape
```

## Two-tab acceptance walkthrough

| # | Steps | Expected (maps to spec) |
|---|-------|-------------------------|
| 1 | Tab A: create a room | Unique code shown; land in lobby; **you are marked host** (US1 / FR-001..003) |
| 2 | Tab A alone | Start control disabled with "need at least 2 players" message (US5 / FR-013,014) |
| 3 | Tab B: join with Tab A's code | Tab B lands in lobby as non-host (US2 / FR-004) |
| 4 | Watch Tab A (no clicking) | Tab B's player appears within ~2s automatically (US4 / FR-010) |
| 5 | Tab A now | Start control becomes available to the host (US5 / FR-013) |
| 6 | Tab B now | No Start control for the non-host (US5 / FR-012) |
| 7 | Tab B: try code in lower-case | Resolves to same room (edge: case-insensitive / FR-005) |
| 8 | New tab: join with empty code | Clear "code required" message; no navigation (US3 / FR-006) |
| 9 | New tab: join with `ZZZZ` (unknown) | Clear "Room not found" message; no navigation (US3 / FR-007) |
| 10 | Create a second, separate room | Different code; its own participant list; no leakage (FR-008 / SC-002) |
| 11 | Stop the backend, then poll/join | Lobby keeps last list (no crash); join shows "Room not found" (FR-015, edge) |
| 12 | Leave the lobby (navigate away) | Polling stops (no further network calls) (FR-011) |

## Pass criteria

All rows above behave as in the Expected column, both builds succeed, and unit tests pass.
Only then is Scenario 1 complete and ready to move to Scenario 2.

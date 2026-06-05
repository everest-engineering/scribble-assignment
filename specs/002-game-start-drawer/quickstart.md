# Quickstart & Validation: Game Start & Drawer Flow

How to run the feature and verify every Scenario 2 acceptance criterion with two browser tabs.

## Run

```bash
# Terminal 1
cd backend && npm install && npm run dev      # http://localhost:3001

# Terminal 2
cd frontend && npm install && npm run dev     # http://localhost:5173
```

## Build (before handoff)

```bash
cd backend && npm run build
cd frontend && npm run build
```

## Unit tests

```bash
cd backend && npm test     # start/drawer/deterministic word/drawer-only + name validation
```

## Two-tab acceptance walkthrough

| # | Steps | Expected (maps to spec) |
|---|-------|-------------------------|
| 1 | Create a room as "Alice" (Tab A) | Lobby; Alice is host (US4 names valid / FR-014) |
| 2 | Tab A: try creating/joining with a blank or spaces-only name | Rejected with "name required"; no room action (US4 / FR-012,013) |
| 3 | Tab B: join with "  Bob  " (surrounding spaces) | Joins; name shows trimmed as "Bob" (US4 / FR-012,014) |
| 4 | Tab A (host): click Start (2 players present) | Room enters active round; host sees the game view (US1 / FR-001,002) |
| 5 | Watch Tab B (no clicking) | Bob is carried into the game view within ~2s automatically (US1 / FR-003) |
| 6 | Both tabs: look at the drawer indicator | Alice (host) is shown as the drawer to both (US2 / FR-005,007) |
| 7 | Tab A vs Tab B: own role | Alice sees "you are the drawer"; Bob sees "you are a guesser" (US2 / FR-008) |
| 8 | Tab A (drawer): secret word | A starter word is shown to the drawer (US3 / FR-009) |
| 9 | Tab B (guesser): secret word | The word is NOT shown anywhere to Bob (US3 / FR-011) |
| 10 | Wait through several refresh cycles | Same word and same drawer every time (US3 / FR-010, SC-006) |
| 11 | Inspect Bob's network response for the room | `secretWord` is `null`; word absent from payload (FR-011 / SC-005) |
| 12 | Restart backend, recreate the same flow | Same room code path yields the same deterministic word (SC-004) |

## API smoke check (optional)

```bash
# create host, join a 2nd player, then start; confirm drawer sees the word, guesser does not
# POST /rooms {playerName} -> participantId(host)
# POST /rooms/:code/join {playerName} -> participantId(guesser)
# POST /rooms/:code/start {participantId: host} -> status "playing", secretWord present
# GET  /rooms/:code?participantId=<guesser> -> secretWord: null
```

## Pass criteria

All rows behave as in the Expected column, both builds succeed, and unit tests pass. Only then is
Scenario 2 complete and ready to move to Scenario 3 (gameplay interaction).

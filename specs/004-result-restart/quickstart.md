# Quickstart & Validation: Result, Restart & Final Validation

How to run the feature and verify every Scenario 4 acceptance criterion — including the full
end-to-end loop (SC-008) — with two browser tabs.

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
cd backend && npm test     # end/restart transitions, host-only, state clearing, score reset, reveal
```

## Two-tab acceptance walkthrough (full loop)

Set up: Tab A creates a room ("Alice"), Tab B joins ("Bob"); Alice (host) starts; Bob submits a
guess or two (some correct/incorrect) to populate scores and history.

| # | Steps | Expected (maps to spec) |
|---|-------|-------------------------|
| 1 | Tab B (guesser): look for an End-Round control | None available to the non-host (US3 / FR-012) |
| 2 | Tab A (host): click End Round | Room enters the result state; host sees the result view (US1 / FR-001) |
| 3 | Watch Tab B (no clicking) | Bob is moved to the result view within ~2s (US1 / FR-006, SC-002) |
| 4 | Both tabs: read the result | Same correct word, same final scores, same full guess history (US1 / FR-003,004,005, SC-001) |
| 5 | Tab B (former guesser): the word | The correct word is now revealed to Bob (US1 / FR-003) |
| 6 | Tab B: look for a Restart control | None available to the non-host (US3 / FR-013) |
| 7 | Tab A (host): click Restart | Room returns to the lobby; host sees the lobby (US2 / FR-007) |
| 8 | Watch Tab B (no clicking) | Bob is returned to the lobby within ~2s (US2 / FR-010, SC-005) |
| 9 | Both tabs: the lobby | Same participants as before (Alice host, Bob), nothing dropped (US2 / FR-008, SC-003) |
| 10 | Inspect state after restart | No word, no drawer, empty history, blank canvas, scores all 0 (US2 / FR-009, SC-004) |
| 11 | Tab A (host): start again | A new round starts under the same rules (host + 2 players) (US2 / FR-011, SC-007) |
| 12 | Full loop | join → play → synced result → restart → lobby works end to end (SC-008) |

## API smoke check (optional)

```bash
# create(Alice)->host; join(Bob); start{host}; guess{Bob}
# POST /rooms/:code/end {participantId: Bob}   -> 403 (non-host)
# POST /rooms/:code/end {participantId: host}  -> 200, status "result"
# GET  /rooms/:code?participantId=<Bob>        -> secretWord revealed; full history
# POST /rooms/:code/restart {participantId: host} -> 200, status "lobby", scores 0, no word
```

## Pass criteria

All rows behave as in the Expected column, both builds succeed, and unit tests pass. Passing the
full loop (row 12 / SC-008) completes the lab's core gameplay requirement.

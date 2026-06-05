# Quickstart & Validation: Gameplay Interaction

How to run the feature and verify every Scenario 3 acceptance criterion with two browser tabs.

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
cd backend && npm test     # guess validation, case-insensitive match, scoring, secrecy, order
```

## Two-tab acceptance walkthrough

Set up: Tab A creates a room ("Alice"), Tab B joins ("Bob"); Alice (host) starts. Alice is the
drawer, Bob is a guesser. (Add a Tab C "Carol" guesser to check secrecy across guessers.)

| # | Steps | Expected (maps to spec) |
|---|-------|-------------------------|
| 1 | After start, look at the scoreboard in every tab | All scores are 0 (US3 / FR-011, SC-004) |
| 2 | Tab A (drawer): draw on the canvas, then Clear | Strokes appear, then canvas empties (US4 / FR-016,017) |
| 3 | Tab B (guesser): look for drawing tools | None available; the drawing shows read-only (US4 / FR-018) |
| 3b | Tab A draws; watch Tab B (no clicking) | Tab B sees the drawing appear/update within ~2s; a Clear also propagates (US4 / FR-021, SC-009) |
| 4 | Tab A (drawer): look for a guess box | Drawer cannot submit a guess (US1 / FR-005) |
| 5 | Tab B: submit an empty / spaces-only guess | Rejected with "guess cannot be empty"; nothing recorded (US1 / FR-003, SC-001) |
| 6 | Tab B: submit a wrong word | Recorded as incorrect; Bob's score stays 0 (US1/US3 / FR-013) |
| 7 | Watch Tab A/C (no clicking) | Bob's guess appears in everyone's history within ~2s (US2 / FR-008, SC-006) |
| 8 | Tab B: submit the word in odd casing/spacing (e.g. "  Castle ") | Counts as correct; Bob's score becomes 100 (US1/US3 / FR-002,012, SC-002) |
| 9 | Tab C (other guesser): view the history entry for Bob's correct guess | Shown as "correct" but the word/text is NOT revealed to Carol (US2 / FR-009, SC-007) |
| 10 | Tab B: submit the correct word again | Score stays 100 (no farming) (US3 / FR-014, SC-005) |
| 11 | Tab C: submit the correct word | Carol independently reaches 100 (US3 / FR-012) |
| 12 | Tab A (drawer): view the history | Drawer can see correct-guess text (drawer already knows the word) (FR-009) |

## API smoke check (optional)

```bash
# create(Alice) -> host; join(Bob) -> guesser; start{host}
# POST /rooms/:code/guess {participantId: bob, text: "   "}      -> 400
# POST /rooms/:code/guess {participantId: host, text: "castle"}  -> 403 (drawer)
# POST /rooms/:code/guess {participantId: bob, text: " CASTLE "} -> 200, scores: Bob=100
# GET  /rooms/:code?participantId=<carol>  -> Bob's correct guess text is null; word hidden
```

## Pass criteria

All rows behave as in the Expected column, both builds succeed, and unit tests pass. Only then is
Scenario 3 complete and ready to move to Scenario 4 (result, restart & final validation).

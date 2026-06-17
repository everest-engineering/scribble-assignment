# Quickstart & Validation: Gameplay Interaction

Two-browser validation for Scenario 3. Run after `/speckit.implement`. Each check maps to FR/SC.

## Prerequisites

```bash
cd backend && npm install && npm run dev    # :3001
cd frontend && npm install && npm run dev    # :5173
```
Two independent sessions: **Tab A = host/drawer**, **Tab B = guesser**. Create a room (A), join (B), host starts.

## Validation scenarios

### V1 — Drawer can draw and clear  _(US1; FR-001..003; SC-001)_
1. Tab A (drawer): drag on the canvas → ✅ freehand strokes appear; click **Clear** → ✅ canvas empties.
2. Tab B (guesser): ✅ cannot draw on the canvas (no drawing surface / inert area).

### V2 — Guess validation  _(US2; FR-004..006; SC-002)_
1. Tab B: submit an **empty** guess → ✅ "Enter a guess.", nothing recorded.
2. Tab B: submit a **wrong** guess (e.g. "pizza" when word isn't pizza) → ✅ accepted, marked incorrect.
3. Tab B: submit the word in **different case + spaces** (e.g. "  CASTLE ") → ✅ accepted, marked correct.
4. Tab A (drawer): ✅ no guess input is available.

### V3 — Guess history synced to all  _(US3; FR-007, FR-008; SC-003)_
1. After B's guesses, check the **Activity** panel on **both** tabs.
   ✅ Both show the same guesses, in order, with the guesser's name, appearing within ~2s (no manual refresh).

### V4 — Scoring  _(US4; FR-009..012, FR-011a; SC-004)_
1. At round start, the **Scoreboard** shows every player at **0**.
2. After B's **correct** guess: ✅ B's score becomes **100** on **both** tabs within ~2s.
3. B's **incorrect** guesses: ✅ no score change.
4. After scoring, ✅ B's guess input is **disabled** (FR-011a); a forced repeat submit is refused.

### V5 — No regression  _(FR-013; SC-005)_
- Word still shows only to the drawer (Group 2); host/lobby/start/name rules still work (Groups 1–2).

### (Optional) V6 — Server enforcement via curl  _(FR-004, FR-005, FR-011a)_
```bash
curl -i -X POST localhost:3001/rooms/CODE/guess -H 'Content-Type: application/json' -d '{"participantId":"<drawer-id>","text":"x"}'   # 403
curl -i -X POST localhost:3001/rooms/CODE/guess -H 'Content-Type: application/json' -d '{"participantId":"<guesser-id>","text":"   "}' # 400
```

## Pass criteria

V1–V5 behave as described (V6 optional). Any deviation logged against the relevant FR and fixed or recorded
as a documented deviation (Principle V) before the group is marked done.

## Automated tests

```bash
cd backend && npm test     # incl. new submitGuess tests (empty/drawer/correct/incorrect/repeat/score)
cd frontend && npm test
```
New service-level assertions come from the [contract test checklist](./contracts/rooms-api.md).

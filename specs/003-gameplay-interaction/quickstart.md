# Quickstart Validation Guide: Gameplay Interaction

**Branch**: `003-gameplay-interaction` | **Date**: 2026-06-10

This guide lets you validate every acceptance criterion end-to-end in two browser tabs after the feature is implemented.

## Prerequisites

- Node.js 18+ and npm 9+
- Repository cloned, on branch `003-gameplay-interaction`

## Setup

```bash
# Terminal 1 — backend
cd backend && npm install && npm run dev

# Terminal 2 — frontend
cd frontend && npm install && npm run dev
```

Frontend: `http://localhost:5173` | Backend: `http://localhost:3001`

Verify TypeScript builds pass before validating:

```bash
cd backend && npm run build
cd frontend && npm run build
```

## Scenario 1 — Drawer Draws on Canvas (US-1 / FR-001, FR-002, FR-003)

**Setup**: Tab A as host, Tab B as second player. Start the game. Tab A should be the drawer (first joiner = drawer).

1. In Tab A (drawer), locate the canvas — it must be a real `<canvas>` element, not a placeholder `div`.
2. Press and drag the mouse across the canvas. A visible freehand line must appear along the path.
3. Release and press again elsewhere. A new independent stroke begins.
4. Click "Clear". All strokes disappear immediately on Tab A.

**Expected**: SC-004, SC-005 pass.

## Scenario 2 — Guesser Sees Drawing via Polling (US-3 / FR-015, FR-016, FR-012)

**Setup**: Continuation of Scenario 1 (game already started).

1. In Tab A (drawer), draw a few lines.
2. Wait up to 2 seconds.
3. In Tab B (guesser), the canvas must show the drawer's drawing (approximately).
4. In Tab A, click "Clear".
5. Wait up to 2 seconds.
6. In Tab B, the canvas must now be blank.

**Expected**: SC-003 (canvas dimension) passes.

## Scenario 3 — Correct Guess (US-2 / FR-005–FR-010)

**Setup**: Game started. Secret word is "rocket".

1. In Tab B (guesser), type "Rocket" in the guess input and submit.
2. Server response must be HTTP 200 with `{ guess: { correct: true, points: 100, ... } }` (visible in browser DevTools Network tab).
3. Wait up to 2 seconds.
4. Both Tab A and Tab B scoreboard must show "Bob: 100" (or whatever the guesser's name is).
5. Both tabs' guess history must list the guess entry.

**Expected**: SC-001, SC-003 pass.

## Scenario 4 — Incorrect Guess (US-2 / FR-009)

1. In Tab B, type "pizza" and submit.
2. Response must be 200 with `{ guess: { correct: false, points: 0, ... } }`.
3. Score does not change (still 100 if Scenario 3 ran first, or 0).

**Expected**: SC-001 passes for incorrect case.

## Scenario 5 — Empty / Whitespace Guess Rejected (Edge Case / FR-006)

1. In Tab B, submit an empty guess (or spaces only).
2. Response must be HTTP 400 with a descriptive error message.
3. Guess history must NOT include this entry (verify via poll).

**Expected**: SC-002 passes.

## Scenario 6 — Role-Appropriate Views (US-4 / FR-013, FR-014)

1. In Tab A (drawer): secret word visible, canvas interactive, "Clear" button present, NO guess input form.
2. In Tab B (guesser): canvas visible (read/receive), guess input present, NO secret word displayed.

**Expected**: SC-006 passes.

## Scenario 7 — Guess History Sync (US-3 / FR-011, FR-012)

1. Submit 3 guesses from Tab B (mix of correct and incorrect).
2. After each guess, wait up to 2 seconds.
3. Both tabs must display all 3 guesses in submission order.

**Expected**: SC-001 (storage), SC-003 (visibility) pass.

## API Smoke Tests (optional, via curl)

```bash
# Setup: get room code from browser
CODE=ABCD

# Submit a valid guess
curl -s -X POST http://localhost:3001/rooms/$CODE/guess \
  -H "Content-Type: application/json" \
  -d '{"playerName":"Bob","guess":"rocket"}'

# Submit an empty guess — expect 400
curl -s -X POST http://localhost:3001/rooms/$CODE/guess \
  -H "Content-Type: application/json" \
  -d '{"playerName":"Bob","guess":"   "}'

# Submit a stroke
curl -s -X POST http://localhost:3001/rooms/$CODE/stroke \
  -H "Content-Type: application/json" \
  -d '{"points":[{"x":10,"y":20},{"x":15,"y":25}]}'

# Clear strokes
curl -s -X POST http://localhost:3001/rooms/$CODE/clear

# Verify room snapshot includes guesses, scores, strokes
curl -s "http://localhost:3001/rooms/$CODE?participantId=<id>" | jq '.room | {guesses,scores,strokes}'
```

## References

- API contracts: [contracts/api.md](contracts/api.md)
- Data model: [data-model.md](data-model.md)
- Spec: [spec.md](spec.md)

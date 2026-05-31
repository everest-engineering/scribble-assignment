# Quickstart: Manual Testing — Gameplay Interaction

**Feature**: 003 — Gameplay Interaction
**Date**: 2026-05-31

Use this guide to manually verify each user story after implementation.
No automated tests are required by the constitution, but each scenario below
maps 1-to-1 with the spec's acceptance scenarios.

---

## Prerequisites

```bash
# Terminal 1 — backend
cd backend && npm run dev     # starts on http://localhost:3001

# Terminal 2 — frontend
cd frontend && npm run dev    # starts on http://localhost:5173
```

Open **two browser tabs**: one acts as the host/drawer, one as a guesser.

---

## US1 — Drawer Uses the Canvas

**Setup**: In Tab 1 (host), create a room and start the game. Tab 1 is the drawer.

### Scenario 1 — Draw strokes appear immediately
1. In Tab 1 (drawer), locate the drawing canvas.
2. Click and drag on the canvas to draw a stroke.
3. **Expect**: The stroke renders on the canvas in real time with no lag or
   page reload.

### Scenario 2 — Clear button removes all strokes
1. Draw several strokes on the canvas.
2. Click the **Clear** button.
3. **Expect**: The canvas is completely blank immediately.

### Scenario 3 — Guesser sees no drawing controls
1. In Tab 2 (guesser), navigate to the game screen.
2. **Expect**: No canvas or drawing tools are visible. A message like
   "Drawer is drawing…" or an empty placeholder is shown instead.

---

## US2 — Guesser Submits a Guess

**Setup**: Active round running. Tab 2 is a guesser.

### Scenario 1 — Empty / whitespace guess rejected
1. In the guess input field, leave it empty and click **Submit** (or press Enter).
2. **Expect**: An inline error message appears (e.g., "Guess cannot be empty").
   No network request is made (client rejects first).
3. Repeat with a guess of `"   "` (spaces only).
4. **Expect**: Same rejection.

### Scenario 2 — Incorrect guess recorded, score unchanged
1. Type an incorrect guess (e.g., `"banana"`) and submit.
2. **Expect**:
   - The guess appears in the guess history list.
   - The guesser's score remains 0.
   - The entry is visually marked as incorrect.

### Scenario 3 — Correct guess scores 100 points
1. The secret word for Round 1 is `"rocket"` (STARTER_WORDS index 0).
2. In Tab 2, type `"  Rocket  "` (with surrounding spaces and capital R) and
   submit.
3. **Expect**:
   - The guess is trimmed to `"Rocket"` and matched case-insensitively.
   - The entry appears in the guess history marked as correct.
   - The guesser's score updates to 100.

---

## US3 — Guess History Visible to All Players

**Setup**: Active round running. Tabs 1 (drawer) and 2 (guesser) both open.

### Scenario 1 — New guess appears on all screens within poll interval
1. In Tab 2, submit any valid guess.
2. Within 2 seconds (the poll interval), check Tab 1.
3. **Expect**: The guess appears in the history on Tab 1 without a page reload.

### Scenario 2 — Full history on poll
1. Submit three guesses in Tab 2 (mix of correct and incorrect).
2. Reload Tab 1 (or open a fresh third tab and navigate to the game).
3. **Expect**: All three guesses appear in submission order immediately after
   the first poll.

### Scenario 3 — Correct guesses are visually distinguishable
1. Submit one incorrect guess and one correct guess.
2. **Expect**: The two entries in the history look different — e.g., correct
   guesses shown in green or with a ✓ indicator, incorrect in red or with ✗.

---

## Edge Cases to Spot-Check

| Scenario | Steps | Expected |
|----------|-------|----------|
| Whitespace-only that trims to empty | Submit `"   "` | Rejected client-side with inline error |
| Two guessers submit correct answer | Both Tab 2 and Tab 3 submit `"rocket"` | Both receive 100 pts; history shows two correct entries |
| Correct answer submitted twice by same guesser | Submit `"rocket"` twice from Tab 2 | Score becomes 200; both entries in history |
| Polling with no new guesses | Wait 5 seconds with no submissions | Guess history unchanged; no error or spinner shown |
| Mixed-case secret word | Secret word `"APPLE"`, submit `"apple"` | Treated as correct |

---

## API Smoke Tests (curl)

Use these to verify backend endpoints independently of the UI.

```bash
CODE="ABCD"   # replace with your actual room code
PID="your-participant-id"

# Submit a guess
curl -s -X POST http://localhost:3001/api/rooms/$CODE/guesses \
  -H "Content-Type: application/json" \
  -d '{"participantId":"'"$PID"'","guessText":"  rocket  "}' | jq

# Fetch guess history
curl -s http://localhost:3001/api/rooms/$CODE/guesses | jq

# Empty guess — expect 400
curl -s -X POST http://localhost:3001/api/rooms/$CODE/guesses \
  -H "Content-Type: application/json" \
  -d '{"participantId":"'"$PID"'","guessText":"   "}' | jq
```

# Manual Test: Phase 3 — Gameplay Interaction (Drawing, Guessing, Scoring)

**Fulfills**: T027 (specs/003-gameplay-interaction/tasks.md)

## Prerequisites

```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```

Open three browser tabs at `http://localhost:5173`.

---

## Setup: Create Room and Start Game

| Step | Tab | Action | Expected |
|------|-----|--------|----------|
| 1 | A | Click **Create Room**, enter `Alice`, submit | Lobby with Alice (Host), room code visible |
| 2 | B | Click **Join Room**, enter code & `Bob`, submit | Both tabs show Alice + Bob |
| 3 | C | Click **Join Room**, enter code & `Charlie`, submit | All three tabs show Alice + Bob + Charlie |
| 4 | A | Click **Start Game** | All tabs navigate to `/game` |

---

## Test 1: Drawer Draws on Canvas

| Step | Tab | Action | Expected |
|------|-----|--------|----------|
| 1 | A (Alice — Drawer) | Draw a few lines on the canvas using mouse/touch | Lines appear immediately as you draw |
| 2 | A | — | **Clear Canvas** button visible below canvas |
| 3 | A | — | Cursor shows crosshair on canvas |
| 4 | B (Bob — Guesser) | Wait ~2s for poll | Same drawing appears on Bob's canvas |
| 5 | B | — | Canvas is read-only (no crosshair cursor, no drawing possible) |
| 6 | C (Charlie) | Wait ~2s | Same drawing visible |

---

## Test 2: Drawer Clears Canvas

| Step | Tab | Action | Expected |
|------|-----|--------|----------|
| 1 | A | Click **Clear Canvas** | Canvas goes blank |
| 2 | B | Wait ~2s | Canvas goes blank |
| 3 | C | Wait ~2s | Canvas goes blank |

---

## Test 3: Guesser Submits Incorrect Guess

| Step | Tab | Action | Expected |
|------|-----|--------|----------|
| 1 | B | Type `house` in guess input, click **Submit Guess** | Input clears, guess appears in Activity panel |
| 2 | B | Look at Activity panel | Shows "Bob: house" (no green highlight) |
| 3 | B | Look at Scoreboard | Bob's score: **0** |
| 4 | A | Wait ~2s | Activity shows "Bob: house" |
| 5 | C | Wait ~2s | Activity shows "Bob: house" |

---

## Test 4: Guesser Submits Correct Guess

| Step | Tab | Action | Expected |
|------|-----|--------|----------|
| 1 | A | Note the secret word shown in "Your Word" card | e.g. "rocket" |
| 2 | B | Type the exact secret word (`rocket`) and submit | — |
| 3 | B | Look at Activity panel | Shows "Bob: rocket" with green background + **Correct!** badge |
| 4 | B | Look at Scoreboard | Bob's score: **100** |
| 5 | B | Look at guess input | Input is disabled, shows "You guessed correctly!" message |
| 6 | A | Wait ~2s | Activity shows Bob's correct guess with highlight |
| 7 | A | Look at Scoreboard | Bob's score: **100** |
| 8 | C | Wait ~2s | Same as A |

---

## Test 5: Already-Correct Guesser Cannot Guess Again

| Step | Tab | Action | Expected |
|------|-----|--------|----------|
| 1 | B | Try to type in the guess input | Input is disabled / greyed out |
| 2 | B | Try to submit by hitting Enter | Nothing happens — form is disabled |
| 3 | C | Open DevTools → Console, run: `fetch("/rooms/XXXX/guess", {method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({participantId:"<Bob's-id>", text:"test"})})` | Server returns 403 "You have already guessed the word correctly" |

---

## Test 6: Guess Validation — Empty / Whitespace / Too Long

| Step | Tab | Action | Expected |
|------|-----|--------|----------|
| 1 | C | Leave input empty, click **Submit Guess** | Client error: "Guess cannot be empty" |
| 2 | C | Type `   ` (spaces only), submit | Client error: "Guess cannot be empty" (trimmed to empty) |
| 3 | C | Type a 51-character string, submit | Client error: "Guess must be 50 characters or fewer" |
| 4 | C | Open DevTools → Console, POST empty text directly to API | Server returns 400 "Guess cannot be empty" |
| 5 | C | Open DevTools → Console, POST 51-char text directly to API | Server returns 400 "Guess must be 50 characters or fewer" |

---

## Test 7: Case-Insensitive Correct Guess

| Step | Tab | Action | Expected |
|------|-----|--------|----------|
| 1 | C | Type the secret word in UPPERCASE (e.g. `ROCKET`), submit | Accepted as correct, Charlie gets **100** points |
| 2 | C | Look at Scoreboard | Charlie: **100** |
| 3 | C | Look at Activity | Shows "Charlie: ROCKET" with green highlight |
| 4 | A | Wait ~2s | Sees Charlie's correct guess and updated score |

---

## Test 8: Scoreboard Shows Live Scores

| Step | Tab | Action | Expected |
|------|-----|--------|----------|
| 1 | Any | Look at Scoreboard | Sorted by score descending (highest first) |
| 2 | — | — | Shows player names with their scores |

---

## Test 9: Drawing Persists After Guess Submissions

| Step | Tab | Action | Expected |
|------|-----|--------|----------|
| 1 | A | Draw additional lines on canvas | Lines appear |
| 2 | B | — | Canvas still shows lines (drawing not affected by guesses) |
| 3 | C | — | Same drawing visible |

---

## Test 10: State Survives Page Refresh

| Step | Tab | Action | Expected |
|------|-----|--------|----------|
| 1 | Any | Refresh the page (`F5`) | — |
| 2 | — | — | Canvas still shows drawing |
| 3 | — | — | Activity / guess history still populated |
| 4 | — | — | Scores unchanged |

---

## Test 11: Drawer Has No Guess Input

| Step | Tab | Action | Expected |
|------|-----|--------|----------|
| 1 | A (Drawer) | Look at right sidebar | Shows "Your Word" card with secret word |
| 2 | A | — | **No** guess input visible |
| 3 | A | Open DevTools → Console, POST a guess to API with Alice's ID | Server returns 403 "Drawer cannot submit guesses" |

---

## Test 12: Error Conditions (API-Level)

| Test | Action | Expected Error |
|------|--------|----------------|
| Non-existent room draw | `POST /rooms/ZZZZ/draw` | 404 "Room not found" |
| Non-existent room guess | `POST /rooms/ZZZZ/guess` | 404 "Room not found" |
| Wrong participant draws | Non-drawer POSTs to `/draw` | 403 "Only the drawer can update the canvas" |
| Stroke with 1 point | POST `/draw` with stroke that has `points: [{x:0,y:0}]` | 400 "Each stroke must have at least 2 points" |
| Missing participantId | POST `/draw` without `participantId` | 400 "Participant ID required" |

---

## Test 13: Multi-Stroke Canvas Sync

| Step | Tab | Action | Expected |
|------|-----|--------|----------|
| 1 | A | Draw a line, lift pointer | Stroke saved and visible |
| 2 | A | Draw another line elsewhere | Second stroke appears, first stroke preserved |
| 3 | B | Wait ~2s | Both strokes visible (full canvas synced) |
| 4 | A | Click **Clear Canvas** | Both strokes cleared |
| 5 | B | Wait ~2s | Blank canvas |

---

## Visual Checks

| Check | Expected |
|-------|----------|
| Canvas area | White board with border, responsive width |
| Drawer cursor | Crosshair on canvas |
| Guesser cursor | Default cursor on canvas |
| Clear button | Visible only for drawer, below canvas |
| Activity panel | Shows ordered guess list with guesser name + text |
| Correct guess | Green background (`#d1fae5`) + "Correct!" badge |
| Incorrect guess | Light gray background, no badge |
| Scoreboard | Sorted descending, shows all player names + scores |
| Guess input | Disabled with "You guessed correctly!" for correct guessers |
| Guess input | Hidden entirely for drawer (replaced by secret word card) |
| Guess error | Red text below input (client-side and server-side errors) |

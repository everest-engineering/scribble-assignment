# Quickstart & Acceptance Test: Gameplay Interaction (003)

## Prerequisites

- Backend running: `cd backend && npm run dev` (port 3001)
- Frontend running: `cd frontend && npm run dev` (port 5173)
- Two browser tabs open side-by-side

---

## Two-Tab Acceptance Test

### Setup (same for all acceptance scenarios)

1. **Tab A (Alice / Drawer)**:
   - Open `http://localhost:5173`
   - Enter name `Alice`, click **Create Room**
   - Note the room code (e.g., `AB3X`)
   - You are now in the lobby

2. **Tab B (Bob / Guesser)**:
   - Open `http://localhost:5173` in a second tab
   - Enter name `Bob`, enter the room code, click **Join Room**
   - Both tabs now show 2 participants in the lobby

3. **Tab A (Alice)**: Click **Start Game**
   - Both tabs navigate to the game screen
   - Tab A shows Alice's secret word
   - Tab B shows the word placeholder (`_ _ _ _` or similar)

---

### SC-001 — Guess Appears in History Within 4 Seconds

1. In **Tab B** (Bob, guesser): type `wrong` in the guess box, click **Submit Guess**
2. Within ~2 seconds: both tabs display a guess entry:
   - Name: **Bob**
   - Text: `wrong`
   - Indicator: incorrect (❌ or "incorrect")
3. Bob's score in both tabs: **0**

**Pass criteria**: Guess appears in both tabs within 4 seconds; score unchanged.

---

### SC-002 — Correct Guess Awards Exactly 100 Points

1. In **Tab B** (Bob): type the actual secret word (visible in **Tab A**), click **Submit Guess**
2. Within ~2 seconds: both tabs update:
   - Guess entry shows Bob's name, the correct word, correct indicator (✓ or "correct")
   - Scoreboard shows Bob: **100**, Alice: **0**
3. Room status transitions to `ended` — "Round Ended" banner appears

**Pass criteria**: Bob's score is exactly 100; all others remain 0; banner visible in both tabs.

---

### SC-003 — Empty Guess Rejected with User-Visible Message

1. In **Tab B**: submit an empty guess (clear the input, click Submit, or submit only spaces)
2. A clear error message appears below the form (e.g., "Guess cannot be empty")
3. No new entry appears in the guess history in either tab

**Pass criteria**: Error message visible; guess history unchanged; no network request recorded
with an empty/whitespace body producing a history entry.

---

### SC-004 — Game Ends Within 4 Seconds of Correct Guess

1. Complete SC-002 steps above
2. Observe: "Round Ended" banner appears in **Tab A** (drawer) and **Tab B** (guesser) within
   4 seconds of Bob submitting the correct word — no page refresh needed

**Pass criteria**: Banner visible in both tabs within 4 seconds; guess form hidden in Tab B.

---

### SC-005 — Canvas Clear Removes All Strokes Immediately

1. In **Tab A** (Alice, drawer): draw several strokes on the canvas
2. Click the **Clear** button
3. All strokes are removed instantly; canvas returns to blank

**Pass criteria**: No strokes remain after clear; no delay.

---

### SC-006 — No Drawing Data Appears on Guesser Screen

1. In **Tab A** (Alice): draw continuously on the canvas
2. In **Tab B** (Bob): observe the game screen
3. No canvas, no strokes, no drawing content appears on Bob's screen

Additional network inspection:
- Open DevTools → Network in **Tab B**
- Observe `GET /rooms/AB3X?participantId=...` poll responses
- Confirm no canvas/stroke data fields appear in any response body

**Pass criteria**: Guesser screen has no drawing-related content; network responses contain
no canvas data.

---

### SC-007 — Existing Test Suites Remain Green

```bash
# Backend
cd backend && npm test

# Frontend
cd frontend && npm test
```

**Pass criteria**: Zero test failures in `schemas.test.ts`, `roomStore.test.ts`, `api.test.ts`,
and all frontend suites.

---

## Automated Test Scenarios (Backend)

Run with: `cd backend && npm test`

| Test | Location | What it verifies |
|------|----------|-----------------|
| `submitGuess — incorrect guess records history, 0 pts, room stays active` | `roomStore.test.ts` | FR-001, FR-006, FR-007 |
| `submitGuess — correct guess awards 100 pts, room ends` | `roomStore.test.ts` | FR-005, FR-008 |
| `submitGuess — case-insensitive match` | `roomStore.test.ts` | FR-004 |
| `submitGuess — whitespace-padded correct guess` | `roomStore.test.ts` | FR-002, FR-004 |
| `submitGuess — empty guess throws 400` | `roomStore.test.ts` | FR-003 |
| `submitGuess — drawer throws 403` | `roomStore.test.ts` | FR-010 |
| `submitGuess — unknown participantId throws 403` | `roomStore.test.ts` | FR-001 |
| `submitGuess — game not active throws 409` | `roomStore.test.ts` | FR-009 |
| `submitGuess — post-ended throws 409` | `roomStore.test.ts` | FR-008, FR-009 |
| `toRoomSnapshot — includes guesses and scores` | `roomStore.test.ts` | FR-011 |
| `toRoomSnapshot — ended status reveals secretWord to all` | `roomStore.test.ts` | Research D6 |
| `POST /rooms/:code/guess — 200 incorrect` | `api.test.ts` | FR-001 |
| `POST /rooms/:code/guess — 200 correct, status ended` | `api.test.ts` | FR-008 |
| `POST /rooms/:code/guess — 400 empty` | `api.test.ts` | FR-003 |
| `POST /rooms/:code/guess — 403 drawer` | `api.test.ts` | FR-010 |
| `POST /rooms/:code/guess — 409 not active` | `api.test.ts` | FR-009 |

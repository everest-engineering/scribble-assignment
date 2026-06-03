# Quickstart: Gameplay Interaction

**Feature**: `003-gameplay-interaction`

This guide describes how to manually verify the feature after implementation.

---

## Prerequisites

- Feature 002 must be working: you can create a room and start a game.
- Both backend and frontend dev servers running:

```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```

---

## Manual Verification Flow

### 1. Set up a 2-player session

1. Open `http://localhost:5173` in **Tab A** (drawer / host).
2. Create a room. Note the 4-character room code.
3. Open `http://localhost:5173` in **Tab B** (guesser).
4. Join the room using the code.
5. In Tab A, start the game.

Both tabs should now show the game screen. Tab A (drawer) sees the secret word. Tab B (guesser) does not.

---

### 2. Verify the canvas

1. In Tab A (drawer): click and drag on the canvas. A freehand stroke should appear immediately.
2. Switch to Tab B (guesser): within ≤2 seconds, the same stroke should appear (read-only).
3. In Tab A: click "Clear". The canvas clears immediately for the drawer.
4. Within ≤2 seconds, Tab B's canvas also becomes blank.
5. Confirm Tab B cannot draw on the canvas — pointer events should have no effect.

---

### 3. Verify guess submission

1. In Tab B (guesser): type a wrong word (e.g., "airplane") and submit.
   - Result should appear immediately as incorrect.
2. In Tab A (drawer): within ≤2 seconds, "airplane" appears in the guess history as incorrect.
3. In Tab B: submit the correct word in a different case (e.g., "ROCKET" if the word is "rocket").
   - Result should appear immediately as **correct**.
4. Tab A's guess history should update within ≤2 seconds to show the correct guess (visually distinguished).

---

### 4. Verify empty guess rejection

1. In Tab B (guesser): clear the input field and click "Submit Guess" (or just press Enter).
   - A validation message should appear immediately: no network request should be made.
2. Type only spaces and submit — same result.

---

### 5. Verify scoring

1. After the correct guess in step 3.3 above, check the scoreboard in both tabs.
2. Tab B's score should be 100. Tab A's score should remain 0.
3. In Tab B: submit the correct word again. Confirm the score does NOT increase beyond 100.

---

### 6. Verify guess form is hidden from the drawer

1. In Tab A (drawer): confirm there is no guess input form visible.
2. Only Tab B (guesser) should see the guess form.

---

## Running Tests

```bash
# Backend unit tests
cd backend && npm test

# Frontend unit tests
cd frontend && npm test
```

All pre-existing tests must still pass after this feature is implemented.

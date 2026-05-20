# Manual Test: Result, Restart & Final Validation (Phase 4)

## Setup
1. Start backend: `cd backend && npm run dev` (port 3001)
2. Start frontend: `cd frontend && npm run dev` (port 5173)
3. Open two browser tabs to `http://localhost:5173`

---

## Test 1: Round Ends When All Guessers Are Correct

1. **Tab A (Host)**: Enter name "Host" → Create Room → Start Game
2. **Tab B (Guesser)**: Enter name "Guesser" → Join Room with the code

**Wait for game to start on both tabs.**

3. **Tab A (Drawer)**: Draw a few strokes on the canvas
4. **Tab B (Guesser)**: Type the correct word into the guess input and submit

**Expected Results:**
- [ ] Tab A shows "Round Over!" with the correct word, final scores, guess history, canvas
- [ ] Tab B shows same result state (no restart button for non-host)
- [ ] Tab B sees "Waiting for host to restart..." message

---

## Test 2: Host Restarts the Game

1. After Test 1 completes (both tabs in result state):

**On Tab A (Host):**
2. Click "Restart Game" button

**Expected Results:**
- [ ] Tab A redirects to lobby page with same player name
- [ ] Tab B (within 2s) redirects to lobby page with same player name
- [ ] No round data visible in lobby (canvas, guesses gone)
- [ ] Player list preserved (both Host and Guesser present)

---

## Test 3: New Game After Restart

1. After Test 2 (both tabs in lobby):

**On Tab A (Host):**
2. Click "Start Game"

**Expected Results:**
- [ ] Both tabs enter a new game round
- [ ] Canvas is blank (fresh round)
- [ ] Scoreboard shows cumulative scores from previous round(s)
- [ ] A new secret word is assigned

---

## Test 4: All-Guessers-Correct Trigger (Multiple Guessers)

1. Open three tabs: Tab A (Host), Tab B (Guesser 1), Tab C (Guesser 2)
2. Start game from Tab A
3. Tab A draws on canvas
4. Both guessers submit correct guesses

**Expected Results:**
- [ ] After second correct guess, all three tabs show result state
- [ ] Both guessers' correct guesses shown in activity panel

---

## Test 5: Timer Expiry (if timerDuration > 0)

1. Verify timer-related code by checking that `timerDuration` (300s default) and `timerStartedAt` are set
2. Timer check is in `checkRoundEnd()` — runs on every poll and every action

**Note**: Default timer is 300 seconds. To test quickly, temporarily set `timerDuration: 10` in `createRoom()` in `backend/src/services/roomStore.ts`.

---

## Test 6: Non-Host Cannot Restart

1. Get to result state (both tabs)
2. Verify Tab B (non-host) has no restart button, only "Waiting for host to restart..."

**Expected Results:**
- [ ] Tab A shows "Restart Game" button
- [ ] Tab B shows "Waiting for host to restart..." message

---

## Regression: Normal Game Flow Unaffected

1. Start a game, play normally without triggering all-guessers-correct
2. Verify drawing, guessing, and activity panel work as before
3. Exit game returns to home page

**Expected Results:**
- [ ] Drawing works (drawer can draw, guessers see canvas update)
- [ ] Guesses submitted and shown in activity panel
- [ ] Incorrect guesses marked without "Correct!" badge
- [ ] Correct guesses marked with "Correct!" badge
- [ ] Exit game navigates to home

---

## Test Results

| Test | Status (Pass/Fail) | Notes |
|------|-------------------|-------|
| 1. All guessers correct → result | | |
| 2. Host restart → lobby | | |
| 3. New game after restart | | |
| 4. Multiple guessers all correct | | |
| 5. Timer expiry (optional) | | |
| 6. Non-host cannot restart | | |
| Regression: Normal flow | | |

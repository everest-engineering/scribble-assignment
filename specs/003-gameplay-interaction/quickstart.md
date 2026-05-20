# Quickstart: Gameplay Interaction

## Prerequisites

- Backend running on `http://localhost:3001` (`cd backend && npm run dev`)
- Frontend running on `http://localhost:5173` (`cd frontend && npm run dev`)
- Room created with 3+ players (Alice as host/drawer, Bob and Charlie as guessers)
- Game started (all players on game screen)

## Test Flow

### 1. Drawer Draws on Canvas

1. **Tab A (Alice — Drawer)**: Draw a few lines on the canvas using mouse/touch.
2. **Expected**:
   - Tab A shows lines appearing immediately as you draw.
   - Tab A has a clear button visible.

### 2. Guesser Sees Drawing

1. **Tab B (Bob — Guesser)**: Wait for the next poll cycle.
2. **Expected**:
   - Tab B shows the same drawing Alice drew.
   - Tab B does NOT show a canvas to draw on.

### 3. Drawer Clears Canvas

1. **Tab A (Alice)**: Click the clear button.
2. **Expected**:
   - Tab A canvas goes blank.
   - Tab B canvas goes blank after next poll.

### 4. Guesser Submits Incorrect Guess

1. **Tab B (Bob)**: Type a wrong word (e.g., "house") in the guess input and submit.
2. **Expected**:
   - Guess appears in Bob's guess history marked as incorrect (no special highlighting).
   - Other players see Bob's guess in their history after polling.
   - Bob's score remains 0.

### 5. Guesser Submits Correct Guess

1. **Tab B (Bob)**: Type the secret word (e.g., "rocket") and submit.
2. **Expected**:
   - Guess appears in history with correct guess highlighting (green / "Correct!" badge).
   - Bob's score increases to 100.
   - Bob's guess input becomes disabled.
   - Bob sees "You guessed correctly!" message.
   - Other players see Bob's highlighted correct guess in their history.

### 6. Already-Correct Guesser Cannot Guess Again

1. **Tab B (Bob)**: Try to type in the guess input.
2. **Expected**:
   - Guess input is disabled/greyed out.
   - Bob cannot submit further guesses.

### 7. Guesser Submits Empty or Too-Long Guess

1. **Tab C (Charlie)**: Submit an empty guess, then a whitespace-only guess, then a 51-character guess.
2. **Expected**:
   - Empty/whitespace: Error notification "Guess cannot be empty". History unchanged.
   - Too long: Error notification "Guess must be 50 characters or fewer". History unchanged.

### 8. Guesser Submits Case-Insensitive Correct Guess

1. **Tab C (Charlie)**: Type the secret word in different case (e.g., "ROCKET", "Rocket").
2. **Expected**:
   - Guess is accepted as correct. Charlie gets 100 points.

### 9. Drawing and Guess History Persist Across Polling

1. After several draws and guesses, refresh Tab B (Bob).
2. **Expected**:
   - Canvas state and guess history are restored from the server.

### 10. Verify Error Conditions

| Test | Action | Expected Error |
|------|--------|----------------|
| Drawer submits guess | Drawer checks UI — no guess input visible | Guess input hidden for drawer role |
| Guesser submits after correct | Correct guesser checks input | Input disabled; server also rejects if bypass attempted |
| Non-existent room draw | POST /rooms/XXXX/draw | 404 "Room not found" |
| Non-existent room guess | POST /rooms/XXXX/guess | 404 "Room not found" |
| Wrong participant draws | Non-drawer POSTs to /draw | 403 "Only the drawer can update the canvas" |

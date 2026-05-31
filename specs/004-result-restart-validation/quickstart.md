# Quickstart: Manual Verification of Result & Restart

This guide outlines manual end-to-end verification steps for the Result, Restart & Final Validation features.

## Setup

1. Start development servers:
   ```bash
   cd backend && npm run dev
   cd frontend && npm run dev
   ```
2. Open two browser windows:
   * **Window A**: `http://localhost:5173` (normal tab)
   * **Window B**: `http://localhost:5173` (incognito tab)
3. In **Window A**, create a room named `Alice`.
4. In **Window B**, join the room named `Bob`.
5. In **Window A**, click **Start Game**.

---

## Verification Scenarios

### 1. End-of-Round & Results Screen (Multiplayer Polling Sync)
1. Bob (Window B) submits the correct guess (e.g., `rocket`).
2. Verify that **both** Window A and Window B immediately transition to the results view within 2 seconds:
   * [ ] **Secret Word Revealed**: Both players see the word clearly displayed (e.g., `"The word was: rocket"`).
   * [ ] **Winner Highlighted**: A banner displays `"Bob guessed the word correctly!"`.
   * [ ] **Scoreboard**: Displays Bob with `100` points and Alice with `0` points, sorted descending.
   * [ ] **Guess History**: Displays the complete list of guesses in chronological order.
   * [ ] **In-Game Inputs Disabled**: Verify that the drawer canvas and the guess input box are no longer active/shown.

### 2. Restart UI Guards
1. On the results screen:
   * [ ] **Window A (Host: Alice)**: Displays a **Restart Game** button.
   * [ ] **Window B (Non-Host: Bob)**: Does NOT display a restart button, instead showing a waiting text (e.g., `"Waiting for host to restart..."`).
2. Alice clicks **Restart Game** in Window A.
3. Verify that **both** Alice and Bob are automatically returned to `/lobby` within 2 seconds:
   * [ ] Both players see the Lobby view with Alice and Bob still in the participant list.
   * [ ] All scores are reset to `0`.
   * [ ] Game status says `"Ready to play"`.

---

## API Security Verification

If testing endpoints directly (e.g., via Postman, curl, or unit tests):

1. **Non-host restart attempt**:
   * Send a `POST /rooms/:code/restart` request using Bob's `participantId`.
   * Verify it returns `403 Forbidden` with the error code `"RESTART_REQUIRES_HOST"`.
2. **Invalid status restart attempt**:
   * During active gameplay (room status is `in-game`), send a `POST /rooms/:code/restart` request using the host's (Alice's) `participantId`.
   * Verify it returns `400 Bad Request` with the error code `"GAME_NOT_IN_RESULT"`.

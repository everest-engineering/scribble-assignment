# Specification: Scenario 4 — Result, Restart & Final Validation

## Story
Given a round has ended,
When the result state is displayed and the host restarts,
Then all players see the correct word, final scores, and full guess history; on restart, everyone returns to the lobby with players preserved and all round state cleared.

---

## Acceptance Criteria

### AC4.1: Round Ends When All Guessers Guess Correctly
- **Given** a game is in `"playing"` state,
- **When** every guesser has submitted a correct guess,
- **Then** the room status transitions to `"finished"`.
- **And** the round is marked as complete.

### AC4.2: Result — All Players See Correct Word
- **Given** the room is in `"finished"` state,
- **When** any player polls `GET /rooms/:code`,
- **Then** the response includes the `secretWord` for all viewers (not just the drawer).
- **And** the ResultPanel displays the word (e.g., "The word was: ROCKET").

### AC4.3: Result — All Players See Final Scores
- **Given** the room is in `"finished"` state,
- **When** any player views the game page,
- **Then** the Scoreboard shows the final scores for all participants.
- **And** scores are frozen (no more guesses accepted).

### AC4.4: Result — All Players See Full Guess History
- **Given** the room is in `"finished"` state,
- **When** any player views the result panel,
- **Then** they see the complete guess history: who guessed what, and whether it was correct.

### AC4.5: Restart — Host Only
- **Given** the room is in `"finished"` state,
- **When** a non-host player clicks "Restart",
- **Then** the action is rejected (button disabled or API returns 403).
- **When** the host clicks "Restart",
- **Then** the room transitions back to `"lobby"` state.

### AC4.6: Restart — Players Preserved
- **Given** a finished room is restarted,
- **When** the host triggers restart,
- **Then** all current participants remain in the room.
- **And** no new participants are added or removed.

### AC4.7: Restart — Round State Cleared
- **Given** a finished room is restarted,
- **When** the restart completes,
- **Then** the following are reset:
  - `status` → `"lobby"`
  - `drawerId` → `null`
  - `secretWord` → `null`
  - `guesses` → `[]`
  - `scores` → all reset to 0
  - `strokes` → `[]` (canvas cleared)

### AC4.8: Post-Restart — Game Can Be Started Again
- **Given** a room has been restarted and is back in `"lobby"`,
- **When** the host clicks "Start Game" again (with ≥2 players),
- **Then** a new round begins with the same rules (drawer = host, deterministic word, etc.).

### AC4.9: No Guess Submission After Round Ends
- **Given** the room is in `"finished"` state,
- **When** a guesser tries to submit a guess,
- **Then** the API returns 400 with message `"Round is over"`.
- **And** the guess input is disabled on the frontend.

---

## Edge Cases

| Edge Case | Expected Behaviour |
|-----------|-------------------|
| Single-player room (only host) | Game cannot start (AC1.7); result scenario unreachable |
| Restart with only 2 players | Both players preserved; can start again |
| Polling during result screen | Scores and history remain stable; no new guesses accepted |
| Host clicks restart while guessers are polling | State transitions atomically; guessers see lobby on next poll |
| Player joins after restart | They appear in the lobby participant list normally |

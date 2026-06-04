# Scenario 2 — Game Start & Drawer Flow

**Given** a game is starting and player names are trimmed (empty/whitespace-only rejected with a message),
**When** the first round begins,
**Then** the host (or first player) becomes the clearly-identified drawer, and the secret word (deterministically selected from the starter list) is visible only to the drawer.

## Acceptance Criteria
1. `POST /rooms/:code/start` transitions room status from `lobby` to `playing`.
2. The host (creator) is assigned as the drawer for the first round.
3. A secret word is deterministically selected from `STARTER_WORDS` (based on room code character sum modulo word list length).
4. The drawer sees the secret word in their UI; guessers see a placeholder.
5. Room snapshot includes `drawerId` and `secretWord` (secretWord is empty string for non-drawers).

## Edge Cases
- Non-host attempting to start receives 403 error.
- Start with fewer than 2 players returns an error.
- Already-playing room cannot be started again.

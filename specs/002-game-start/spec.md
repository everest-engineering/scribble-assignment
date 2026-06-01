# Feature: Game Start & Drawer Flow

## Overview
When the host starts the game, the room transitions from lobby to playing state. The first participant (by join order, which is the host since they created the room) becomes the drawer. A secret word is deterministically selected from the starter word list. The word is revealed only to the drawer; guessers see an obscured placeholder. Player name validation is enforced at both frontend and backend.

## Acceptance Criteria
1. Only the host can initiate the game start. A POST request to `/rooms/:code/start` from a non-host participant ID returns a 403 Forbidden response with an error message.
2. The game can only start when at least 2 players are in the room. A POST to `/rooms/:code/start` with fewer than 2 participants returns a 400 Bad Request with a descriptive message.
3. On successful start, the backend transitions the room status from `"lobby"` to `"playing"`.
4. The drawer is assigned as the first participant in the room's participant array (by join order). Since the host creates the room first, the host is always the first participant and thus the drawer.
5. The secret word is deterministically selected from `STARTER_WORDS` using the formula `STARTER_WORDS[round % STARTER_WORDS.length]`. This ensures the same word is always chosen for a given round number.
6. The secret word is visible to only the drawer. When the room snapshot is fetched via `GET /rooms/:code?participantId=X`, the `secretWord` field contains the actual word for the drawer and `null` (or "???") for all other participants.
7. The backend enforces word visibility in `toRoomSnapshot()`. The frontend must never receive the secret word for a non-drawer participant.
8. The drawer is clearly identified in the UI. The drawer sees a prominent badge or label (e.g., "You are the DRAWER"). Non-drawer players see who the drawer is (e.g., "Drawer: Alice") but not the secret word.
9. Player names are trimmed of leading/trailing whitespace on both create and join. Empty or whitespace-only names are rejected with a 400 status and a clear error message on the backend.

## Edge Cases
- If more rounds are played than words in the list, the word list wraps around using the modulo operation. For example, round 5 produces index `5 % 5 = 0`, selecting the first word again.
- If the host tries to start the game after another player has already started it (status is already `"playing"`), the backend returns a 400 error indicating the game is already in progress.
- A drawer who leaves the room during the game does not automatically reassign the drawer role — this is out of scope for the lab. The game continues with the current drawer assignment.
- The round number starts at 1 for the first game session and increments when a new round begins. This matches the 0-indexed array access: `STARTER_WORDS[(round - 1) % length]`.

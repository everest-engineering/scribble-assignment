# Phase 1 Contract: Rooms API delta (increment 005)

Only the **behavior change** to one existing endpoint. No new endpoints, no shape change.

## POST /rooms/:code/guess  **[existing — behavior changed]**

**Request** (unchanged): `{ "participantId": "uuid-of-guesser", "text": "castle" }`

**Changes:**

1. **Active-only**: if the room is not in the `active` state, the guess is rejected.

   | Status | Condition | Body | FR |
   |--------|-----------|------|----|
   | 409 | `room.status !== "active"` (lobby or already result) | `{ "message": "The round is not active." }` | FR-004 |

   (Existing 404 / 403 drawer / 400 empty / 409 already-guessed still apply.)

2. **Auto-end on correct**: on a correct guess, after the guesser is scored 100, the room transitions to
   `result`. The 200 response therefore returns a snapshot with `status: "result"` and the **word revealed to
   all** (the Group 4 result reveal), plus final scores and full history.

   ```jsonc
   // 200 response to a correct guess:
   { "room": { "status": "result", "word": "castle", "participants": [ { "score": 100, … } ], "guesses": [ … ] } }
   ```
   An **incorrect** guess returns `status: "active"` as before. _(FR-001, FR-002, FR-003)_

> No change to `POST /:code/end` (host End Round fallback) or `POST /:code/restart`. _(FR-005)_

## Contract test checklist (for `/speckit.tasks`)

- [ ] A correct guess sets the guesser's score to 100 **and** `room.status === "result"`.
- [ ] After a correct-guess auto-end, `toRoomSnapshot(room, guesserId).word === secretWord` (revealed to all).
- [ ] An incorrect guess leaves `room.status === "active"`.
- [ ] A guess submitted when `status !== "active"` is rejected (409), and nothing is appended.
- [ ] Host `endRound` still works when no correct guess occurred (fallback); restart still returns to a clean lobby.

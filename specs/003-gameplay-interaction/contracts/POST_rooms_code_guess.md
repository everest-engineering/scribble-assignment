# Contract: `POST /rooms/:code/guess`

**Feature**: 003-gameplay-interaction
**Purpose**: Submit a guess against the room's current round, get a verdict,
and have it accounted for in the round's history and the submitter's score.
**Maps to**: US1, FR-001 → FR-005, FR-007, FR-008, FR-014, FR-015, FR-016.

## Request

- **Method**: `POST`
- **Path**: `/rooms/:code/guess`
- **Headers**: `Content-Type: application/json`
- **URL parameter**:
  - `code` (string, required): the room code. Same normalization rules as
    every other `/rooms/:code/*` endpoint — trim, upper-case, reject empty
    after trim.
- **Body** (JSON):
  ```json
  { "participantId": "f1a3b2c0-5678-4d3a-8e92-aa11bb22cc33", "text": "rocket" }
  ```
  - `participantId` (string, required, non-empty): the caller's stored
    participant id (issued by `POST /rooms` or `POST /:code/join`).
  - `text` (string, required): the guess. The schema trims surrounding
    whitespace and rejects empty / whitespace-only inputs with the
    message `"Enter a guess"`.

## Success: `200 OK`

```json
{
  "room": {
    "code": "ABCD",
    "status": "playing",
    "hostParticipantId": "host-id",
    "participants": [
      { "id": "host-id", "name": "Alice", "joinedAt": "…", "score": 0 },
      { "id": "guest-id", "name": "Bob", "joinedAt": "…", "score": 100 }
    ],
    "currentRound": {
      "drawerParticipantId": "host-id",
      "secretWord": null
    },
    "guesses": [
      {
        "id": "guess-uuid-1",
        "guesserParticipantId": "guest-id",
        "text": "rocket",
        "isCorrect": true,
        "submittedAt": "2026-06-02T21:50:01.123Z",
        "order": 0
      }
    ],
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"]
  }
}
```

**Invariants on the response**:
- `room.status === "playing"`.
- `room.guesses` is non-empty (includes at least the just-submitted entry).
- The just-submitted entry's `order === room.guesses.length - 1`.
- `room.guesses[last].guesserParticipantId === <request.participantId>`.
- `room.guesses[last].text === <request.text after trim>` (the SUBMITTER
  always sees their own text, regardless of correctness).
- `room.guesses[last].isCorrect === (text.toLowerCase() === secretWord.toLowerCase())`.
- The submitter's `Participant.score` reflects the cap rule:
  - If this is the submitter's first correct guess in the round AND the
    guess is correct: `score === 100`.
  - Otherwise: `score` is unchanged from before this submission.
- `room.currentRound.secretWord` follows Scenario 2's filter
  (`null` because guessers are NOT the drawer).
- All other entries in `room.guesses` follow FR-016 redaction from the
  submitter's perspective: the submitter sees their own real text; other
  guessers' correct entries are redacted (`text: null`) unless the
  submitter is the drawer (which they aren't, by the 403 check).

## Errors

| Status | Body | When |
|---|---|---|
| `400` | `{"message": "Enter a room code"}` | `code` empty after trim |
| `400` | `{"message": "Enter a guess"}` | `text` empty after trim |
| `400` | `{"message": "Invalid request payload"}` | Body fails Zod for any other reason (missing `participantId`, wrong types) |
| `403` | `{"message": "Only guessers can submit guesses"}` | `participantId === room.currentRound.drawerParticipantId` |
| `404` | `{"message": "Room not found"}` | Code does not match any room |
| `409` | `{"message": "Round has not started"}` | Room exists but `status !== "playing"` |
| `500` | `{"message": "Unexpected server error"}` | Anything else |

## Error precedence

The server resolves checks in this order so the most actionable error
surfaces first:

1. `roomCodeParamsSchema` (400 for empty code).
2. `submitGuessSchema` (400 for empty / malformed body).
3. Room lookup (404 for unknown code).
4. Room status (409 if `status !== "playing"`).
5. Drawer guard (403 if the submitter is the drawer).
6. Service success (200).

## Client behavior on success

1. Update local `RoomStore` state with the returned snapshot (so the
   submitter's tab reflects their score immediately).
2. Reset the guess form's local input to empty.
3. Render any score change in the Scoreboard panel via the snapshot.

## Client behavior on error

1. Render `error.message` from the response body in the GuessForm's error
   region (`form__error`).
2. Do NOT clear the input field on error so the submitter can edit/retry.
3. Do NOT update the local snapshot from the error response.

## Test surface

- Backend (`roomStore.test.ts`):
  - `submitGuess(code, hostId, "rocket")` while host is the drawer returns
    `{error: "is-drawer"}`.
  - `submitGuess(code, guestId, "")` is rejected at the schema layer, not
    the service.
  - `submitGuess(code, guestId, "rocket")` against a lobby-state room
    returns `{error: "not-playing"}`.
  - `submitGuess(code, "unknown-id", "rocket")` against a playing room
    where the id isn't a participant — defined behavior to be decided
    (currently the service does not enforce; the route's drawer check
    would still fire if the id happens to equal the drawer's. For
    correctness, the drawer check is sufficient because random ids do not
    match any participant and proceed to the success path.)
  - `submitGuess(code, guestId, "  RoCkEt  ")` returns `isCorrect: true`,
    records `text: "RoCkEt"`, bumps `guest.score` to 100.
  - A second `submitGuess(code, guestId, "rocket")` returns `isCorrect:
    true` again, records the entry, but `guest.score` STAYS at 100.
  - An incorrect `submitGuess(code, guestId, "pizza")` records `isCorrect:
    false`; score unchanged.
- Backend (`schemas.test.ts`):
  - `submitGuessSchema` accepts `{participantId: "x", text: "rocket"}`.
  - `submitGuessSchema` rejects `{participantId: "x", text: ""}` with
    `"Enter a guess"`.
  - `submitGuessSchema` rejects `{participantId: "x", text: "   "}` with
    `"Enter a guess"`.
  - `submitGuessSchema` rejects `{text: "rocket"}` (missing participantId).
- Frontend (`api.test.ts`):
  - `api.submitGuess("ABCD", "x", "rocket")` POSTs to `/rooms/ABCD/guess`
    with `{participantId: "x", text: "rocket"}` and the correct base URL.
  - Surfaces server `message` verbatim on non-ok responses.

# Data Model: Guess Submission, Scoring, and History Sync

**Branch**: `004-guess-scoring-sync` | **Date**: 2026-05-30

## New Entity: Guess

Represents a single guess attempt submitted by a guesser during an active round.

| Field         | Type      | Constraints                              | Notes                                    |
|---------------|-----------|------------------------------------------|------------------------------------------|
| `id`          | `string`  | UUID, generated on server                | Unique per guess                         |
| `guesserId`   | `string`  | UUID, must be a participant in the room  | ID of the guesser who submitted          |
| `text`        | `string`  | Non-empty after trim, stored trimmed     | Exact text submitted (post-trim)         |
| `isCorrect`   | `boolean` | Computed at submission time              | `true` if `text.toLowerCase() === word.toLowerCase()` |
| `submittedAt` | `string`  | ISO 8601 timestamp                       | Server-assigned at creation time         |

## Derived Concept: Score

Scores are not stored — they are computed when building the `RoomSnapshot`.

**Computation**: For each participant, `score = guesses.filter(g => g.guesserId === participant.id && g.isCorrect).length * 100`

Exposed in `RoomSnapshot` as a `Score[]` array for convenience.

| Field           | Type     | Notes                                       |
|-----------------|----------|---------------------------------------------|
| `participantId` | `string` | Links to a `Participant.id`                 |
| `score`         | `number` | Always a non-negative multiple of 100       |

## Modified Entity: Room (backend)

The existing `Room` type gains one new field.

| New Field  | Type      | Notes                                      |
|------------|-----------|--------------------------------------------|
| `guesses`  | `Guess[]` | All guesses for the current round, in order of submission. Empty array at game start. |

## Modified Entity: RoomSnapshot (frontend + backend shared contract)

Two new fields are added to the snapshot returned by `GET /rooms/:code` and `POST /rooms/:code/guesses`.

| New Field  | Type      | Notes                                        |
|------------|-----------|----------------------------------------------|
| `guesses`  | `Guess[]` | Ordered list of all guesses submitted so far |
| `scores`   | `Score[]` | One entry per participant; score = 0 if no correct guesses |

## State Transitions

```
Game Start
  └─► room.guesses = []
      All participant scores = 0

Guesser submits guess (text = "rocket")
  └─► Server trims text
  └─► text.toLowerCase() === availableWords[0].toLowerCase() → isCorrect = true/false
  └─► Guess appended to room.guesses
  └─► RoomSnapshot recomputed (scores updated)

Client polls GET /rooms/:code every ~2 seconds
  └─► Receives updated RoomSnapshot with latest guesses and scores
```

## Validation Rules

| Field     | Rule                                                  | Error Response               |
|-----------|-------------------------------------------------------|------------------------------|
| `text`    | Non-empty after trim (server); non-empty check client-side first | 400 "Guess text is required" |
| `guesserId` | Non-empty string UUID                               | 400 "Invalid request payload"|
| Canvas    | N/A — canvas data is never sent to the server         | —                            |

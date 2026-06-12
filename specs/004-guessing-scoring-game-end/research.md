# Research: Guessing, Scoring & Game End

## Decisions

### 1. Guess Deduplication & First-Correct-Wins

- **Decision**: The server checks `room.status` when a guess arrives. If status is `"finished"`, reject the guess with an error. If `"playing"`, process it. A correct guess transitions status to `"finished"` immediately.
- **Rationale**: This naturally enforces first-correct-wins — the first correct guess flips the status, subsequent guesses (correct or not) are rejected. No need for complex locking or timestamps.
- **Alternatives considered**: Timestamp ordering (more complex, same result), queue-based processing (over-engineered for in-memory).

### 2. Single Polling Endpoint for All State

- **Decision**: Extend `GET /rooms/:code` response to include `guesses`, `scores`, and `roundResult` fields. The frontend polls this single endpoint and derives UI state from `room.status`.
- **Rationale**: Simplifies the frontend — one poll interval, one response shape. Already implemented pattern from the canvas feature.
- **Alternatives considered**: Separate guess history endpoint (more polling calls), push-based (violates constitution).

### 3. State Transition Detection (Playing → Finished)

- **Decision**: The frontend watches `room.status` on each poll response. On transition to `"finished"`, it renders the result screen. The polling interval continues during the result screen to catch any updates.
- **Rationale**: No special event needed — the status field acts as the signal. Consistent with how lobby → playing transition works.
- **Alternatives considered**: Separate "round ended" endpoint (redundant), client-side timer (unreliable with polling latency).

### 4. Score Calculation Timing

- **Decision**: Scores are calculated and stored immediately when a correct guess is received. The backend maintains a `Record<participantId, number>` on the Room model. The scoring is: correct = 100 points, incorrect = 0. Only the first correct guesser scores.
- **Rationale**: Immediate storage ensures consistency across all pollers. No race conditions since status flips atomically with score assignment.
- **Alternatives considered**: Calculate on read (redundant computation), defer to round end (unnecessary complexity).

### 5. Restart Mechanics

- **Decision**: The host calls `POST /rooms/:code/restart`. The server validates host status, then: status → `"lobby"`, word → undefined, guesses → [], scores → {}, canvasState → null, roundResult → null. Participants are preserved. All players discover the lobby state on next poll.
- **Rationale**: Host-only restart keeps control consistent with lobby management spec. Clearing all round state in one atomic operation prevents partial-state bugs.
- **Alternatives considered**: Vote-based restart (over-engineered for v1), automatic restart (removes host control).

### 6. Guess Validation Strategy

- **Decision**: Trim whitespace, reject if empty or > 100 chars. Compare to secret word case-insensitively. Duplicate guesses from the same player are allowed (they might guess the same wrong word), but only the first correct guess counts (enforced by status check).
- **Rationale**: Matches spec requirements and common drawing game conventions.
- **Alternatives considered**: Reject exact duplicates (unnecessary restriction), case-sensitive matching (poor UX).

### 7. Result Screen Data Availability

- **Decision**: The `RoundResult` object is populated at the moment the correct guess is processed: stores the secret word, the full guess history, final scores, and the winner's participant ID. It is returned as part of the room snapshot while status is `"finished"`.
- **Rationale**: Atomic capture of round-ending state ensures all players see identical results regardless of polling timing.
- **Alternatives considered**: Derive result from guesses/scores on read (susceptible to timing variations).

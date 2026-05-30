# Research: Result, Restart & Final Validation

**Feature**: 004-result-restart-validation | **Date**: 2026-05-30

## 1. Room status model for result state

**Decision**: Add `"result"` as a third `RoomStatus` value: `"lobby" | "playing" | "result"`.

**Rationale**: A distinct status makes guards explicit (`submitGuess` requires `playing`), enables
poll-driven UI mode switching on `GamePage`, and matches the spec's "result state" language.
Lobby redirect logic stays simple: only `lobby` redirects away from `/game`.

**Alternatives considered**:

| Alternative | Rejected because |
|-------------|------------------|
| Boolean `roundEnded` flag on `playing` | Ambiguous guards; harder to test transitions |
| Separate result route with its own status | Violates clarification Q3 (in-place transition, no route change) |
| Auto-end on first correct guess | Violates spec assumption (host manual end) |

## 2. Snapshot behavior in result state

**Decision**: When `status === "result"`, `toRoomSnapshot` includes `secretWord` for **all**
viewers, `guesses`, and participant scores; **omits** `strokes`.

**Rationale**: FR-004 requires word visible to everyone; FR-004a requires canvas hidden — omitting
strokes reduces payload and prevents accidental canvas render. Final scores and history remain
available for Scoreboard and ResultPanel.

**Alternatives considered**:

| Alternative | Rejected because |
|-------------|------------------|
| Include strokes but hide in UI only | Extra payload; risk of accidental render |
| Clear guesses/scores on end-round | Violates FR-005/FR-006 (final scores and history on result) |
| Keep drawer-only word filter in result | Violates FR-004 and clarification |

## 3. End-round and restart API shape

**Decision**: Two new POST endpoints mirroring existing host-action pattern:

- `POST /rooms/:code/end` — body `{ participantId }`
- `POST /rooms/:code/restart` — body `{ participantId }`

**Rationale**: Consistent with `POST /rooms/:code/start`; Zod reuse via existing
`startRoomSchema`-style `{ participantId }` validation; returns `{ room: RoomSnapshot }`.

**Alternatives considered**:

| Alternative | Rejected because |
|-------------|------------------|
| PATCH on room with `{ status }` | Exposes status mutation to clients; weaker host guard pattern |
| Single `POST /rooms/:code/transition` | Over-abstracted for two fixed transitions |
| GET trigger for end/restart | Non-idempotent side effects must not use GET |

## 4. Guess race at end-round boundary

**Decision**: Rely on synchronous single-threaded request processing; `submitGuess` accepts only
when `status === "playing"`. Whichever request is processed first wins.

**Rationale**: Matches clarification Q1 without distributed locking. Node.js handles one request
at a time per process; sufficient for lab scope.

**Alternatives considered**:

| Alternative | Rejected because |
|-------------|------------------|
| Grace period accepting guesses after end | Violates FR-003 (no guesses in result state) |
| Queue end-round until in-flight guesses complete | Over-engineered for in-memory lab |
| Reject all in-flight guesses on end | Violates clarification Q1 |

## 5. Restart field clearing

**Decision**: On restart, reset: `status → lobby`, `drawerParticipantId → null`, `secretWord → null`,
`strokes → []`, `guesses → []`, `scoredParticipantIds → []`, all `participant.score → 0`.
Preserve: `code`, `hostParticipantId`, `participants[]` (ids, names, joinedAt).

**Rationale**: FR-010 explicit list; matches constitution "clean restart preserving players".

**Alternatives considered**:

| Alternative | Rejected because |
|-------------|------------------|
| Delete and recreate room | Loses participant ids; breaks client session |
| Restart directly into new playing round | Violates spec assumption (return to lobby first) |
| Keep scores visible in lobby | Violates FR-010 and SC-004 |

## 6. Frontend result mode on GamePage

**Decision**: Single `/game` route; conditional render when `room.status === "result"`:
hide `DrawingCanvas`, `GuessForm`, drawer clear button; show secret word card to all participants;
show host Restart button; continue polling.

**Rationale**: Implements clarification Q3; reuses existing layout components (Scoreboard,
ResultPanel) for result content.

**Alternatives considered**:

| Alternative | Rejected because |
|-------------|------------------|
| New `/result` route | Violates clarification Q3 |
| Modal overlay on canvas | Clarification chose in-place mode switch, not overlay |
| Navigate to lobby for result | Wrong UX; spec requires result on game screen |

## 7. Participant roles during result

**Decision**: `participantRole` returns `drawer`/`guesser` when `status === "result"` (same as
playing) until restart clears `drawerParticipantId`.

**Rationale**: Scoreboard/history already show names; optional context for "who drew" without
extra UI. Roles become `null` after restart when status returns to `lobby`.

**Alternatives considered**:

| Alternative | Rejected because |
|-------------|------------------|
| Clear roles on end-round | Loses drawer context on result screen |
| New `spectator` role | Out of scope |

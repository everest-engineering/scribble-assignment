# Research: Scribble Game Completion

## Decision: Extend The Existing In-Memory Store

**Rationale**: The starter already centralizes room creation, joining, fetching,
and snapshot conversion in `backend/src/services/roomStore.ts`. Extending this
boundary keeps state changes testable and avoids rewriting the starter.

**Alternatives considered**:

- New game service: cleaner separation, but unnecessary for a focused
  assignment and would duplicate room-state ownership.
- Database-backed state: prohibited by the assignment.

## Decision: Use Viewer-Specific Snapshots

**Rationale**: Secret word visibility depends on who is viewing the room. A
single `toRoomSnapshot(room, viewerParticipantId)` function can hide the word
for guessers and expose it to the drawer while preserving one frontend fetch
path.

**Alternatives considered**:

- Separate drawer and guesser endpoints: more API surface and harder polling.
- Client-side hiding: unsafe because guessers would still receive the word.

## Decision: Poll The Active Room Snapshot Every About 2 Seconds

**Rationale**: The assignment explicitly requires polling and forbids
WebSockets. The current frontend store already has `fetchRoom`; adding a
polling effect to lobby and game pages uses existing patterns.

**Alternatives considered**:

- WebSockets or server-sent events: out of scope.
- Manual refresh only: fails the assignment requirement.

## Decision: Deterministic Word Selection Uses First Starter Word

**Rationale**: The spec needs deterministic selection. The starter list is
ordered, and using the first word, `rocket`, is simple, repeatable, and easy to
validate.

**Alternatives considered**:

- Random selection: not deterministic.
- Hash room code into word list: deterministic, but adds complexity without
  assessment value.

## Decision: Drawing State Is Serializable Stroke Data

**Rationale**: Stroke or point data can be stored in memory, transferred as
JSON, cleared easily, and rendered in both drawer and guesser views. It avoids
image upload and persistence concerns.

**Alternatives considered**:

- Image data URLs: larger payloads and more awkward testing.
- Placeholder text drawing: too weak for the interactive drawing requirement.

## Decision: Correct Guess Ends The Round

**Rationale**: The assignment requires result state after a round ends but does
not require timers. Ending the round on the first correct guess gives a clear
deterministic transition into result state.

**Alternatives considered**:

- Host manually ends round: under-specified and less connected to guess
  scoring.
- Timer-driven end: explicitly out of scope.


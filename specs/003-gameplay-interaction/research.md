# Research: Gameplay Interaction

**Branch**: `assignment` | **Date**: 2026-05-31

## Findings

### Decision: `guesses` and `scores` stored directly on `Room`

- **Decision**: Add `guesses: Guess[]` and `scores: Record<string, number>` to the `Room`
  interface. Guesses are an append-only array. Scores are a map of `participantId → number`.
- **Rationale**: Consistent with the existing in-memory `Room` pattern (single source of
  truth in the `rooms` Map). No separate store or join needed. The snapshot already derives
  its shape from `Room` in `toRoomSnapshot()` — adding these two fields follows the exact
  same pattern used for `drawerId` and `secretWord` in Scenario 2.
- **Alternatives considered**: Separate `Map<string, Guess[]>` keyed by room code — rejected;
  adds complexity with no benefit for a single in-memory store.

### Decision: Scores initialised in `startRoom()` for all current participants

- **Decision**: When `startRoom()` is called, set `scores = Object.fromEntries(room.participants.map(p => [p.id, 0]))` and `guesses = []`.
- **Rationale**: Participants are locked in at game start (joining mid-game is not supported).
  Initialising at start ensures every participant has a score entry from the first poll.
- **Alternatives considered**: Initialising scores in `createRoom()` — rejected; participants
  join after room creation so scores would be incomplete.

### Decision: New `POST /rooms/:code/guesses` endpoint

- **Decision**: Add a new route `POST /rooms/:code/guesses` that accepts
  `{ participantId, text }`, validates and scores the guess, appends it to the room, and
  returns the updated `RoomSnapshot`.
- **Rationale**: Clean REST resource for a guess submission. Follows the same pattern as
  `POST /rooms/:code/start`. Returning the full snapshot allows the frontend to update all
  state (guesses + scores) in one response without an extra poll.
- **Alternatives considered**: Piggybacking guess submission on `POST /rooms/:code/start`
  or `GET /rooms/:code` — rejected; incorrect HTTP semantics.

### Decision: Game screen polling with `setInterval` in `GamePage`

- **Decision**: Add a `useEffect` in `GamePage.tsx` that starts a 2-second `setInterval`
  calling `roomStore.fetchRoom()`, with `clearInterval` in the cleanup function.
- **Rationale**: Identical pattern to `LobbyPage.tsx` polling. Reuses existing
  `roomStore.fetchRoom()` which already passes `participantId` for conditional `secretWord`.
- **Alternatives considered**: Shared polling at the store level — rejected; over-engineering
  for a single-screen use case. Each page owns its own interval lifecycle.

### Decision: Canvas is native HTML `<canvas>` in `GamePage`, drawer-only

- **Decision**: Replace the `canvas-placeholder` `<div>` in `GamePage.tsx` with a `<canvas>`
  element rendered only when `isDrawer`. Guessers keep the placeholder. Drawing uses
  `mousedown`, `mousemove`, `mouseup` events on the canvas element via a React `useRef`.
  Clear button calls `ctx.clearRect(0, 0, canvas.width, canvas.height)`.
- **Rationale**: Native Canvas API — no new dependencies. Already in every browser.
  Ref-based imperative drawing is the standard approach for canvas in React.
- **Alternatives considered**: SVG path drawing — rejected; more complex, no benefit here.
  A third-party drawing library — rejected; unjustified new dependency per constitution V.

### Decision: `GuessForm` calls `useRoomStore()` directly

- **Decision**: `GuessForm` will use `useRoomStore()` and `useRoomState()` internally to
  call `submitGuess()` and read `participantId` and `isDrawer`. No prop drilling from GamePage.
- **Rationale**: Consistent with the pattern in `LobbyPage` which calls `useRoomStore()`
  directly. Keeps `GamePage` from growing as an orchestrator. The `disabled` prop already
  exists on `GuessForm` for drawer suppression.
- **Alternatives considered**: Pass `onSubmit` callback prop from `GamePage` — feasible but
  requires more boilerplate. Rejected in favour of the existing store access pattern.

### Decision: `Scoreboard` and `ResultPanel` call `useRoomState()` directly

- **Decision**: Both components use `useRoomState()` to read `room.scores` and
  `room.guesses` from the shared store. No props needed.
- **Rationale**: Same reasoning as GuessForm. Components are already used in `GamePage`
  without props. Adding props would require changing `GamePage` as well. Simpler to have
  each component own its own data access.
- **Alternatives considered**: Pass `scores` and `guesses` as props — cleaner in isolation
  but requires more changes. Rejected for simplicity.

### Decision: `participantName` embedded in `Guess`

- **Decision**: The `Guess` entity stores `participantName: string` at submission time.
- **Rationale**: Avoids the frontend having to join `guesses` against `participants` array
  on every render. Name is stable for the duration of a room's lifetime. Consistent with
  how `Participant.name` is stored directly on the entity.
- **Alternatives considered**: Store only `participantId` and join on render — rejected;
  adds derived-state complexity to every component that renders guess history.

## Existing Code Reused Without Change

- `roomStore.fetchRoom()` — already passes `participantId` for viewer-aware snapshots
- `toRoomSnapshot()` — extended (not replaced) to include `guesses` and `scores`
- `startRoom()` — extended to initialise `guesses: []` and `scores`
- `GamePage.tsx` canvas placeholder `<div>` — replaced with conditional `<canvas>` for drawer
- `GuessForm`, `Scoreboard`, `ResultPanel` — stubs activated, not replaced

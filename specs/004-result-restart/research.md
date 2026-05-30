# Research: Result, Restart & Final Validation

**Branch**: `assignment` | **Date**: 2026-05-31

## Findings

### Decision: Round ends automatically in `submitGuess()` on first correct guess

- **Decision**: Extend `submitGuess()` in `roomStore.ts` to set `status: "result"` when
  `isCorrect === true`. The transition is atomic — the guess is recorded and the status
  changes in the same `saveRoom()` call.
- **Rationale**: Single write, no new endpoint or separate transition step. Consistent
  with how `startRoom()` atomically sets `drawerId`, `secretWord`, and `status: "game"`.
  Deterministic — exactly one event triggers round end.
- **Alternatives considered**: Separate `POST /rooms/:code/end` endpoint — rejected;
  unnecessary extra round-trip. Host-triggered end — rejected; spec says automatic on
  correct guess.

### Decision: `secretWord` revealed to all players in `"result"` state

- **Decision**: Extend the `toRoomSnapshot()` condition from `isDrawer` to
  `isDrawer || room.status === "result"`. When the room is in result state the word
  is public knowledge — the reveal is the whole point of the result screen.
- **Rationale**: One-line change to the existing conditional spread. No new fields needed.
  Consistent with the existing pattern — the condition already lives in one place.
- **Alternatives considered**: Always return `secretWord` after game starts — rejected;
  guessers would see the word during the active round, breaking the core mechanic.

### Decision: New `POST /rooms/:code/restart` endpoint

- **Decision**: Add `restartRoom(code, participantId)` to `roomStore.ts` and a matching
  route. It resets `status → "lobby"`, `drawerId → null`, `secretWord → null`,
  `guesses → []`, `scores → {}` and preserves participants and `hostId`.
- **Rationale**: Follows the same pattern as `startRoom()` — validates the caller is the
  host, then calls `saveRoom()` with a spread override. Clean and minimal.
- **Alternatives considered**: Reusing `POST /rooms` to create a new room — rejected;
  players would lose their participant IDs and existing tabs would break.

### Decision: New `ResultPage.tsx` at `/result` route

- **Decision**: Add a `ResultPage.tsx` page and register it at `/result` in
  `routes/index.tsx`. The page reuses the already-wired `Scoreboard` and `ResultPanel`
  components (which already read from `useRoomState()`), adds a prominent `secretWord`
  display, host-only Restart button, and 2s polling.
- **Rationale**: Cleanest separation of concerns. `/game` stays unchanged (no bloat from
  result-state conditionals). The result screen is a distinct moment in the game lifecycle
  and deserves its own route, consistent with the existing `/lobby` → `/game` pattern.
- **Alternatives considered**: Show result as an overlay on `/game` — rejected; adds
  conditional complexity to `GamePage` and requires status-gating most of its content.

### Decision: `GamePage` navigates to `/result` when `status === "result"`

- **Decision**: Add a `useEffect` to `GamePage.tsx` that watches `room?.status` and calls
  `navigate("/result")` when it detects `"result"`. Mirrors the existing LobbyPage effect
  that navigates to `/game` when status becomes `"game"`.
- **Rationale**: Consistent pattern across all three page transitions. The polling interval
  in `GamePage` is already running — no extra mechanism needed. The navigation fires on
  the same render cycle that the polling update lands.
- **Alternatives considered**: Navigate from `submitGuess` callback in `GuessForm` — rejected;
  only the guesser who submitted would navigate. All other clients need the polling path.

### Decision: `ResultPage` polling detects `"lobby"` status and navigates to `/lobby`

- **Decision**: `ResultPage` runs a 2s `setInterval` calling `roomStore.fetchRoom()`.
  A `useEffect` watching `room?.status` navigates to `/lobby` when status becomes `"lobby"`.
  Exactly mirrors how `LobbyPage` navigates to `/game` when status becomes `"game"`.
- **Rationale**: Symmetric with every other status-driven navigation in the app. No new
  mechanism needed — just extends the existing polling + status-watch pattern.

### Decision: `RoomStatus` extended to `"lobby" | "game" | "result"`

- **Decision**: Add `"result"` to the `RoomStatus` union in `backend/src/models/game.ts`
  and update `frontend/src/services/api.ts` `RoomSnapshot.status` to match.
- **Rationale**: Minimal change — one string added to a union type. Downstream TypeScript
  exhaustiveness checks will surface any missed status handling at compile time. The
  frontend `status` field is used only for navigation decisions and conditional renders.

## Existing Code Reused Without Change

- `Scoreboard` and `ResultPanel` — already wired to `useRoomState()`; render correctly
  on the result screen with zero modifications
- `roomStore.fetchRoom()` — already passes `participantId` for viewer-aware snapshots;
  reused as-is for result page polling
- `toRoomSnapshot()` — extended by one condition, not replaced
- `submitGuess()` — extended by one spread field, not replaced
- `GamePage` polling interval — unchanged; result navigation piggybacked on the same
  status-watch `useEffect` pattern already present in `LobbyPage`

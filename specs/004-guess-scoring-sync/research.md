# Research: Guess Submission, Scoring, and History Sync

**Branch**: `004-guess-scoring-sync` | **Date**: 2026-05-30

## Decision Log

### D-001: Canvas Implementation Approach

- **Decision**: Use the browser's native HTML5 Canvas API with mouse event listeners (`mousedown`, `mousemove`, `mouseup`, `mouseleave`). Clear via `ctx.clearRect(0, 0, canvas.width, canvas.height)`.
- **Rationale**: No third-party library needed. The native API is sufficient for freehand drawing. Adding a library would violate constitution Principle V (no unjustified top-level dependencies).
- **Alternatives considered**:
  - `fabric.js` / `konva` — feature-rich but heavyweight; out of scope.
  - SVG-based drawing — more DOM overhead with no benefit for this use case.

### D-002: Canvas Sync Scope

- **Decision**: Canvas data is **not synced** to guessers. The canvas is local to the drawer's browser tab only.
- **Rationale**: Syncing canvas frames via 2-second polling would produce a deeply laggy and unusable experience. WebSockets are prohibited by the constitution. The spec explicitly states only "the drawing is visible on the drawer's screen" — guessers are not mentioned for canvas visibility.
- **Alternatives considered**:
  - Base64 PNG snapshot in `RoomSnapshot` — adds ~50–100 KB per poll; 2-second delay makes drawing lag 2 seconds behind. Rejected.
  - Drawing command list (line segments) — reduces payload but still lags 2 seconds. Rejected.

### D-003: Guess Storage and Score Computation

- **Decision**: Add a `guesses: Guess[]` array to the `Room` model (in-memory). Scores are **computed** from guesses when building `RoomSnapshot` — no separate score field on `Participant` or elsewhere.
- **Rationale**: Derived data stays consistent by construction. Adding a `score` field risks divergence from the guess list. Score computation is O(n) over guesses, which is trivially fast for a single-room game.
- **Alternatives considered**:
  - `score` on `Participant` — requires updating two places on each guess; can diverge.
  - Separate scores map in `roomStore` — another data structure to keep in sync.

### D-004: API Surface for Guesses

- **Decision**:
  - New endpoint: `POST /rooms/:code/guesses` — submit a guess. Body: `{ guesserId, text }`. Returns the saved `Guess` plus the updated score for the guesser.
  - Extend existing: `GET /rooms/:code` — `RoomSnapshot` gains `guesses: Guess[]` and `scores: Score[]`. No new read endpoint.
- **Rationale**: Clients already poll `GET /rooms/:code` every 2 seconds. Extending `RoomSnapshot` is the least-invasive change. A separate `GET /rooms/:code/guesses` would be redundant.
- **Alternatives considered**:
  - Separate `GET /rooms/:code/guesses` endpoint — unnecessary duplication of the polling call.
  - Return full room snapshot on `POST /guesses` — useful for immediate score update; included as a convenience field alongside the new guess.

### D-005: Polling Mechanism

- **Decision**: Add a `useEffect` in `GamePage.tsx` with `setInterval(2000)` that calls `store.fetchRoom()`. Clean up on unmount.
- **Rationale**: `store.fetchRoom()` already exists and updates the store. The component re-renders reactively via `useSyncExternalStore`. This is a one-line addition per the existing pattern.
- **Alternatives considered**:
  - Lobby already polls via a similar pattern — confirmed as the established project pattern from feature 002.
  - `setInterval` in `RoomStore` class — would poll even when game screen is not mounted; incorrect.

### D-006: Guess Validation Strategy

- **Decision**: Two-layer validation:
  1. **Client**: Trim + check non-empty before any fetch call; show inline error "Please enter a guess." if empty. Clear form on successful submission.
  2. **Server**: Zod schema trims and requires `min(1)` on `text`; validates `guesserId` as a non-empty string.
- **Rationale**: Belt-and-suspenders. Client validation avoids unnecessary network round trips. Server validation prevents invalid data from reaching the store regardless of client.
- **Alternatives considered**:
  - Server-only validation — valid but wastes a round trip for empty submissions.

### D-007: Files Changed

**Backend** (4 files, all existing):
- `backend/src/models/game.ts` — add `Guess` interface; add `guesses` to `Room`; add `guesses` + `scores` to `RoomSnapshot`
- `backend/src/services/roomStore.ts` — add `submitGuess()`; update `toRoomSnapshot()`
- `backend/src/api/schemas.ts` — add `submitGuessSchema`
- `backend/src/api/rooms.ts` — add `POST /:code/guesses` handler

**Frontend** (5 files, all existing):
- `frontend/src/services/api.ts` — add `Guess`, `Score` types; update `RoomSnapshot`; add `submitGuess()` method
- `frontend/src/state/roomStore.ts` — add `submitGuess()` method to `RoomStore`
- `frontend/src/pages/GamePage.tsx` — add polling `useEffect`; replace canvas placeholder with `<DrawingCanvas />`
- `frontend/src/components/GuessForm.tsx` — wire submit to store; add validation; clear on success
- `frontend/src/components/Scoreboard.tsx` — render actual scores from room state
- `frontend/src/components/ResultPanel.tsx` — render guess history from room state

**New files created** (1 component):
- `frontend/src/components/DrawingCanvas.tsx` — self-contained canvas component for the drawer

Total: 9 modified files, 1 new file. Zero new npm dependencies.

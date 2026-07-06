# Discovery — Scribble Multiplayer Drawing Game

**Date**: 2026-07-06
**Scope**: All 8 features implemented on top of the starter scaffold

## Architecture Discoveries

### Data Model Design

- **Host tracking**: Both `hostId: string` on Room (efficient lookups) and `isHost: boolean` on Participant (simple UI rendering) are needed. A single-field approach would force O(n) scans or complex ID matching.
- **Room status as finite state machine**: The `RoomStatus` type evolved from `"lobby"` → `"lobby" | "drawing"` → `"lobby" | "drawing" | "result"`. Each transition is triggered by an explicit user action. This made validation straightforward — each endpoint checks the current status before allowing mutations.
- **No new entities needed for result state**: The result view (`"result"` status) reuses existing Room fields (`secretWord`, `scores`, `guesses`). Creating a separate `GameResult` type would duplicate data and add sync complexity.

### Backend Patterns

- **Service return convention**: All game operations return `{ ok: true, room } | { ok: false, error: HttpError }` discriminated unions. This avoids exceptions for expected failure cases (invalid state, wrong user) while keeping HTTP error codes explicit.
- **Room cloning**: `structuredClone()` on every read/write prevents accidental mutation of the in-memory room state. This was established early and followed consistently.
- **Route pattern**: POST endpoints with `participantId` as query parameter (or body for guess) and Zod validation. Consistent error handling via `HttpError` class + Express `next(error)`.

### Frontend Patterns

- **Custom store class**: State managed via `RoomStore` class with `useSyncExternalStore` instead of Context + useState. Enables polling to update state from outside React's component tree.
- **Component reusability**: `Scoreboard`, `ResultPanel`, `Card` were built as generic components reused across lobby, game, and result views.

## Critical Bugs Discovered During Analysis

### 1. `toRoomSnapshot` Secret Word Visibility

- **When**: Feature 008 analysis (6-pass cross-reference)
- **What**: `toRoomSnapshot()` only exposed `secretWord` when `viewerParticipantId === room.currentDrawerId`. In result state, all participants must see the correct word (FR-003) — but non-drawers would get `null`.
- **Fix**: Added `room.status === "result"` check — always include `secretWord` in result state.
- **Why missed**: The conditional was correct for drawing state (only drawer should see the word) but wasn't revisited when "result" status was introduced.

### 2. Missing Status Guards in Canvas/NextWord Endpoints

- **When**: Feature 008 analysis
- **What**: `addCanvasStroke()`, `clearCanvas()`, `nextWord()` only checked drawer identity — they never checked `room.status`. After the game ended, the former drawer could still draw/advance via direct API calls (FR-008 violation).
- **Fix**: Added `if (room.status === "result") return 400 "Game has ended"` guards.
- **Why missed**: These functions predated the "result" status. They validated who could act but not whether action was currently allowed.

### 3. Frontend `setRoomSnapshot` Guard vs Restart

- **When**: Feature 008 implementation
- **What**: `setRoomSnapshot()` blocked updates where `currentRound` decreased (to prevent stale poll data from overwriting newer state). But restart legitimately resets `currentRound` from N → 0, which triggered the guard and blocked the update.
- **Fix**: Added `room.status !== "lobby"` exception — only allow `currentRound` decrease when transitioning to lobby.
- **Why missed**: The guard was added during Feature 007 (gameplay) without considering that a future restart feature would need to reset the round counter.

## Technical Constraints Discovered

### No WebSockets / HTTP Polling Only

- Established from the start. All state sync uses polling at ~2s intervals. This means drawing strokes appear on guessers' screens with latency (next poll cycle), not in real time. The stroke-based data model (arrays of coordinate points) was chosen to minimize payload size over polling.

### In-Memory Storage

- All game state lives in a `Map<string, Room>`. No persistence. Rooms are ephemeral — when the server restarts, all state is lost. Room codes must be unique per session but can collide across restarts.

### State Isolation

- Each room is an independent island. The `rooms` Map ensures rooms never share state, but this also means cross-room features (global leaderboards, room discovery) would require new infrastructure.

## Development Process Discoveries

### Analysis Before Implementation

- The 6-pass analysis (duplication, ambiguity, underspecification, constitution alignment, coverage gaps, inconsistency) caught 2 critical bugs and 1 high-severity issue that would have reached production. Cross-referencing design documents against actual source code was essential — the spec said "reject all gameplay in result state" but the code didn't enforce it.

### FSM Validation Gaps

- The FSM pattern (`lobby → drawing → result → lobby`) made state transitions explicit, but validation was applied inconsistently. Some endpoints checked status, others checked only identity. A systematic audit of all state-mutating endpoints against the full status set would have caught the gaps earlier.

### Frontend Store Consistency

- The custom `RoomStore` with `useSyncExternalStore` worked well but had a subtle guard that assumed `currentRound` only increases. Features that reset state (restart) broke this assumption. Future state-reset features need to account for this pattern.

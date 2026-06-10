# Research: Round Result & Restart

## 1. State Management Approach

**Decision**: Extend `RoomStatus` to include `"results"` as a third state (`"lobby" | "playing" | "results"`).

**Rationale**: Currently `roundOver` is a computed boolean on `RoomSnapshot` but the room stays in `"playing"` status. Adding a dedicated status allows the backend to distinguish "in an active round" from "round ended, showing results." This enables:
- Host-only restart authorization (checked against `status === "results"`)
- Clients to differentiate the results view from the game view via a single status check
- Server-side round data preservation until restart (data is not cleared until restart)

**Alternatives considered**:
- Keep `roundOver` boolean and use `"playing"` for both: would require additional state flags and makes authorization logic more complex.
- Delete round data immediately and compute results from a log: loses ability to show results after the fact.

## 2. Round-End Transition

**Decision**: When all guessers score 100 points (existing `roundOver` logic), automatically transition `room.status` to `"results"` instead of just setting a boolean.

**Rationale**: The existing `toRoomSnapshot()` already computes `allGuessersScored`. Moving this check into `submitGuess()` — the only place scores change — allows an immediate status transition. The computed `roundOver` field in the snapshot is replaced by the actual `status` check.

**Alternatives considered**:
- Timer-based round end: Out of scope per spec (no timers). The only round-end trigger is all guessers correct.
- Separate timer poll: Unnecessary complexity for a single trigger.

## 3. Restart Behavior

**Decision**: `POST /rooms/:code/restart` — host-only, requires `status === "results"`. Clears round data, sets status back to `"lobby"`. Player roster is preserved verbatim.

**Rationale**: Keeps the pattern consistent with `startGame`. The host check reuses existing `hostId` comparison. Clearing round data means resetting: `secretWord`, `drawerId`, `scores`, `guessHistory`, `canvasActions`. Participants array, host, and room code survive.

**Alternatives considered**:
- Auto-restart on host reconnect: Not needed per spec — host must manually start.
- DELETE + recreate room: Destroys player roster unnecessarily.

## 4. Frontend Navigation Flow

**Decision**: Three distinct routes (`/lobby`, `/game`, `/results`) with polling-based auto-navigation.

**Rationale**:
- `/lobby` stays the same (status: `"lobby"`)
- `/game` navigates to `/results` when `status === "results"`
- `/results` shows results screen; non-host players can navigate to `/lobby` manually
- Host sees restart button; clicking it calls `POST /restart`, server transitions to `"lobby"`, all clients navigate to `/lobby` on next poll
- Late joiners during results: poll returns results state with `status === "results"`, so they see the results page

**Alternatives considered**:
- Single page with conditional rendering: More complex state management, harder to test.
- Modal overlay on game page: Would need to manage game page lifecycle during results.

## 5. Data Visibility During Results

**Decision**: The `secretWord` is visible to ALL players during the results phase (not just the drawer). The guess history is always visible.

**Rationale**: The spec requires the correct word to be displayed prominently on the results screen (FR-001, acceptance scenario 1). Since the round is over, there's no reason to hide the word from guessers. This is a change from the current behavior where only the drawer sees `secretWord`.

**Implementation**: `toRoomSnapshot()` includes `secretWord` for all viewers when `status === "results"`.

## 6. Late Joiner Handling

**Decision**: A player joining during the results phase sees the full results state (correct word, scores, guess history from the completed round). After restart, they see lobby state (no residual data).

**Rationale**: Per clarification: "Include in score list with 0, include in guess history with empty list" for mid-round joiners. The FR-010 requires results state available to any polling player. SC-005 requires late joiners to see the same results.

## 7. Non-Host Navigation to Lobby During Results

**Decision**: Server-side room status stays `"results"` until restart. Non-host players may navigate their client to `/lobby`. The lobby view during results shows the player list and indicates the round is in results.

**Rationale**: Per spec edge case "Navigate to lobby during results." The server remains authoritative — only the host's restart action changes server state. Client-side navigation is purely a UI concern.

## Key Design Constraints

- No WebSockets: All state sync via HTTP polling (~2s)
- No database: All state in-memory
- No new dependencies: Existing Zod, Express, React, Vitest
- Backward compatibility: Existing tests must pass; existing API contracts extended, not broken

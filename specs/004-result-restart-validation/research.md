# Research: Result, Restart And Final Validation

## Timer Implementation

- **Decision**: Server-side tick-based timer using `setInterval` with per-room `timerStartedAt` timestamp. No frontend countdown exposed in v1.
- **Rationale**: Simplest approach — store `timerStartedAt` on the Round, check elapsed time against `timerDuration` on each poll and action. No need for real-time push or frontend timers.
- **Alternatives considered**: Client-side countdown (complex, drifts across clients), `setTimeout` per room (harder to manage with Map cleanup).

## Round End Detection

- **Decision**: Check both triggers on every poll/action: (1) `correctGuessers.length === guesserCount` → end round, (2) `Date.now() - timerStartedAt >= timerDuration * 1000` → end round.
- **Rationale**: Both checks happen server-side in `getRoom()` and any mutating action. Cheap boolean checks; no separate polling loop needed.
- **Alternatives considered**: Dedicated timer expiry loop (wasteful, adds complexity).

## Result State

- **Decision**: Add `"result"` to `RoomStatus`. Snapshot includes `secretWord` for all viewers (round is over, no need to hide). Restart button only if `viewerParticipantId === hostId`.
- **Rationale**: Reuse existing `RoomSnapshot` pattern. No new snapshot type needed. Status change is picked up by frontend polling.

## Restart Action

- **Decision**: `POST /:code/restart` — host-only. Clears `currentRound`, sets `status` back to `"lobby"`. Frontend detects status="lobby" during polling → navigates to `/lobby`.
- **Rationale**: Simple state reset. Reuses existing lobby → game flow. No new routing needed.

## Host Identity

- **Decision**: Host is `room.hostId`. Persisted in snapshot. Frontend compares against `participantId` to show/hide restart button.
- **Rationale**: Already implemented in existing system (startGame uses same check).

## Frontend Detection

- **Decision**: GamePage polling detects `room.status === "result"` → renders `ResultView` instead of game UI. Polling detects `room.status === "lobby"` → navigates to `/lobby`.
- **Rationale**: One polling loop handles all state transitions. No new routes needed.

## Round Timer

- **Decision**: `timerDuration` stored on `Room` (not Round), default 300s. Set at game start. Timer starts when round begins (`startGame`).
- **Rationale**: Room-level config persists across restarts. Single source of truth.

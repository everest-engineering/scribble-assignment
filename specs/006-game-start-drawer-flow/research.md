# Research: Game Start and Drawer Flow

## Player Name Validation

### Current State
- Frontend `CreateRoomPage` and `JoinRoomPage` accept `playerName` as optional string with no validation
- Backend `createRoomSchema` and `joinRoomSchema` define `playerName: z.string().optional()`
- Backend `displayName()` defaults empty/falsy names to `"Player"`

### Decision
- **Frontend**: Add inline validation before submit. Trim name. If empty after trim, show error and prevent submission.
- **Backend**: Update Zod schemas — `playerName` becomes `z.string().trim().min(1, "Player name is required")`. Remove the `displayName()` fallback for empty names.
- **Rationale**: Dual validation (frontend for UX, backend for safety) matches existing room-code pattern. Backend must independently enforce to prevent API bypass.
- **Alternatives considered**: Backend-only validation (worse UX), frontend-only (insecure).

## Game Start Endpoint

### Current State
- No backend endpoint for starting a game
- "Start Game" button in LobbyPage just calls `navigate("/game")` — no server-side state change

### Decision
- **New endpoint**: `POST /:code/start`
  - Validates: room exists, status is `"lobby"`, requester is host, 2+ participants
  - Returns: `{ room: RoomSnapshot }` with updated status
  - Transitions room status from `"lobby"` to `"drawing"`
- **Frontend**: LobbyPage "Start Game" button POSTs to `/:code/start` via `roomStore.startGame()`. On success, frontend navigates to `/game` (status change also detected by poll).
- **Rationale**: Server-authoritative game state. Polling already navigates on status change (Feature 004). POST ensures idempotent-ish start.
- **Alternatives considered**: Just navigating (no server state — insecure), changing status via PATCH (POST is more RESTful for action endpoints).

## Drawer Assignment

### Current State
- `Room.hostId` is set at creation
- `Participant.isHost` identifies host

### Decision
- Round 1 drawer = host (identified by `room.hostId`)
- `RoomSnapshot` gains `currentDrawerId: string` field
- Frontend compares `room.currentDrawerId` with `participantId` to determine "am I the drawer?"
- **Rationale**: Matches spec FR-004. `currentDrawerId` supports future round rotation.
- **Alternatives considered**: Guessing via `isHost` (fragile for later rounds).

## Secret Word Selection

### Current State
- 5 starter words: `["rocket", "pizza", "castle", "guitar", "sunflower"]`
- `toRoomSnapshot` returns all words as `availableWords`

### Decision
- Word index = `(round - 1) % words.length` (deterministic, zero-indexed)
- `RoomSnapshot` gains `secretWord: string | null`
  - Set to the current word for the drawer participant
  - Set to `null` for non-drawer participants
  - (World list `availableWords` remains visible to all as hint context)
- Backend `toRoomSnapshot()` uses `viewerParticipantId` (already present) to compare with `currentDrawerId`
- **Rationale**: Deterministic per spec FR-007. `viewerParticipantId` already exists in the function signature.
- **Alternatives considered**: Removing `availableWords` for non-drawers (spec assumption says they remain visible), separate word endpoint (unnecessary).

## Word Stability Across Polls

### Decision
- `secretWord` is computed from `room.currentRound` and the starter list — it never changes within a round unless the room state changes
- `toRoomSnapshot` is called on every poll and re-derives the word — same deterministic formula → same result
- **Rationale**: FR-010 requires word stability. Determinism guarantees this.

## Room Status Types

### Current State
```typescript
export type RoomStatus = "lobby";
```

### Decision
Add `"drawing"`:
```typescript
export type RoomStatus = "lobby" | "drawing";
```
Frontend `RoomSnapshot.status` union type updated accordingly.

- **Rationale**: Minimum viable status for round 1. Future rounds may need `"guessing"`, `"reveal"`, etc.
- **Alternatives considered**: `"playing"` (too vague), `"in-progress"` (doesn't convey current phase).

# Research: Game Start & Drawer Flow

**Branch**: `assignment` | **Date**: 2026-05-31

## Findings

### Decision: `drawerId` and `secretWord` set in `startRoom()`, stored on `Room`
- **Decision**: Extend `Room` with `drawerId: string | null` and `secretWord: string | null`. Both are `null` in lobby state, set when `startRoom()` is called. `drawerId = room.hostId`. `secretWord = STARTER_WORDS[0]`.
- **Rationale**: Single write at game start; both fields are stable for the room's lifetime. No recomputation needed on polls.
- **Alternatives considered**: Deriving drawer/word from room state on every snapshot — rejected; more complex and risks inconsistency.

### Decision: `secretWord` conditionally included in snapshot
- **Decision**: `toRoomSnapshot(room, viewerParticipantId)` already accepts `viewerParticipantId` but currently ignores it (`void viewerParticipantId`). Now use it: include `secretWord` in the returned snapshot only when `viewerParticipantId === room.drawerId`. Omit the field entirely otherwise (not `null`, not `undefined` — key absent from object).
- **Rationale**: Cleanest way to enforce secrecy — the field simply doesn't exist in the guesser's response. Frontend can check `"secretWord" in room` or `room.secretWord !== undefined`.
- **Alternatives considered**: Always returning `secretWord: null` for guessers — rejected; leaks that a word exists and risks frontend accidentally rendering it.

### Decision: `drawerId` always present in snapshot
- **Decision**: `drawerId` is included in every snapshot regardless of viewer. It is not secret — all players need to know who the drawer is to display "Alice is drawing."
- **Rationale**: Functional requirement FR-004 + FR-005.

### Decision: No new polling on Game screen for Scenario 2
- **Decision**: Game screen does not add polling in this scenario. Clients already have the full snapshot (with `drawerId` and `secretWord` for the drawer) when they navigate from the Lobby. The snapshot was the one that contained `status: "game"` which triggered navigation.
- **Rationale**: Scenario 2 acceptance criteria are fully met by the existing snapshot. Polling on the Game screen is a Scenario 3 concern (guess history sync).

### Decision: `RoomSnapshot` type — `secretWord` as optional field
- **Decision**: Add `secretWord?: string` (optional, not `string | null`) to the frontend `RoomSnapshot` interface. `undefined` means the viewer is not the drawer. A present string means the viewer is the drawer.
- **Rationale**: Matches the backend's conditional inclusion. Frontend checks `room.secretWord` — truthy means drawer.

## Existing Code Reused Without Change
- `startRoom()` in `roomStore.ts` — extended (not replaced) to set `drawerId` and `secretWord`
- `toRoomSnapshot()` — extended to use `viewerParticipantId` (already a parameter, currently ignored)
- `GamePage.tsx` — extended to display drawer identity and conditional secret word
- All Scenario 1 validation — unchanged

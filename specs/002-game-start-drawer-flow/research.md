# Research: Game Start & Drawer Flow

**Branch**: `002-game-start-drawer-flow` | **Date**: 2026-06-02

## Summary

All technical unknowns resolved through codebase inspection. No external research required — the project is a brownfield TypeScript monorepo with established patterns.

---

## Decision 1: Word selection algorithm

**Decision**: Use `STARTER_WORDS[0]` ("rocket") as the round 1 secret word.

**Rationale**: Confirmed in clarification Q1. `STARTER_WORDS` already exists at `backend/src/seed/starterData.ts`. Position 0 is "rocket". `startRoom()` will assign this directly.

**Alternatives considered**: Hash-based (rejected — adds complexity with no benefit for v1); random pick (rejected — non-deterministic, breaks SC-006).

---

## Decision 2: Host identity

**Decision**: `room.hostId` is always the room creator's `participantId`. This field is already set in `createRoom()` and never mutated.

**Rationale**: Confirmed in clarification Q2 and verified in `roomStore.ts:59` (`hostId: participant.id`). No "first to join" ambiguity — creator and first joiner are the same participant.

**Alternatives considered**: First-by-join-timestamp (rejected — adds complexity; creator and first joiner are already the same person).

---

## Decision 3: Secret word server-side enforcement

**Decision**: `toRoomSnapshot(room, viewerParticipantId)` will return `currentWord` only when `viewerParticipantId === room.drawerId`. Non-drawer clients receive `currentWord: null`.

**Rationale**: Confirmed in clarification Q3. The current `toRoomSnapshot` already accepts `viewerParticipantId` but ignores it (`void viewerParticipantId` on line 138). The fix is straightforward. This ensures the word never travels to non-drawer clients regardless of UI state.

**Alternatives considered**: UI-only hiding (rejected — trivially bypassed by inspecting network responses).

---

## Decision 4: Start button UX when fewer than 2 players

**Decision**: The "Start Game" button is disabled and shows the label "Need at least 2 players" when `isHost && room.participants.length < 2`.

**Rationale**: Confirmed in clarification Q4. LobbyPage already computes `canStart = isHost && room.participants.length >= 2` and disables the button. The addition is the explanatory text label visible alongside the button.

**Alternatives considered**: Always-enabled with post-click error (rejected — worse UX, unnecessary round-trip).

---

## Decision 5: Disconnect during game-start transition

**Decision**: The backend `startRoom()` validates `participants.length >= 2` at call time. If a "disconnect" drops the count below 2 before the host clicks Start, `too_few_players` is returned (HTTP 400) and the lobby is preserved. The frontend shows this error to the host.

**Rationale**: Confirmed in clarification Q5. In a polling architecture there is no explicit disconnect event — a disconnected client simply stops polling but remains in `room.participants`. The practical interpretation is: the server validates the count atomically at start time, and the existing `too_few_players` guard satisfies FR-011. An explicit player-removal endpoint (for true disconnect/leave) is out of scope for this feature.

**Alternatives considered**: WebSocket push for real-time disconnect (rejected — out of scope; polling architecture is the established pattern per constitution Principle V and existing implementation).

---

## Codebase Gap Analysis

| Area | Current State | Required Change |
|------|--------------|-----------------|
| `Room` model | No `drawerId` / `currentWord` fields | Add both as nullable |
| `RoomSnapshot` model | No `drawerId` / `currentWord` fields | Add both as nullable |
| `shared/schemas/room.ts` | No `drawerId` / `currentWord` in Zod schema | Add nullable fields |
| `roomStore.startRoom()` | Transitions status only | Also set `drawerId`, `currentWord` |
| `roomStore.startRoom()` | No guard for already-in-progress | Add `already_started` result |
| `roomStore.createRoom()` | No `drawerId`/`currentWord` init | Initialize to `null` |
| `roomStore.toRoomSnapshot()` | Ignores `viewerParticipantId` | Return `currentWord` only to drawer |
| `rooms.ts POST /:code/start` | `toRoomSnapshot(result.room)` — no viewer | Pass `participantId` as viewer |
| `LobbyPage.tsx` | Button disabled but no label | Add "Need at least 2 players" label |
| `GamePage.tsx` | No drawer identification | Show drawer name; show word to drawer only |
| Tests | No drawer/word tests | TDD tests for all new behaviour |

# Implementation Plan: Game Start & Drawer Flow

**Branch**: `assignment` | **Date**: 2026-05-28 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/002-game-start-drawer-flow/spec.md`

---

## Summary

When `POST /rooms/:code/start` fires, set `drawerId = hostId` and
`secretWord = STARTER_WORDS[0]` on the room. `toRoomSnapshot()` conditionally
includes `secretWord` only when the viewer is the drawer. The game screen derives
each player's role and shows/hides the word accordingly.

---

## Technical Context

**Language/Version**: TypeScript 5 (backend Node 18 + Express; frontend React 18 + Vite)

**Primary Dependencies**: Existing — no new dependencies

**Storage**: In-memory `Map<string, Room>` — extend existing Room model

**Testing**: Vitest — extend `roomStore.test.ts`

**Constraints**: Deterministic — word always `STARTER_WORDS[0]`; drawer always `hostId`

---

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Brownfield-First | ✅ Pass | Extending Room model and snapshot only |
| II. Spec-Driven | ✅ Pass | Traces to FR-001–FR-007 |
| III. Deterministic Rules | ✅ Pass | word = STARTER_WORDS[0], drawer = hostId |
| IV. Strict Scope | ✅ Pass | No new libraries, no rotation, no timer |
| V. Incremental Validation | ✅ Pass | Gate: drawer sees word, guesser does not |
| VI. AI-Assisted, Human-Reviewed | ✅ Pass | Reviewed before commit |

---

## Data Model Changes

### Backend `Room` (game.ts)

```
Before:  code, status, hostId, participants[], createdAt, updatedAt
After:   code, status, hostId, drawerId, secretWord, participants[], createdAt, updatedAt
         drawerId and secretWord are set when status transitions to "playing"
         Both are optional (undefined) while in "lobby" or "result"
```

### Backend `RoomSnapshot` (game.ts)

```
Before:  code, status, hostId, participants[], availableWords, roles
After:   code, status, hostId, drawerId, secretWord (optional), participants[],
         availableWords, roles
         secretWord present only when viewer === drawer
```

### Frontend `RoomSnapshot` (api.ts)

```
Before:  code, status, hostId, participants[], availableWords, roles
After:   code, status, hostId, drawerId, secretWord (optional), participants[],
         availableWords, roles
```

---

## File-Level Changes

```
backend/
├── src/models/game.ts              ← add drawerId?: string, secretWord?: string to Room + RoomSnapshot
├── src/services/roomStore.ts       ← startGame() sets drawerId + secretWord; toRoomSnapshot() conditionally includes secretWord
└── src/services/roomStore.test.ts  ← add tests: drawerId set, secretWord set, visibility rules

frontend/
├── src/services/api.ts             ← add drawerId, secretWord? to RoomSnapshot type
└── src/pages/GamePage.tsx          ← show role (Drawer/Guesser), show secretWord to drawer only
```

---

## Data Flow

### Start Game (extended from Group 1)

```
POST /rooms/:code/start { participantId }
  → startGame():
      room.drawerId = room.hostId
      room.secretWord = STARTER_WORDS[0]   // "rocket"
      room.status = "playing"
  → toRoomSnapshot(room, viewerParticipantId):
      if viewerParticipantId === room.drawerId → include secretWord
      else → omit secretWord (undefined)
```

### Game Screen Rendering

```
GamePage loads room from RoomStore
  → isDrawer = participantId === room.drawerId
  → role label: isDrawer ? "Drawer" : "Guesser"
  → secret word panel: isDrawer && room.secretWord ? show word : hide
```

---

## Implementation Sequence

1. Backend: add `drawerId?` and `secretWord?` to `Room` and `RoomSnapshot` in `game.ts`
2. Backend: update `startGame()` to set both fields; update `toRoomSnapshot()` to accept `viewerParticipantId` and conditionally include `secretWord`
3. Backend: update all `toRoomSnapshot()` call sites in `rooms.ts` to pass `participantId`
4. Backend: extend `roomStore.test.ts` — drawer set, word set, visibility per viewer
5. Frontend: add `drawerId` and `secretWord?` to `RoomSnapshot` type in `api.ts`
6. Frontend: update `GamePage.tsx` — role label + secret word display

---

## Testing Strategy

- Extend `roomStore.test.ts`: `startGame` sets `drawerId === hostId`; `startGame` sets `secretWord === "rocket"`; `toRoomSnapshot` includes `secretWord` for drawer; omits it for guesser.
- Manual two-screen validation: drawer sees word, guesser does not, network tab confirms.

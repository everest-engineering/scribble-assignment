# Implementation Plan: Game Start & Drawer Flow

**Branch**: `assignment` | **Date**: 2026-05-31 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/002-game-start-drawer/spec.md`

## Summary

Extend the game start flow to assign the host as the drawer and select the
secret word (`STARTER_WORDS[0]` = `"rocket"`). The backend conditionally
includes `secretWord` in the room snapshot only for the drawer. The Game screen
displays the drawer's identity to all players and the secret word only to the
drawer. No new polling added — clients already have the full snapshot when they
navigate from the Lobby.

## Technical Context

**Language/Version**: TypeScript 5.x (Node.js 18+)
**Primary Dependencies**: Express, React + Vite, Zod — all existing
**Storage**: In-memory `Map<string, Room>` — unchanged
**Testing**: Existing unit tests; manual two-tab acceptance
**Target Platform**: Local — `localhost:3001` / `localhost:5173`
**Project Type**: Web application — brownfield extension
**Constraints**: No new npm dependencies; TypeScript throughout; extend not rewrite

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Brownfield-First — extend not rewrite | ✅ PASS | All changes extend existing files |
| II. Deterministic Game Rules — `STARTER_WORDS[0]` | ✅ PASS | Fixed word, not random |
| II. secretWord server-only logic | ✅ PASS | Word selection and secrecy enforced backend |
| III. Polling, Not Real-Time | ✅ PASS | No new polling mechanism added |
| IV. Incremental — Scenario 2 only | ✅ PASS | No Scenario 3+ work included |
| V. Simplicity — no new deps | ✅ PASS | Zero new dependencies |

## Project Structure

### Documentation (this feature)

```text
specs/002-game-start-drawer/
├── plan.md         ← this file
├── research.md     ← Phase 0 output
├── data-model.md   ← Phase 1 output
├── contracts/
│   └── rooms.md    ← Phase 1 output
└── tasks.md        ← Phase 2 output (/speckit-tasks)
```

### Source Code (files changed)

```text
backend/
└── src/
    ├── models/
    │   └── game.ts          ← add drawerId + secretWord to Room and RoomSnapshot
    └── services/
        └── roomStore.ts     ← set drawerId + secretWord in startRoom();
                                use viewerParticipantId in toRoomSnapshot();
                                initialise fields to null in createRoom/joinRoom

frontend/
└── src/
    ├── services/
    │   └── api.ts           ← add drawerId + optional secretWord to RoomSnapshot
    └── pages/
        └── GamePage.tsx     ← show drawer name to all; show secretWord to drawer only
```

**Structure Decision**: 4 files changed, all extensions of existing starter files.
No new files or directories required.

## Backend Changes

### 1. `backend/src/models/game.ts`
- Add `drawerId: string | null` to `Room` (null in lobby)
- Add `secretWord: string | null` to `Room` (null in lobby, never sent to frontend)
- Add `drawerId: string | null` to `RoomSnapshot` (always present)
- Add `secretWord?: string` to `RoomSnapshot` (optional — present only for drawer)

### 2. `backend/src/services/roomStore.ts`
- In `createRoom()`: initialise `drawerId: null, secretWord: null`
- In `joinRoom()`: no change needed (spread keeps existing fields)
- In `startRoom()`: set `drawerId: room.hostId` and `secretWord: STARTER_WORDS[0]`
- In `toRoomSnapshot()`: remove `void viewerParticipantId`; include `drawerId: room.drawerId` always; spread `{ secretWord: room.secretWord }` only when `viewerParticipantId === room.drawerId && room.secretWord !== null`

## Frontend Changes

### 3. `frontend/src/services/api.ts`
- Add `drawerId: string | null` to `RoomSnapshot` interface
- Add `secretWord?: string` to `RoomSnapshot` interface

### 4. `frontend/src/pages/GamePage.tsx`
- Derive `isDrawer = room.drawerId === participantId`
- Derive `drawer = room.participants.find(p => p.id === room.drawerId)`
- Display drawer's name with "is drawing" label — visible to all participants
- Show "Your word: [word]" section only when `isDrawer && room.secretWord`
- Show role badge: "You are drawing" / "You are guessing"

## Data Flow

```
POST /rooms/:code/start (host):
  → backend: drawerId = hostId, secretWord = "rocket", status = "game"
  → response includes secretWord (caller is always the drawer)
  → host RoomStore updates → host navigates to /game

Other clients (lobby polling detects status = "game"):
  → GET /rooms/:code?participantId=<guesser-id>
  → snapshot: drawerId present, secretWord absent
  → navigate to /game with snapshot in React state

On /game screen:
  → drawer: room.drawerId === participantId → "Your word: rocket" shown
  → guessers: room.drawerId !== participantId → no word shown
  → all: drawer's name displayed from participants list
```

## Testing Strategy

- Manual two-tab verification (primary gate)
- Backend build after model/service changes confirms TypeScript correctness
- Existing 4 unit tests confirm no regressions
- Browser DevTools: verify guesser network response has no `secretWord` key

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| `createRoom` TypeScript error — `Room` now requires `drawerId`/`secretWord` | Initialise both to `null` in `createRoom()` |
| Conditional spread of `secretWord` when null | Guard: only spread when `room.secretWord !== null` |
| Frontend renders stale snapshot without `drawerId` | Non-issue — navigation triggered by snapshot that already contains `drawerId` |

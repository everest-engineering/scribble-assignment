# Data Model: Game Start & Drawer Flow

**Feature**: 002-game-start-drawer
**Date**: 2026-06-04

---

## Backend Models (`backend/src/models/game.ts`)

### Room (extended)

| Field | Type | Change | Description |
|-------|------|--------|-------------|
| `code` | `string` | Existing | Unique room code |
| `status` | `RoomStatus` | Existing | `"lobby" \| "playing" \| "result"` |
| `participants` | `Participant[]` | Existing | All players |
| `hostId` | `string` | Existing (S1) | Host participant ID |
| `drawerId` | `string \| undefined` | **NEW** | Drawer's participant ID; set at game start, absent in lobby |
| `secretWord` | `string \| undefined` | **NEW** | The selected word; set at game start, absent in lobby |
| `createdAt` | `string` | Existing | ISO 8601 creation timestamp |
| `updatedAt` | `string` | Existing | ISO 8601 last-update timestamp |

---

### RoomSnapshot (extended)

| Field | Type | Change | Description |
|-------|------|--------|-------------|
| `code` | `string` | Existing | Room code |
| `status` | `RoomStatus` | Existing | Current room phase |
| `participants` | `Participant[]` | Existing | All participants |
| `hostId` | `string` | Existing (S1) | Host ID |
| `drawerId` | `string \| undefined` | **NEW** | Drawer ID — visible to all players when set |
| `secretWord` | `string \| undefined` | **NEW** | Present **only** when `viewerParticipantId === drawerId`; absent otherwise |
| `availableWords` | `string[]` | Existing | Starter word list |
| `roles` | `ParticipantRole[]` | Existing | Starter roles |

**Filtering rule**: `secretWord` is included in the snapshot only when the requesting player
is the drawer. The field is **omitted entirely** (not `null`) for all other players.

---

## Frontend Types (`frontend/src/services/api.ts`)

### RoomSnapshot (mirrored)

| Field | Type | Change | Description |
|-------|------|--------|-------------|
| `code` | `string` | Existing | Room code |
| `status` | `RoomStatus` | Existing (S1) | Current phase |
| `participants` | `Participant[]` | Existing | All participants |
| `hostId` | `string` | Existing (S1) | Host ID |
| `drawerId` | `string \| undefined` | **NEW** | Drawer ID |
| `secretWord` | `string \| undefined` | **NEW** | Present only for the drawer's client |
| `availableWords` | `string[]` | Existing | Word list |
| `roles` | `ParticipantRole[]` | Existing | Role list |

---

## Backend Service Changes (`backend/src/services/roomStore.ts`)

| Function | Change |
|----------|--------|
| `startRoom(code, participantId)` | **Extend** — after setting `status = "playing"`, also set `room.drawerId = room.hostId` and `room.secretWord = STARTER_WORDS[0]` |
| `toRoomSnapshot(room, viewerParticipantId?)` | **Implement filter** — include `drawerId` always; include `secretWord` only if `viewerParticipantId === room.drawerId` |

---

## Frontend Component Changes

| File | Change |
|------|--------|
| `frontend/src/pages/GamePage.tsx` | Derive `isDrawer = room.drawerId === participantId`; render word banner, role-aware canvas label, disable guess form for drawer |
| `frontend/src/components/GuessForm.tsx` | Already accepts `disabled` prop — pass `disabled={isDrawer}` from GamePage |

---

## Affected Files Summary

| File | Change Type |
|------|-------------|
| `backend/src/models/game.ts` | Add `drawerId?` and `secretWord?` to `Room` and `RoomSnapshot` |
| `backend/src/services/roomStore.ts` | `startRoom()` sets `drawerId`/`secretWord`; `toRoomSnapshot()` implements word filter |
| `frontend/src/services/api.ts` | Add `drawerId?` and `secretWord?` to `RoomSnapshot` |
| `frontend/src/pages/GamePage.tsx` | Role-aware rendering: word banner, canvas label, guess form guard |

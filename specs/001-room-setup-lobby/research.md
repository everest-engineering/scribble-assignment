# Research: Room Setup and Lobby

**Phase**: 0 | **Feature**: Room Setup and Lobby | **Date**: 2026-06-11

## Existing Code Analysis

### Backend Patterns

- **Room ID generation**: `generateUniqueCode()` in `roomStore.ts` already generates 4-char codes with collision retry using a reduced alphabet (`ABCDEFGHJKLMNPQRSTUVWXYZ23456789` — excludes `I`, `O`, `0`, `1` for readability).
- **Participant ID**: Uses `randomUUID()` from `node:crypto`.
- **Room storage**: `Map<string, Room>` — in-memory, no persistence.
- **Snapshot building**: `toRoomSnapshot()` currently ignores the `viewerParticipantId` parameter and always exposes all words. This needs fixing for drawer-only word visibility.
- **Existing endpoints**: `POST /rooms`, `POST /rooms/:code/join`, `GET /rooms/:code`. Each returns `RoomSnapshot` with `participants`, `availableWords`, and `roles`.

### Frontend Patterns

- **Component structure**: Page components in `pages/`, reusable UI in `components/`, API in `services/api.ts`, state in `state/roomStore.ts`.
- **Routing**: `react-router-dom` v6 with `BrowserRouter`, `Route`, `Navigate`.
- **State management**: Custom `RoomStore` class with `useSyncExternalStore` for reactivity. Context provider pattern.
- **Existing bug**: `API_BASE_URL` default has `/bug` suffix (`http://localhost:3001/bug`).

### Room Creation Flow (existing)

1. `CreateRoomPage` form submits → `roomStore.createRoom(playerName)` → `POST /rooms { playerName }` → backend creates room with 1 participant as host.
2. Backend stores `Room` in `Map`, returns `RoomSessionResponse` with `participantId` and room snapshot.
3. Frontend stores `participantId` and `room` in state, navigates to `/lobby`.

### Room Join Flow (existing)

1. `JoinRoomPage` form submits → `roomStore.joinRoom(code, playerName)` → `POST /rooms/:code/join { playerName }` → backend adds participant.
2. Backend returns `RoomSessionResponse`.
3. Frontend stores session, navigates to `/lobby`.

### Lobby Flow (existing, incomplete)

- Displays room code, participant list, status card.
- "Refresh Room" button manually calls `roomStore.fetchRoom()`.
- "Start Game" navigates to `/game` without backend interaction (no validation, no state change).

### Identified Gaps

| Gap | Current State | Required State |
|-----|--------------|----------------|
| Host tracking | No host field on `Room` or `Participant` | First participant is host, `hostId` on `Room` |
| Room status enum | Only `"lobby"` | `"lobby"`, `"playing"`, `"finished"` |
| Start game endpoint | Missing | `POST /rooms/:code/start` with host check, min 2 players, status change, drawer/word assignment |
| Name validation | `playerName` optional in Zod schemas | Required, non-empty, no whitespace-only |
| Code validation | No format check | Required, non-empty |
| Lobby polling | Manual "Refresh Room" button | Automatic polling ~2s interval |
| Host UI | Everyone sees "Start Game" | Only host sees interactive start button |
| API base URL bug | `.../bug` suffix | Correct URL `http://localhost:3001` |
| Drawer/word selection | Not implemented | On game start: deterministic drawer selection, word from starter list, filtered visibility |

## Key Decisions

- **Decision**: Room code collision retry (existing `generateUniqueCode()` handles this — no change needed).
- **Decision**: Host identification via `hostId` on `Room` model (first participant becomes host).
- **Decision**: Drawer assignment uses a deterministic algorithm: first participant after host in join order (consistent with deterministic game logic principle — index-based, not random).
- **Decision**: Word selection uses deterministic index: `wordIndex = (currentTimestamp OR roundNumber) % words.length` — but for v1 simplicity, use the first available word (`STARTER_WORDS[0]`) since the spec doesn't mandate round-robin across rounds.

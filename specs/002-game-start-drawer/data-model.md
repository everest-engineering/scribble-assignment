# Data Model: Game Start & Drawer Flow

**Feature**: `002-game-start-drawer`  
**Date**: 2026-05-31  
**Builds on**: Scenario 1 (`001-room-setup-lobby`)

## Entity Changes

### Room (backend: `backend/src/models/game.ts`)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `code` | `string` | yes | unchanged |
| `status` | `"lobby" \| "playing"` | yes | unchanged |
| `hostId` | `string` | yes | unchanged |
| `drawerId` | `string \| null` | yes | **NEW** — set to `hostId` on `startGame`; `null` in lobby |
| `secretWord` | `string \| null` | yes | **NEW** — server-only storage; set on `startGame` |
| `scores` | `Record<string, number>` | yes | **NEW** — participant id → score; all `0` at round start |
| `participants` | `Participant[]` | yes | names stored trimmed |
| `createdAt` / `updatedAt` | ISO string | yes | unchanged |

### Participant (unchanged shape)

| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | unchanged |
| `name` | string | trimmed non-empty after validation |
| `joinedAt` | ISO string | unchanged |

### RoomSnapshot (API response — viewer-filtered)

| Field | Type | When present |
|-------|------|--------------|
| `code` | `string` | always |
| `status` | `"lobby" \| "playing"` | always |
| `hostId` | `string` | always |
| `drawerId` | `string \| null` | always (null in lobby) |
| `participants` | `Participant[]` | always |
| `scores` | `Record<string, number>` | when `playing` |
| `secretWord` | `string` | **drawer viewer only** when `playing` |
| `availableWords` | `string[]` | lobby only (omit when playing to avoid leaks) |
| `roles` | `ParticipantRole[]` | optional metadata; unchanged |

Derived on client:

- `isDrawer` = `participantId === room.drawerId`
- `viewerRole` = `isDrawer ? "drawer" : "guesser"`

## Validation Rules

### Player name (create & join)

```
trim(playerName)
reject if length === 0 → "Player name is required"
store trimmed value
```

Zod pattern:

```typescript
z.string().trim().min(1, "Player name is required")
```

### Secret word selection (on start)

```
index = sum(charCodeAt(code[i])) % STARTER_WORDS.length
secretWord = STARTER_WORDS[index]
```

## State Transitions

```text
lobby --[startGame]--> playing
  side effects:
    drawerId = hostId
    secretWord = selectSecretWord(code)
    scores[each participant.id] = 0
```

## Files Touched (planned)

| Layer | File | Change |
|-------|------|--------|
| Model | `backend/src/models/game.ts` | `drawerId`, `secretWord`, `scores`; snapshot fields |
| Service | `backend/src/services/roomStore.ts` | name normalize; startGame round setup; filtered snapshot |
| Service | `backend/src/services/wordSelection.ts` (new) | deterministic word pick |
| API | `backend/src/api/schemas.ts` | trimmed name schemas |
| API | `backend/src/api/rooms.ts` | pass viewer id to snapshot; 400 on bad name |
| Tests | `backend/src/services/roomStore.test.ts` | names, word, drawer, snapshot filter |
| Tests | `backend/src/services/wordSelection.test.ts` (new) | deterministic word |
| API types | `frontend/src/services/api.ts` | snapshot fields |
| Pages | `frontend/src/pages/CreateRoomPage.tsx` | client name validation |
| Pages | `frontend/src/pages/JoinRoomPage.tsx` | client name validation |
| Pages | `frontend/src/pages/GamePage.tsx` | polling, drawer label, word panel, guard |
| Components | `frontend/src/components/Scoreboard.tsx` | render scores from snapshot |
| State | `frontend/src/state/roomStore.ts` | unchanged API surface |

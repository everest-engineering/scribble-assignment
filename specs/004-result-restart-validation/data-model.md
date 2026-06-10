# Data Model: Result, Restart, and Final Validation

**Branch**: `004-result-restart-validation` | **Date**: 2026-06-10

## Changes to Existing Entities

### RoomStatus (backend: `game.ts`, frontend: `api.ts`)

```
Before: "lobby" | "playing"
After:  "lobby" | "playing" | "result"
```

The `"result"` state is entered via `POST /rooms/:code/end` and exited via `POST /rooms/:code/restart` (back to `"lobby"`).

### Room (backend: `game.ts`)

No new fields. All fields needed for the result screen (`secretWord`, `drawerName`, `guesses`, `scores`) already exist on the `Room` type. They are **preserved** in `"result"` state and **cleared** on restart.

| Field | On enter "result" | On restart (→ "lobby") |
|-------|-------------------|------------------------|
| `status` | `"result"` | `"lobby"` |
| `secretWord` | unchanged | `undefined` |
| `drawerName` | unchanged | `undefined` |
| `guesses` | unchanged | `[]` |
| `scores` | unchanged | `{}` |
| `strokes` | unchanged | `[]` |
| `participants` | unchanged | unchanged (preserved) |

### RoomSnapshot (backend: `game.ts`, frontend: `api.ts`)

The `status` field type widens from `"lobby" | "playing"` to `"lobby" | "playing" | "result"`.

When `status === "result"`, `toRoomSnapshot` includes:
- `secretWord` — always exposed (no viewer filtering; round is over)
- `drawerName` — always exposed
- `guesses` — full ordered list
- `scores` — all participant scores

```typescript
// Extended status union
export type RoomStatus = "lobby" | "playing" | "result";
```

## State Machine

```
         createRoom()
              │
              ▼
           [lobby]
              │
         startGame()
              │
              ▼
          [playing]
              │
           endGame()          (host only)
              │
              ▼
           [result]
              │
         restartGame()        (host only)
              │
              ▼
           [lobby]  ◄─── (loop)
```

## New Service Functions (backend: `roomStore.ts`)

### `endGame(code: string, playerName: string): Room`

- Looks up room by code; throws 404 if not found
- Validates `room.status === "playing"`; throws 409 if not
- Validates `playerName === room.participants[0].name`; throws 403 if not host
- Sets `room.status = "result"`
- Calls `saveRoom(room)` and returns the updated snapshot

### `restartGame(code: string, playerName: string): Room`

- Looks up room by code; throws 404 if not found
- Validates `room.status === "result"`; throws 409 if not
- Validates `playerName === room.participants[0].name`; throws 403 if not host
- Clears: `secretWord`, `drawerName`, `guesses = []`, `scores = {}`, `strokes = []`
- Sets `room.status = "lobby"`
- Calls `saveRoom(room)` and returns the updated snapshot

## New Zod Schemas (backend: `schemas.ts`)

```typescript
export const endGameSchema = z.object({
  playerName: z.string().trim().min(1, "Player name is required")
});

export const restartSchema = z.object({
  playerName: z.string().trim().min(1, "Player name is required")
});
```

## New Frontend API Methods (`frontend/src/services/api.ts`)

```typescript
endGame(code: string, playerName: string): Promise<{ room: RoomSnapshot }>
restartGame(code: string, playerName: string): Promise<{ room: RoomSnapshot }>
```

## New Frontend Store Actions (`frontend/src/state/roomStore.ts`)

```typescript
async endGame(): Promise<RoomSnapshot>   // uses viewer's playerName from state
async restartGame(): Promise<RoomSnapshot>
```

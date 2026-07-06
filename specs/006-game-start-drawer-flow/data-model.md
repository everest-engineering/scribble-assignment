# Data Model: Game Start and Drawer Flow

## Changes to Existing Entities

### Room (backend `models/game.ts`)

**New fields**:

| Field | Type | Description |
|-------|------|-------------|
| `currentRound` | `number` | Current round number (1-based). Default 0 in lobby, set to 1 on game start. |
| `currentDrawerId` | `string` | Participant ID of the current round's drawer. Set to host's ID on game start. |

**Changed fields**:

| Field | Change |
|-------|--------|
| `status` | New allowed value: `"drawing"` (union type `RoomStatus`) |

**Unchanged**: `code`, `hostId`, `participants`, `createdAt`, `updatedAt`

### RoomSnapshot (backend `models/game.ts` → frontend `api.ts`)

**New fields**:

| Field | Type | Description |
|-------|------|-------------|
| `currentRound` | `number` | Current round number |
| `currentDrawerId` | `string` | Participant ID of the drawer |
| `secretWord` | `string \| null` | Current round's secret word. Non-null only for the drawer participant. `null` for all others. |

**Changed fields**:

| Field | Change |
|-------|--------|
| `status` | Union type gains `"drawing"` |

### RoomStatus (backend `models/game.ts`)

```typescript
// Before:
export type RoomStatus = "lobby";
// After:
export type RoomStatus = "lobby" | "drawing";
```

### Frontend `RoomSnapshot` (frontend `api.ts`)

```typescript
// Before:
export interface RoomSnapshot {
  code: string;
  status: "lobby";
  hostId: string;
  participants: Participant[];
  availableWords: string[];
  roles: ParticipantRole[];
}
// After:
export interface RoomSnapshot {
  code: string;
  status: "lobby" | "drawing";
  hostId: string;
  participants: Participant[];
  availableWords: string[];
  roles: ParticipantRole[];
  currentRound: number;
  currentDrawerId: string;
  secretWord: string | null;
}
```

## Validation Rules

| Entity | Field | Rule |
|--------|-------|------|
| Request body | `playerName` | Must be a non-empty string after trim. Rejected with 400 if empty. |
| Room | `status` | Transition: `"lobby"` → `"drawing"` only. Cannot transition back. |
| Room | `participants` | Must have at least 2 participants to start the game. |
| Room | `currentDrawerId` | Must match a valid participant ID in the room. |

## State Transitions

```
[lobby] --(host clicks "Start Game", POST /:code/start)--> [drawing]
```

No other transitions defined for this feature scope.

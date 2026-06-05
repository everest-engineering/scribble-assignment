# Data Model: Gameplay Interaction

**Branch**: `003-gameplay-interaction` | **Date**: 2026-06-04

## New Entity: Guess

Represents a single guess submission by a guesser during an active round.

| Field | Type | Constraint |
|-------|------|-----------|
| `participantId` | `string` | UUID of the guessing participant |
| `participantName` | `string` | Display name (denormalised — avoids participant lookup on render) |
| `text` | `string` | Trimmed guess text; never empty |
| `correct` | `boolean` | `true` if `text.toLowerCase() === secretWord.toLowerCase()` |
| `submittedAt` | `string` | ISO 8601 timestamp |

**Lives in**: `backend/src/models/game.ts` and mirrored in `frontend/src/services/api.ts`

## Extended Entity: Room (backend)

Two fields added to the existing `Room` interface in `backend/src/models/game.ts`:

| Field | Type | Initialised at |
|-------|------|----------------|
| `guesses` | `Guess[]` | `startRoom` — empty array `[]` |
| `scores` | `Record<string, number>` | `startRoom` — `{ [participantId]: 0 }` for every participant |

The `scores` map is keyed by `participantId` and values increment by 100 on each correct
guess. Drawer score stays 0 (drawer is blocked from submitting via FR-015).

## Extended Entity: RoomSnapshot (both sides)

The snapshot carries the same additions so every poll delivers live state to all clients.
Added to `backend/src/models/game.ts` and `frontend/src/services/api.ts`:

| Field | Type |
|-------|------|
| `guesses` | `Guess[]` |
| `scores` | `Record<string, number>` |

`toRoomSnapshot` in `roomStore.ts` spreads these directly from the `Room` object.

## State Transitions

```
Room.status transitions to "playing"  (handled in Scenario 2 — not changed here)
  ├── Room.guesses initialised: []
  └── Room.scores initialised: { participantId: 0, ... } for all participants

POST /rooms/:code/guess  (valid non-drawer, non-empty trimmed text)
  ├── Guess appended to Room.guesses
  ├── if correct:  Room.scores[participantId] += 100
  └── Response: updated RoomSnapshot (drawer does not see secretWord in guess response)
```

## Validation Rules

| Rule | Spec Reference | Enforcement |
|------|---------------|-------------|
| `guessText` non-empty after trim | FR-004, FR-005 | Zod schema + backend check |
| Drawer cannot guess | FR-015 | Backend: `participantId === room.drawerId` → 403 |
| Room must be in `"playing"` status | Implicit | Backend: 404 if room not found; no status gate needed (room is always playing during gameplay) |

## Type Definitions (TypeScript)

```typescript
// backend/src/models/game.ts  (additions)
export interface Guess {
  participantId: string;
  participantName: string;
  text: string;
  correct: boolean;
  submittedAt: string;
}

// Room additions:
//   guesses: Guess[];
//   scores: Record<string, number>;

// RoomSnapshot additions:
//   guesses: Guess[];
//   scores: Record<string, number>;
```

```typescript
// frontend/src/services/api.ts  (mirror — identical shape)
export interface Guess {
  participantId: string;
  participantName: string;
  text: string;
  correct: boolean;
  submittedAt: string;
}

// RoomSnapshot additions:
//   guesses: Guess[];
//   scores: Record<string, number>;
```

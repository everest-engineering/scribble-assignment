# Data Model: Gameplay Interaction

**Branch**: `003-gameplay-interaction` | **Date**: 2026-06-03

## Entity Changes

### RoomStatus (shared + backend)

**Extended union** — additive change, no fields removed:

```typescript
// Before
export type RoomStatus = "lobby" | "in-progress";

// After
export type RoomStatus = "lobby" | "in-progress" | "finished";
```

Zod schema update (`shared/schemas/room.ts`):
```typescript
export const roomStatusSchema = z.enum(["lobby", "in-progress", "finished"]);
```

---

### Guess (new backend model — `backend/src/models/game.ts`)

Represents a single validated guess submission stored in-memory per room.

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| `id` | `string` | No | UUID, generated at submit time |
| `participantId` | `string` | No | ID of the guesser who submitted |
| `text` | `string` | No | Trimmed guess text as stored |
| `correct` | `boolean` | No | `true` if text matched secret word (case-insensitive) |
| `submittedAt` | `string` | No | ISO timestamp of submission |

```typescript
export interface Guess {
  id: string;
  participantId: string;
  text: string;
  correct: boolean;
  submittedAt: string;
}
```

---

### GuessSnapshot (shared wire type — `shared/schemas/room.ts`)

A sanitised view of a `Guess` for the wire — includes the guesser's display name.

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| `id` | `string` | No | Guess UUID |
| `participantId` | `string` | No | Guesser's participant ID |
| `participantName` | `string` | No | Display name resolved from `participants` array |
| `text` | `string` | No | Trimmed guess text |
| `correct` | `boolean` | No | Whether the guess was correct |
| `submittedAt` | `string` | No | ISO timestamp |

```typescript
export const guessSnapshotSchema = z.object({
  id: z.string(),
  participantId: z.string(),
  participantName: z.string(),
  text: z.string(),
  correct: z.boolean(),
  submittedAt: z.string()
});

export type GuessSnapshot = z.infer<typeof guessSnapshotSchema>;
```

---

### Room (backend model — `backend/src/models/game.ts`)

**Added fields**:

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| `canvasDataUrl` | `string \| null` | Yes | Base64 PNG data URL of current canvas state; null = empty canvas |
| `guesses` | `Guess[]` | No | Ordered list of all valid guess submissions for this round |
| `scores` | `Record<string, number>` | No | Map of `participantId → points`; initialized to 0 for all participants at start |
| `correctGuessers` | `Set<string>` | No | Set of participantIds who have guessed correctly; used to enforce FR-017 and round-end check |
| `roundStartedAt` | `string \| null` | Yes | ISO timestamp of when `startRoom()` was called; null in lobby |

```typescript
export interface Room {
  code: string;
  status: RoomStatus;
  hostId: string;
  participants: Participant[];
  createdAt: string;
  updatedAt: string;
  drawerId: string | null;
  currentWord: string | null;
  // NEW:
  canvasDataUrl: string | null;
  guesses: Guess[];
  scores: Record<string, number>;
  correctGuessers: Set<string>;
  roundStartedAt: string | null;
}
```

> **Note on `correctGuessers`**: `Set<string>` is not JSON-serialisable. `toRoomSnapshot()` must convert it — it does not appear in the wire type directly; it informs `hasGuessedCorrectly` on the snapshot (see below).

---

### RoomSnapshot (shared wire type — `shared/schemas/room.ts` + `backend/src/models/game.ts`)

**Added fields**:

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| `canvasDataUrl` | `string \| null` | Yes | Current canvas state; null = empty |
| `guesses` | `GuessSnapshot[]` | No | Full ordered guess history for this round |
| `scores` | `Record<string, number>` | No | Current scores per participantId |
| `roundEndsAt` | `string \| null` | Yes | ISO timestamp of when the round expires; null in lobby/finished |
| `hasGuessedCorrectly` | `boolean` | No | True if the viewing participant has already guessed correctly this round |

```typescript
export const roomSnapshotSchema = z.object({
  code: z.string(),
  status: roomStatusSchema,
  hostId: z.string(),
  participants: z.array(participantSnapshotSchema),
  availableWords: z.array(z.string()),
  roles: z.array(participantRoleSchema),
  drawerId: z.string().nullable(),
  currentWord: z.string().nullable(),
  // NEW:
  canvasDataUrl: z.string().nullable(),
  guesses: z.array(guessSnapshotSchema),
  scores: z.record(z.string(), z.number()),
  roundEndsAt: z.string().nullable(),
  hasGuessedCorrectly: z.boolean()
});
```

---

## State Transitions

```
createRoom()
  └─► Room {
        status: "lobby",
        drawerId: null, currentWord: null,
        canvasDataUrl: null,
        guesses: [],
        scores: {},
        correctGuessers: new Set(),
        roundStartedAt: null
      }

joinRoom()
  └─► Room (unchanged gameplay fields; scores not yet initialized)

startRoom(code, participantId)
  Validations (unchanged from feature 002):
    1. room exists           → not_found (404)
    2. participantId = host  → not_host  (403)
    3. status = "lobby"      → already_started (409)
    4. participants ≥ 2      → too_few_players (400)
  On success:
  └─► Room {
        status: "in-progress",
        drawerId: hostId,
        currentWord: STARTER_WORDS[0],
        canvasDataUrl: null,
        guesses: [],
        scores: { [p.id]: 0 for each participant },
        correctGuessers: new Set(),
        roundStartedAt: now()
      }

updateCanvas(code, participantId, canvasDataUrl)
  Validations:
    1. room exists           → not_found
    2. status = "in-progress" (with lazy expiry check) → not_active
    3. participantId = drawerId → not_drawer (403)
  On success: room.canvasDataUrl = canvasDataUrl

clearCanvas(code, participantId)
  Validations:
    1. room exists           → not_found
    2. status = "in-progress" (with lazy expiry check) → not_active
    3. participantId = drawerId → not_drawer (403)
  On success: room.canvasDataUrl = null

submitGuess(code, participantId, text)
  Validations:
    1. room exists           → not_found
    2. status = "in-progress" (with lazy expiry check) → not_active
    3. participantId ≠ drawerId → is_drawer (403)
    4. text.trim().length > 0 → empty_guess (400)
    5. participantId not in correctGuessers → already_correct (409)
  Processing:
    trimmed = text.trim()
    correct = trimmed.toLowerCase() === room.currentWord!.toLowerCase()
    if correct: room.scores[participantId] += 100; room.correctGuessers.add(participantId)
    room.guesses.push({ id: uuid, participantId, text: trimmed, correct, submittedAt: now() })
  Post-check (all-correct end condition):
    if (room.correctGuessers.size === room.participants.length - 1)
      → room.status = "finished"

checkRoundExpiry(room)  [internal helper, called before every mutating operation]
  if (room.status === "in-progress" && now > roundStartedAt + ROUND_DURATION_SECONDS)
    → room.status = "finished"
```

---

## Scoring Rule

```
correct guess   → +100 points (room.scores[participantId] += 100)
incorrect guess → +0 points   (no mutation to scores)
```

Scoring is applied exactly once per correct guess. A guesser who has already guessed correctly cannot submit again (FR-017), enforced by the `correctGuessers` guard before scoring.

---

## Round End Triggers

A round transitions from `"in-progress"` to `"finished"` when **either** condition is first satisfied:

1. **Time expiry**: `now() > roundStartedAt + ROUND_DURATION_SECONDS` — checked lazily in `checkRoundExpiry()`.
2. **All guessers correct**: `correctGuessers.size === participants.length - 1` — checked in `submitGuess()` after recording the guess.

---

## Snapshot Computation Rules (`toRoomSnapshot`)

| Field | Rule |
|-------|------|
| `canvasDataUrl` | Pass through `room.canvasDataUrl` as-is (all players see the canvas) |
| `guesses` | Map `room.guesses` to `GuessSnapshot` by resolving `participantName` from `room.participants` |
| `scores` | Pass through `room.scores` as-is |
| `roundEndsAt` | `room.roundStartedAt ? new Date(Date.parse(room.roundStartedAt) + ROUND_DURATION_SECONDS * 1000).toISOString() : null` |
| `hasGuessedCorrectly` | `room.correctGuessers.has(viewerParticipantId ?? "")` |
| `currentWord` | Unchanged from feature 002: only non-null for the drawer's client |

---

## Seed Constants (additions to `backend/src/seed/starterData.ts`)

```typescript
export const ROUND_DURATION_SECONDS = 90;
```

---

## No Persistence

All new fields remain in the in-memory `Map<string, Room>`. `correctGuessers` is a `Set<string>` — a standard JS data structure requiring no serialisation layer. Consistent with Constitution Principle V.

# Data Model: Scribble Drawing Game

**Branch**: `001-scribble-game` | **Date**: 2026-06-04

## Entities

### Room

Stored in `backend/src/models/game.ts`. All fields live in the in-memory `Map<string, Room>`.

| Field | Type | Description |
|-------|------|-------------|
| `code` | `string` | 4-char unique room code (A-Z, 2-9, no ambiguous chars) |
| `status` | `"lobby" \| "playing" \| "result"` | Current lifecycle state |
| `hostId` | `string` | participantId of the room creator; never changes |
| `participants` | `Participant[]` | Ordered list; `participants[0]` is always the drawer |
| `drawer` | `string \| undefined` | participantId of the active drawer; set on start |
| `secretWord` | `string \| undefined` | Selected word; set on start |
| `canvasData` | `string \| undefined` | Base64 PNG data URL; updated on each stroke end |
| `guesses` | `Guess[]` | Append-only guess history; ordered by submission time |
| `scores` | `Record<string, number>` | participantId → cumulative score for this round |
| `createdAt` | `string` | ISO timestamp |
| `updatedAt` | `string` | ISO timestamp; updated on every mutation |

**State transitions**:
```
lobby → playing  (startGame — host only, ≥2 players)
playing → result (endGame — host only)
result → lobby   (restartGame — host only; resets drawer/word/canvas/guesses/scores)
```

**Invariants**:
- `hostId` is set once at creation and never mutated
- `participants[0]` is always the creator; join appends to the end
- Scores map initialised to `{participantId: 0}` for all participants on `startGame`
- After `restartGame`: `drawer=undefined`, `secretWord=undefined`, `canvasData=undefined`,
  `guesses=[]`, `scores={}` — participants and `hostId` unchanged

---

### Participant

Embedded in `Room.participants[]`. No standalone storage.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | UUID v4, generated on join/create |
| `name` | `string` | Trimmed, non-empty player name |
| `joinedAt` | `string` | ISO timestamp |

**Validation**: `name` must be `.trim().min(1)` — enforced by Zod at API boundary and
client-side guard before submission.

---

### Guess

Embedded in `Room.guesses[]`. Append-only; never mutated after insertion.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | UUID v4 |
| `participantId` | `string` | Who submitted the guess |
| `playerName` | `string` | Denormalised name at time of guess |
| `text` | `string` | Trimmed guess text |
| `correct` | `boolean` | True if trimmed text matches secretWord case-insensitively |
| `timestamp` | `string` | ISO timestamp |

**Scoring rule**: `correct && !room.guesses.some(g => g.participantId === id && g.correct)`
→ `room.scores[participantId] += 100`. Exactly one scoring event per player per round.

---

### RoomSnapshot (API projection)

The client-facing shape returned by all endpoints. Defined in both
`backend/src/models/game.ts` and mirrored in `frontend/src/services/api.ts`.

| Field | Type | Visibility |
|-------|------|-----------|
| `code` | `string` | Always |
| `status` | `"lobby" \| "playing" \| "result"` | Always |
| `hostId` | `string` | Always |
| `participants` | `Participant[]` | Always |
| `availableWords` | `string[]` | Always (starter list) |
| `roles` | `ParticipantRole[]` | Always (starter roles) |
| `drawer` | `string \| undefined` | Always when set |
| `secretWord` | `string \| undefined` | Only if viewer is drawer **or** status is "result" |
| `canvasData` | `string \| undefined` | Always when set |
| `guesses` | `Guess[]` | Always |
| `scores` | `Record<string, number>` | Always |

---

## Validation Rules

| Rule | Location | Enforcement |
|------|----------|-------------|
| Player name non-empty after trim | Client + Zod schema | Client guard + `z.string().trim().min(1)` |
| Room code 4 chars, valid charset | `generateUniqueCode()` | Generated, not user-supplied |
| Guess text non-empty after trim | Client + service layer | Client guard + `if (!trimmed) throw HttpError(400)` |
| Start requires ≥2 participants | `startGame()` | `throw HttpError(400)` |
| Start/end/restart caller must be host | All mutating services | `if (room.hostId !== requesterId) throw HttpError(403)` |
| Drawer cannot guess | `submitGuess()` | `if (room.drawer === participantId) throw HttpError(403)` |
| No double-scoring per player per round | `submitGuess()` | Guard on prior correct guess in `room.guesses` |

# Phase 1 Data Model: Gameplay Interaction

In-memory only (no persistence). Types live in `backend/src/models/game.ts`; the frontend mirrors the
snapshot shape in `frontend/src/services/api.ts`. Extends the Group 2 model.

## Entities

### StrokePoint / Stroke (NEW)

| Field | Type | Notes |
|-------|------|-------|
| `StrokePoint.x` | `number` | Canvas x coordinate |
| `StrokePoint.y` | `number` | Canvas y coordinate |
| `Stroke.points` | `StrokePoint[]` | Ordered points of one completed stroke (≥1, capped at a max) |

### GuessRecord (NEW)

| Field | Type | Notes |
|-------|------|-------|
| `participantId` | `string` | Who guessed |
| `name` | `string` | Denormalized display name for history rendering |
| `guess` | `string` | Trimmed text (original casing kept for display) |
| `correct` | `boolean` | Result of case-insensitive comparison to the secret word |
| `at` | `string` (ISO) | Timestamp; also provides submission ordering |

### RoundState (extended)

| Field | Type | Notes |
|-------|------|-------|
| `drawerId` | `string` | From Group 2 |
| `secretWord` | `string` | From Group 2 (drawer-only in snapshot) |
| `roles` | `Record<string, ParticipantRole>` | From Group 2 |
| `strokes` | `Stroke[]` | **NEW** — append-only canvas strokes |
| `guesses` | `GuessRecord[]` | **NEW** — append-only, ordered |
| `scores` | `Record<string, number>` | **NEW** — participantId → score; every participant starts at 0 |
| `ended` | `boolean` | **NEW** — false until the first correct guess |

### Room (unchanged shape)

`status` stays `"lobby" | "started"`; gameplay state lives entirely on `round` (added Group 2).

### RoomSnapshot (extended — viewer-specific)

| Field | Type | Notes |
|-------|------|-------|
| ...existing | | `code`, `status`, `hostId`, `drawerId`, `availableWords`, `roles`, `secretWord?` |
| `participants` | `Array<… & { isHost; role; score }>` | **NEW** `score` per participant (0 in lobby) |
| `strokes` | `Stroke[]` | **NEW** — visible to all (not secret) |
| `guesses` | `GuessRecord[]` | **NEW** — visible to all |
| `roundEnded` | `boolean` | **NEW** — `round?.ended ?? false` |
| `secretWord` | `string` (optional) | Unchanged — drawer-only (Group 2) |

## Validation Rules

| Rule | Where | Requirement |
|------|-------|-------------|
| Stroke has ≥1 point, ≤ max points | Edge (`strokeSchema`) | FR-036 (size guard) |
| Draw/clear allowed only for drawer | `addStroke`/`clearCanvas` | FR-033, FR-035, SC-006 |
| Draw/clear rejected after `ended` | `addStroke`/`clearCanvas` | FR-035, FR-042 |
| Guess required, trimmed, non-empty | Edge (`guessSchema`) | FR-038, FR-039 |
| Guess accepted only while not ended | `submitGuess` | FR-037, FR-042 |
| Drawer cannot guess | `submitGuess` | FR-037 (guesser-only), SC-006 |
| Compare trimmed + case-insensitive | `gameRules.isCorrectGuess` | FR-039 |
| Score start 0; correct +100; incorrect +0 | `gameRules` + `submitGuess` | FR-040 |
| First correct sets `ended = true` | `submitGuess` | FR-042 |
| Pure, testable rules | `gameRules.ts` | FR-043 |
| Snapshot exposes strokes/guesses/scores | `toRoomSnapshot` | FR-036, FR-041, FR-046, FR-047 |

## State Transitions (round.ended)

```text
   start (Group 2)
   ──────────────▶  round.ended = false   (strokes/guesses empty, scores all 0)
                          │
                          │ first correct guess (POST /rooms/:code/guess)
                          ▼
                    round.ended = true     (draw/clear/guess now rejected)
```

- Incorrect guesses and strokes keep `ended = false`.
- No transition back to active in this group (restart is Group 4).
- `Room.status` remains `"started"` throughout.

## Store result shapes

```typescript
type StrokeResult =
  | { ok: true; room: Room }
  | { ok: false; reason: "not-found" | "forbidden" | "round-ended" };

type GuessResult =
  | { ok: true; room: Room; correct: boolean }
  | { ok: false; reason: "not-found" | "forbidden" | "round-ended" };
```

Route handlers map `reason` → 404 / 403 / 409.

## Isolation Invariant

For any two rooms A and B with distinct codes: strokes/guesses/scores/`ended` changes on A leave B's
`round` unchanged. Enforced by the keyed `Map` and covered by a unit test (SC-005).

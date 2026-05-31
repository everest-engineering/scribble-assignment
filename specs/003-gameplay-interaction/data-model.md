# Data Model: Gameplay Interaction

**Feature**: `003-gameplay-interaction` | **Date**: 2026-05-31

## Prerequisites (from Scenarios 1–2)

These fields MUST exist before Scenario 3; extend if missing on the branch:

| Field | Type | Notes |
|-------|------|-------|
| `hostId` | `string` | Room creator |
| `status` | `"lobby" \| "playing"` | Gameplay only when `playing` |
| `drawerId` | `string \| null` | Set at round start |
| `secretWord` | `string \| null` | Server-only; filtered in snapshot for guessers |
| `scores` | `Record<string, number>` | Participant id → points; 0 at round start |

## New / Extended Entities

### Stroke

Represents one continuous draw path from pointer down to pointer up.

| Field | Type | Validation |
|-------|------|------------|
| `id` | `string` | UUID; client or server generated |
| `color` | `string` | Non-empty; default `#111827` |
| `width` | `number` | Positive; default `4` |
| `points` | `Point[]` | Min 1 point; each point `{ x: number, y: number }` |

### Point

| Field | Type | Validation |
|-------|------|------------|
| `x` | `number` | Finite; canvas logical coords |
| `y` | `number` | Finite; canvas logical coords |

### Guess

| Field | Type | Validation |
|-------|------|------------|
| `id` | `string` | UUID |
| `participantId` | `string` | Must exist in room |
| `participantName` | `string` | Denormalized for history display |
| `text` | `string` | Trimmed; min length 1 |
| `correct` | `boolean` | From case-insensitive word compare |
| `submittedAt` | `string` | ISO timestamp |

## Room Extensions

| Field | Type | When set | Cleared on restart (Scenario 4) |
|-------|------|----------|----------------------------------|
| `strokes` | `Stroke[]` | Empty at round start; grows as drawer draws | Yes |
| `guesses` | `Guess[]` | Empty at round start; grows on submissions | Yes |

`scores` and `guesses` update during gameplay; `strokes` replace entirely on clear.

## RoomSnapshot Extensions

Included in `GET /rooms/:code` for all viewers when `status === "playing"`:

| Field | Type | Visibility |
|-------|------|------------|
| `drawerId` | `string \| null` | All |
| `scores` | `Record<string, number>` | All |
| `strokes` | `Stroke[]` | All |
| `guesses` | `Guess[]` | All |
| `secretWord` | `string` | Drawer viewer only (Scenario 2 rule) |

When `status === "lobby"`, omit gameplay fields or use empty defaults; keep `availableWords` for lobby.

## State Transitions (relevant slice)

```text
lobby ──(host startGame)──► playing
                              │
                              ├── drawer appends strokes / clears strokes
                              ├── guessers submit guesses
                              └── (Scenario 4) ──► result
```

Scenario 3 does **not** transition out of `playing`.

## Validation Rules Summary

| Action | Preconditions |
|--------|----------------|
| Append stroke | `status === playing`, caller is `drawerId` |
| Clear strokes | `status === playing`, caller is `drawerId` |
| Submit guess | `status === playing`, caller is participant, caller ≠ `drawerId`, guess trim non-empty |

## Scoring Rule

```text
correct = guess.trim().toLowerCase() === secretWord.toLowerCase()
if correct: scores[participantId] += 100
else: scores unchanged
```

Always append guess record regardless of correctness.

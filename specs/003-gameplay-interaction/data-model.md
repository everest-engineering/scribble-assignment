# Phase 1 Data Model: Gameplay Interaction

In-memory only. Source of truth is `Map<string, Room>` in `backend/src/services/roomStore.ts`.
**Bold** marks fields added or changed by this feature.

## Entity: Guess (NEW, backend internal)

| Field | Type | Notes |
|-------|------|-------|
| `id` | `string` (UUID) | Unique guess id. |
| `participantId` | `string` | The guesser who submitted it. |
| `participantName` | `string` | Display name at submission time. |
| `correct` | `boolean` | `normalize(text) === normalize(secretWord)`. |
| `text` | `string` | The raw guess. **Withheld from non-drawer non-authors in snapshots when `correct`.** |
| `createdAt` | `string` (ISO) | Submission time; array order is the source of truth for ordering. |

`normalize = (s) => s.trim().toLowerCase()`.

## Entity: Room (backend internal)

| Field | Type | Notes |
|-------|------|-------|
| `code`, `status`, `participants`, `hostId`, `drawerId`, `secretWord` | — | From Scenarios 1–2. |
| **`guesses`** | **`Guess[]`** | **NEW. Ordered guess history; emptied at round start.** |
| **`scores`** | **`Record<string, number>`** | **NEW. participantId → points; all `0` at round start.** |
| **`drawing`** | **`string \| null`** | **NEW (amended 2026-06-05). The drawer's serialized canvas image; `null` when empty/cleared; reset to `null` at round start.** |
| `createdAt`, `updatedAt` | `string` | Unchanged (`updatedAt` bumped on guess/drawing). |

### Invariants

- At `startRound`: `guesses = []` and `scores[p.id] = 0` for every participant `p`.
- `0 <= scores[id] <= 100`; a participant's score is `0` or `100` (never partial, never >100).
- The drawer never appears as the author of a guess.
- `guesses` is append-only within a round; order reflects submission order.

## Snapshot types

### GuessView (per viewer)

| Field | Type | Notes |
|-------|------|-------|
| `id`, `participantId`, `participantName`, `correct`, `createdAt` | — | As stored. |
| **`text`** | **`string \| null`** | **`null` when `correct && !isDrawer && viewerId !== participantId`; else the text.** |

### ScoreView

| Field | Type | Notes |
|-------|------|-------|
| `participantId` | `string` | |
| `name` | `string` | Participant display name. |
| `score` | `number` | `0` or `100`. |

## Entity: RoomSnapshot (additions)

| Field | Type | Notes |
|-------|------|-------|
| …Scenario 1–2 fields… | — | `status`, `hostId`, `isHost`, `canStart`, `drawerId`, `isDrawer`, `secretWord`, … |
| **`guesses`** | **`GuessView[]`** | **NEW. Per-viewer history (correct-guess text stripped for others).** |
| **`scores`** | **`ScoreView[]`** | **NEW. Every participant's score for the round.** |
| **`drawing`** | **`string \| null`** | **NEW (amended 2026-06-05). The current drawing, visible to all viewers (drawer and guessers).** |

## Derived values

| Value | Formula | Used by |
|-------|---------|---------|
| guess correctness | `normalize(text) === normalize(room.secretWord)` | scoring, history flag |
| score award | `correct && scores[pid] < 100 ? 100 : scores[pid]` | scoreboard |
| visible guess text | `(correct && !isDrawer && viewer !== author) ? null : text` | history rendering |

## State transitions

```text
playing --submitGuess(guesser, text)-->  playing
   append Guess{ correct }
   if correct and scores[guesser] < 100: scores[guesser] = 100

playing --updateDrawing(drawer, image|null)-->  playing
   room.drawing = image (or null on clear)

Guess rejected (no change) when:
   - status != "playing"
   - participantId is the drawer
   - participantId is not a participant
   - text is empty/whitespace after trim

Drawing update rejected (no change) when:
   - status != "playing"
   - participantId != room.drawerId
```

`guesses`, `scores`, and `drawing` are reset by `startRound` (round start: history empty, scores
`0`, drawing `null`). Clearing them on restart back to the lobby is Scenario 4.

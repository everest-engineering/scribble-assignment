# Phase 1 Data Model: Active Round Drawing, Guessing & Scoring

Types live in `backend/src/models/game.ts`; the in-memory store, scoring, and snapshot projection in `backend/src/services/roomStore.ts`; the pure correctness check in `backend/src/services/guessEvaluation.ts`. Frontend mirrors the snapshot in `frontend/src/services/api.ts`. **No persistence** — single `Map<code, Room>` cleared on restart. Builds on feature 002's model.

## Constants

```ts
// Existing — unchanged
const MAX_PLAYERS = 8;
const PRESENCE_TIMEOUT_MS = 10_000;
const POLL_INTERVAL_MS = 2_000;        // frontend (now also used by GamePage)

// This feature
const CORRECT_GUESS_POINTS = 100;      // FR-005
```

## Entities

### Guess  *(NEW)*

One submission by a player during the active round. Stored on `Round.guesses` in submission order.

| Field | Type | Notes |
|-------|------|-------|
| `id` | `string` (UUID) | Stable key for ordered rendering. |
| `playerId` | `string` | Submitting participant's id. |
| `playerName` | `string` | Snapshotted at submit time (robust if the player is later pruned). |
| `text` | `string` | The **trimmed** guess text (verbatim, server-side). |
| `correct` | `boolean` | Result of `isCorrect(text, round.word)`. |
| `createdAt` | `string` (ISO) | Submission time; defines chronological order (FR-010). |

### Round  *(MODIFY)*

| Field | Type | New? | Notes |
|-------|------|------|-------|
| `number` | `number` | existing | `1` this increment. |
| `drawerId` | `string` | existing | Drawer; not a scoring guesser (FR-014). |
| `word` | `string` | existing | Secret word (drawer-only projection from 002). Compared against guesses. |
| `guesses` | `Guess[]` | **NEW** | Ordered guess history (append-only this round). FR-008, FR-010 |
| `correctPlayerIds` | `string[]` | **NEW** | Players who have already scored this round; enforces the once-per-round 100 award. FR-007 |

### Participant  *(MODIFY)*

| Field | Type | New? | Notes |
|-------|------|------|-------|
| `id` | `string` (UUID) | existing | Session identity (no auth). |
| `name` | `string` | existing | Trimmed, non-empty (feature 002). |
| `joinedAt` / `lastSeenAt` | `string` (ISO) | existing | Presence (feature 001). |
| `score` | `number` | **NEW** | Points this game. Created as `0`; **reset to `0` for all participants on `startGame`** (FR-006); `+100` on first correct guess (FR-005, FR-007). |

### RoundSnapshot  *(MODIFY — viewer-aware)*

| Field | Type | Sent to | Notes |
|-------|------|---------|-------|
| `number` | `number` | everyone | Unchanged (002). |
| `drawerId` | `string` | everyone | Unchanged (002). |
| `wordLength` | `number` | everyone | Unchanged (002). |
| `maskedWord` | `string` | everyone | Unchanged (002). |
| `word` | `string?` | drawer only | Unchanged (002) — secrecy invariant preserved. |
| `guesses` | `GuessSnapshot[]` | everyone | **NEW** — ordered history; correct entries masked (see below). FR-008, FR-010, FR-011 |

### GuessSnapshot  *(NEW — what clients receive per guess)*

| Field | Type | Present when | Notes |
|-------|------|--------------|-------|
| `id` | `string` | always | Render key. |
| `playerId` | `string` | always | Lets a client detect its own correct guess (disable input). |
| `playerName` | `string` | always | Shown in the feed. |
| `correct` | `boolean` | always | Drives "guessed the word!" vs. verbatim text. |
| `text` | `string?` | **only when `correct === false`** | Incorrect guesses show verbatim; correct guesses **omit** `text` entirely. FR-011 |

> **Secrecy invariant (FR-011, SC-008)**: for a correct guess the `text` key is **absent** from every viewer's snapshot — not blanked in a recoverable way — so the secret word can never be recovered from the guess feed. `Participant.score` is public to all (a scoreboard is shared).

### RoomSnapshot

`participants[].score` now travels in the existing `participants` array (no new top-level field). `round` carries the new `guesses`. Everything else unchanged from feature 002.

## Guess Evaluation (`guessEvaluation.ts`)

```ts
// Pure, deterministic. Trim + case-insensitive exact match (FR-002, FR-004).
export function normalizeGuess(text: string): string {
  return text.trim().toLowerCase();
}

export function isCorrect(text: string, word: string): boolean {
  return normalizeGuess(text) === normalizeGuess(word);
}
```

## Validation & Scoring Rules

| Rule | Where | FR |
|------|-------|----|
| Guess text trimmed before evaluation | Server `schemas` (`.trim()`) + route | FR-002 |
| Empty/whitespace-only guess → **reject** `400`, not recorded, not scored | Server route (`POST .../guess`) | FR-003 |
| Guess accepted only while a round is in progress | Server `submitGuess` → `409` if `status !== "playing"` / no round | FR-001 |
| Drawer may not score (guess rejected) | Server `submitGuess` → `403` if `participantId === round.drawerId` | FR-014 |
| Correct = trimmed, case-insensitive equality to `round.word` | `guessEvaluation.isCorrect` | FR-004 |
| Correct guess → `+100`; incorrect → `+0` | Server `submitGuess` | FR-005 |
| 100 awarded at most once per player per round | Server checks `round.correctPlayerIds` before awarding | FR-007 |
| Scores initialized to 0 for all at round start | Server `startGame` sets every `participant.score = 0` | FR-006 |
| Every accepted guess appended to ordered history | Server pushes to `round.guesses` | FR-008, FR-010 |
| Correct guesses masked (no `text`) in snapshot | Server `toRoundSnapshot` | FR-011 |
| Canvas strokes/clear render on drawer's screen; not synced | Frontend `Canvas.tsx` (drawer-local) | FR-012, FR-013, FR-015 |

## Guess / Score Flow

```text
guesser types text → POST /rooms/:code/guess { participantId, text }
        │
        ├─ trim(text) empty?            → 400 "Please enter a guess."        (FR-003; not recorded)
        ├─ room not playing / no round? → 409 "The round is not active."     (FR-001)
        ├─ participantId == drawerId?   → 403 "The drawer cannot guess."     (FR-014)
        │
        ▼ evaluate isCorrect(text, round.word)              (FR-004)
   correct?
     ├─ yes & id NOT in correctPlayerIds → participant.score += 100;         (FR-005, FR-007)
     │                                     correctPlayerIds.push(id)
     ├─ yes & id already in list         → no extra points                  (FR-007)
     └─ no                               → no points                        (FR-005)
        │
        ▼ round.guesses.push({ id, playerId, playerName, text, correct, createdAt })   (FR-008, FR-010)
        ▼ return viewer-aware snapshot (correct guesses masked)              (FR-011)

other players' next GET /rooms/:code poll (~2s) → same guesses + scores      (FR-009, SC-004)
round stays "playing" after a correct guess — others keep scoring           (FR-016)
```

## State Transitions

| From | Event | Guard | To / Effect | FR |
|------|-------|-------|-------------|----|
| `playing` | `startGame` (from 002) | host, ≥2 players | create round; **set all `participant.score = 0`** | FR-006 |
| `playing` | `submitGuess` (guesser, non-empty) | round active, not drawer | append guess; if first correct → `+100` | FR-005, FR-007, FR-008 |
| `playing` | `submitGuess` (empty) | — | `400`; no record, no score | FR-003 |
| `playing` | `submitGuess` (drawer) | — | `403`; no record, no score | FR-014 |
| `playing` | correct guess | any | round **stays** `playing` | FR-016 |
| `playing` | poll by any viewer | — | snapshot: scores + masked guess history | FR-009, FR-011 |

## Traceability (FR → artifact)

| FR | Covered by |
|----|-----------|
| FR-001 | `submitGuess` rejects when not `playing` / no round (`409`) |
| FR-002 | `schemas` trim + `normalizeGuess` |
| FR-003 | route rejects empty (`400`), not recorded |
| FR-004 | `guessEvaluation.isCorrect` (case-insensitive) |
| FR-005 | `+100` correct / `+0` incorrect |
| FR-006 | `startGame` resets all `score = 0` |
| FR-007 | `round.correctPlayerIds` guard |
| FR-008 | `round.guesses` append |
| FR-009 | existing GET poll + new `GamePage` poll loop |
| FR-010 | `guesses` ordered by `createdAt`, same array for all |
| FR-011 | `toRoundSnapshot` omits `text` for correct guesses |
| FR-012 | `Canvas.tsx` renders strokes on drawer's screen |
| FR-013 | `Canvas.tsx` Clear button |
| FR-014 | `submitGuess` `403` for drawer; drawer never in `correctPlayerIds` |
| FR-015 | canvas drawer-local; no server/guesser sync |
| FR-016 | no round-end logic; stays `playing` |

# Data Model: Result, Restart & Final Validation

New and extended entities alongside existing `Room`, `Participant`, `RoomSnapshot`, and spec 003 types (`Stroke`, `Guess`, `CanvasState`).

## Room (extended fields)

| Field | Type | Notes |
|-------|------|-------|
| `status` | `"lobby" \| "playing" \| "round_end" \| "game_over"` | **CHANGED** — replaces `"playing" \| "finished"` from spec 001/003. `"finished"` is no longer used. |
| `roundCounter` | `number` | **NEW** — tracks current round number (0 = no rounds started yet; incremented on each Start New Round) |
| `maxRounds` | `number` | **NEW** — set to `participants.length` when the first round starts |
| `currentDrawerIndex` | `number` | **NEW** — index into `participants` array for current drawer. Advances by 1 each round. |
| `wordIndex` | `number` | **NEW** — index into the starter word list for word selection. Advances by 1 each round (with skip-back guard). |
| `scores` | `Map<string, number>` | Existing from spec 003 — cumulative across all rounds |
| `guessLog` | `Guess[]` | Existing from spec 003 — reset on each new round |
| `roundEnded` | `boolean` | Existing from spec 003 — `true` when current round has ended |

### State Transitions

```
                ┌──────────────────────────────────────────┐
                │                                          │
                ▼                                          │
  lobby ──[host: Start New Round]──► playing ──[round ends]──► round_end
                                     ▲                          │
                                     │        ┌─────────────────┤
                                     │        │ (not final      │ (final round)
                                     │        │  round)         │
                                     │        ▼                 ▼
                                     │    lobby            game_over
                                     └──────[host: Start New Round]──┘
```

Conditions:
- `lobby → playing`: gated by `roundCounter < maxRounds`. Host-only.
- `playing → round_end`: triggered by all guessers correct or host ends round.
- `round_end → lobby`: host clicks "Back to Lobby". Only available when `roundCounter < maxRounds`.
- `round_end → game_over`: automatic when `roundCounter >= maxRounds`. No host action needed — results screen shows standings directly.
- `game_over`: terminal state. No transitions out. Participants can only leave.

## RoundResult

Computed at round-end time. Not stored as a separate entity — derived from snapshot data.

```typescript
interface RoundResult {
  secretWord: string;
  scores: Record<string, number>;     // cumulative scores at round end
  roundScores: Record<string, number>; // points earned in this round only
  correctGuessers: string[];          // participantIds who guessed correctly
  allCorrect: boolean;                // true if all guessers guessed correctly
  endedEarly: boolean;                // true if host ended round early
  roundNumber: number;                // which round this was (1-indexed)
}
```

| Field | Source |
|-------|--------|
| `secretWord` | Room's secret word for the current round |
| `scores` | Room's cumulative scores map (converted to Record) |
| `roundScores` | Computed: each guesser who got it correct gets +100; others 0 |
| `correctGuessers` | Filtered from `guessLog` where `correct === true`, deduplicated |
| `allCorrect` | `correctGuessers.length >= guessers.length` (all non-drawer participants) |
| `endedEarly` | `true` if round ended via host action (not all-correct condition) |
| `roundNumber` | `room.roundCounter` value at the time of round end |

## FinalStandings

Computed at `game_over` time. Included in room snapshot when `status === "game_over"`.

```typescript
interface FinalStanding {
  participantId: string;
  name: string;
  score: number;
  rank: number;     // 1 = highest score (winner)
}
```

| Field | Notes |
|-------|-------|
| `rank` | 1-indexed. Ties get the same rank (e.g., two participants at 300 points → both rank 1). |
| `score` | Cumulative score across all rounds |

Sorting: descending by score. Ties broken by join order (earlier joiner ranks higher).

## RoomSnapshot (extended fields)

| Field | Type | Visible When |
|-------|------|--------------|
| `status` | `string` | Always |
| `roundCounter` | `number` | Always |
| `maxRounds` | `number` | Always |
| `scores` | `Record<string, number>` | `status === "playing" \| "round_end"` |
| `guessLog` | `Guess[]` | `status === "playing" \| "round_end"` |
| `secretWord` | `string?` | `status === "round_end" \| "game_over"` (all); `status === "playing"` (drawer only) |
| `roundResult` | `RoundResult?` | `status === "round_end"` — includes round-specific details |
| `finalStandings` | `FinalStanding[]?` | `status === "game_over"` |
| `hostId` | `string` | Always |
| `participants` | `Participant[]` | Always |
| `drawerId` | `string?` | `status === "playing"` — the current drawer |

## Validation Rules

| FR | Rule |
|----|------|
| FR-001 | Round end transitions `status` to `"round_end"`. `roundResult` computed from current round state. |
| FR-003 | `POST /return-to-lobby`: requester must be `hostId`. Room must be `"round_end"`. `roundCounter < maxRounds`. Sets `status = "lobby"`. |
| FR-006 | `POST /start-round`: requester must be `hostId`. Room must be `"lobby"`. `roundCounter < maxRounds`. Increments `roundCounter`. Advances `currentDrawerIndex`. Advances `wordIndex`. Resets per-round state. Sets `status = "playing"`. |
| FR-007 | `nextDrawerIndex = (currentDrawerIndex + 1) % participants.length`. Participant at that index becomes drawer. |
| FR-008 | `nextWordIndex = (wordIndex + 1) % WORDS.length`. If word at `nextWordIndex` equals previous word, advance by 1 (wrap if needed). |
| FR-009 | On new round: clear `guessLog`, clear canvas state, reset `roundEnded` to `false`. `scores` (cumulative) unchanged. |
| FR-010 | `POST /leave`: participant removed from `participants`. If participant was `hostId`, reassign host. |
| FR-011 | Host reassignment: `hostId = remainingParticipants.sort(by joinedAt)[0]`. |
| FR-012 | `start-round` rejected if `roundCounter >= maxRounds` or `participants.length < 2`. |
| FR-014 | `start-round` rejected if `roundCounter + 1 > maxRounds`. |
| FR-015 | On final round end (`roundCounter >= maxRounds`), set `status = "game_over"`. Compute `finalStandings` from `scores`. |
| FR-016 | `POST /leave` or `POST /join` rejected if `status !== "lobby"` before first round. `POST /join` rejected if `status !== "lobby"` at any point. |

# Phase 1 Data Model — Gameplay Interaction

Extends the model from features 001 + 002. **No fields are removed or renamed.** New fields are additive.

## Entities

### Guess (new)

A single submission attempt by a participant within a round.

| Field | Type | Notes |
|---|---|---|
| `id` | `string` | UUID v4, server-generated at submission time. |
| `participantId` | `string` | The submitter. MUST be a current participant of the room. |
| `displayName` | `string` | Snapshot of `Participant.name` at submission time (cheap denormalisation; avoids needing a join on the client). |
| `text` | `string` | The **trimmed** original-cased text. Length ∈ [1, 50]. |
| `isCorrect` | `boolean` | `true` iff `text.toLowerCase() === round.secretWord.toLowerCase()`. |
| `submittedAt` | `string` | ISO-8601 timestamp. |

### GuessView (new — wire type)

```ts
interface GuessView {
  id: string;
  participantId: string;
  displayName: string;
  text: string;          // trimmed, original casing
  isCorrect: boolean;
  submittedAt: string;
}
```

Structurally identical to `Guess` at the moment. Kept as a distinct alias so that future changes can omit fields per-viewer without rippling through the server type.

### Round (extended)

| Field | Type | Source | Notes |
|---|---|---|---|
| `roundNumber` | `number` | feature 002 | Unchanged. |
| `drawerParticipantId` | `string` | feature 002 | Unchanged. |
| `secretWord` | `string` | feature 002 | Unchanged. |
| `guesses` | `Guess[]` | **NEW** | Ordered oldest → newest. Append-only within a round. |
| `scores` | `Record<string, number>` | **NEW** | Keyed by `participantId`. Initialised to `0` for every current participant at the moment the round starts. |
| `lockedParticipantIds` | `string[]` | **NEW** | Participants who have already guessed correctly this round and may not guess again. Maintained as a plain array (not a `Set`) for JSON serialisability. |

### RoundView (extended — wire type)

```ts
interface RoundView {
  // feature 002
  roundNumber: number;
  drawerParticipantId: string;
  maskedWord: string;
  secretWord?: string;          // drawer-only
  // feature 003
  guesses: GuessView[];
  scores: Record<string, number>;
  lockedParticipantIds: string[];
}
```

The cleartext `secretWord` rule from feature 002 is unchanged: present only on the drawer's payload.

### RoomSnapshot

No new top-level fields. The three new pieces of state live inside `RoundView` so they vanish naturally when a round ends.

## State transitions

```text
                   startRoom (feature 002)
lobby ────────────────────────────────────▶ round
                                              │
                                              │ submitGuess(eligible, incorrect)
                                              │   ─▶ append to guesses; scores unchanged
                                              │
                                              │ submitGuess(eligible, correct)
                                              │   ─▶ append to guesses
                                              │   ─▶ scores[pid] += 100
                                              │   ─▶ lockedParticipantIds += [pid]
                                              ▼
                                            round  (no terminal state in this feature)
```

Out of scope here: any transition leaving `round`. A future feature will introduce a `results` status and the rule that triggers it.

## Validation rules

Source of truth lives in `backend/src/api/schemas.ts` (Zod) and is mirrored to the frontend by code review (we do not ship Zod to the client).

| Field | Rule | Failure |
|---|---|---|
| `participantId` | non-empty string; MUST match a current `room.participants[i].id`; MUST NOT equal `room.round.drawerParticipantId` | `400` (empty / missing) / `403` (not in room / is drawer) |
| `text` | `z.string().trim().min(1).max(50)` | `400` |
| Round must be active | `room.round !== null` | `409 { message: "No round in progress" }` |
| Not already locked | `!room.round.lockedParticipantIds.includes(participantId)` | `409 { message: "You have already guessed correctly this round" }` |

## Helper function (pure)

```ts
// backend/src/services/roomStore.ts
export function isGuessCorrect(text: string, secretWord: string): boolean {
  return text.trim().toLowerCase() === secretWord.trim().toLowerCase();
}
```

Trim is applied here defensively even though the Zod schema already trims — the function is pure and reusable from tests without going through the route.

## Invariants (test-anchored)

- **I-1** (FR-005, FR-009): For every `participantId` in `scores`, the value is a non-negative integer multiple of `100`. (Currently always `0` or `100` per round; multiplied if a future feature adds more bonuses.)
- **I-2** (FR-005): For every `pid ∈ lockedParticipantIds`, `scores[pid] === 100` is true at the moment the entry was added. (Idempotent reapplication is impossible because the schema/route rejects locked submissions before reaching the scoring step.)
- **I-3** (FR-006): No `Guess.text` in the round equals (case-insensitively, trimmed) the secret word unless `Guess.isCorrect === true`. (Symmetrically: every correct guess has the trim+lowercase-equal property; every wrong guess does not.)
- **I-4** (FR-005, FR-004): `room.round.drawerParticipantId` never appears in `room.round.lockedParticipantIds` (drawer cannot guess).
- **I-5** (FR-006): The cleartext secret word string never appears in any non-drawer snapshot payload, including inside `guesses[i].text`. This is naturally true given I-3 only emits correct guesses, and correct guesses themselves are the cleartext word — so the rule actually loosens: a guesser **does** see the word once they correctly guess it, because their own correct guess text is logged. Discussion in §I-5b below.

### I-5b: The "correct guess reveals the word" exception

When a guesser submits a correct guess, their `text` field necessarily equals the secret word (trim + lowercase). It is therefore visible in the `guesses[]` feed to everyone, including other guessers, from that point on. This is **intentional** and matches user expectations ("once someone gets it, everyone sees what it was"). It does **not** contradict FR-005 (which is about the `secretWord` field being absent from non-drawer payloads) and it does **not** contradict SC-004 (which says the cleartext word "appears in 0 payloads" only in the **wrong-guesses-only** scenario described — "at least 5 wrong guesses recorded"). SC-004 is verifiable by the test described in the quickstart §Scenario 3.

If a stricter rule is ever desired ("hide the winning word until the round ends"), the snapshot helper would replace `text` with `maskedWord` for correct guesses in non-drawer views. We are explicitly not doing that here — it would surprise the user.

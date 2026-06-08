# REST Contract Deltas: Active Round Drawing, Guessing & Scoring

Base URL (dev): `http://localhost:3001`. These are **deltas** on top of feature 002's `contracts/rooms-api.md`. One **new** endpoint (`POST /rooms/:code/guess`); the shared snapshot gains `participants[].score` and `round.guesses[]`. No new transport or query params. The canvas is **not** represented in the API (drawer-local, FR-015).

## Shared types (after this feature)

```ts
interface GuessSnapshot {
  id: string;
  playerId: string;
  playerName: string;
  correct: boolean;
  text?: string;          // present ONLY when correct === false (correct guesses are masked)
}

interface RoundSnapshot {
  number: number;
  drawerId: string;
  wordLength: number;
  maskedWord: string;
  word?: string;          // drawer only (unchanged, feature 002)
  guesses: GuessSnapshot[]; // NEW — ordered history; correct entries omit `text`
}

interface Participant {
  id: string;
  name: string;
  joinedAt: string;
  lastSeenAt?: string;
  score: number;          // NEW — 0 at round start; +100 per first correct guess
}

interface RoomSnapshot {
  code: string;
  status: "lobby" | "playing";
  hostId: string;
  participants: Participant[];   // now include `score`
  round: RoundSnapshot | null;
  roles: ("drawer" | "guesser")[];
}
```

**Masking invariant**: in any response body, a `GuessSnapshot` with `correct === true` has **no** `text` key. The secret word therefore never appears in the guess feed (FR-011, SC-008). This is in addition to feature 002's `round.word` drawer-only invariant.

---

## POST /rooms/:code/guess — submit a guess  *(NEW)*

Submitted by a guessing player during an active round. Sync to other players happens on their next `GET /rooms/:code` poll; the submitter receives the updated snapshot immediately.

**Request**: `{ "participantId": string, "text": string }`

Server **trims** `text` before evaluating.

**200** → `{ room: RoomSnapshot }` — the viewer-aware snapshot for the submitter, reflecting the appended guess and any score change. Example after a correct guess by "Priya":

```json
{
  "room": {
    "code": "K7P2", "status": "playing", "hostId": "<hostId>",
    "participants": [
      { "id": "<hostId>", "name": "Ann", "score": 0 },
      { "id": "<priyaId>", "name": "Priya", "score": 100 }
    ],
    "round": {
      "number": 1, "drawerId": "<hostId>", "wordLength": 6, "maskedWord": "_ _ _ _ _ _",
      "guesses": [
        { "id": "g1", "playerId": "<priyaId>", "playerName": "Priya", "correct": false, "text": "house" },
        { "id": "g2", "playerId": "<priyaId>", "playerName": "Priya", "correct": true }
      ]
    },
    "roles": ["drawer", "guesser"]
  }
}
```

Note the correct entry `g2` has **no** `text`.

**Failures**:

| Status | When | Message |
|--------|------|---------|
| `400` | `text` empty/whitespace-only after trim | `"Please enter a guess."` (FR-003 — not recorded) |
| `403` | submitter is the drawer | `"The drawer cannot guess."` (FR-014) |
| `409` | room not in `playing` / no active round | `"The round is not active."` (FR-001) |
| `404` | room not found / closed | `"Room not found"` (consistent with existing endpoints) |

Scoring (on `200`): correct guess → submitter's `score += 100` **iff** this is their first correct guess this round (FR-005, FR-007); incorrect → unchanged (FR-005). A correct guess does **not** end the round (FR-016).

---

## GET /rooms/:code?participantId=… — poll room  *(shape extended)*

Unchanged behavior; the returned `RoomSnapshot` now additionally carries `participants[].score` and `round.guesses[]` (correct entries masked). This is the channel through which every player's guess history and scores converge within ~2s (FR-009, SC-004). The drawer-only `round.word` invariant from feature 002 is preserved.

---

## POST /rooms/:code/start — start game (host only)  *(shape extended)*

Unchanged behavior, but on start the server sets every `participant.score = 0` (FR-006) and the returned snapshot includes `round.guesses: []`.

---

## Contract test checklist

- [ ] `POST /rooms/:code/guess` with `"  "` (empty after trim) → `400` "Please enter a guess."; history unchanged.
- [ ] `POST /rooms/:code/guess` by the drawer → `403` "The drawer cannot guess."
- [ ] `POST /rooms/:code/guess` when `status !== "playing"` → `409` "The round is not active."
- [ ] Correct guess (e.g. `"  ROCKET "` vs word `"rocket"`) → `200`, submitter `score === 100`, guess appears with `correct: true` and **no** `text`.
- [ ] Incorrect guess → `200`, submitter `score` unchanged, guess appears with `correct: false` and verbatim `text`.
- [ ] Same player submits the correct word twice → total `score` stays `100` (FR-007).
- [ ] After a guess, a second participant's `GET /rooms/:code` shows the same `round.guesses` in the same order (FR-010).
- [ ] No `GuessSnapshot` with `correct: true` contains a `text` key (SC-008).
- [ ] `round.word` still absent for guessers (feature 002 invariant intact).

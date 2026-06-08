# REST Contract Deltas: Round Result & Host Restart

Base URL (dev): `http://localhost:3001`. These are **deltas** on top of feature 003's `contracts/rooms-api.md`. Two **new** endpoints (`POST /rooms/:code/end`, `POST /rooms/:code/restart`); `RoomStatus` gains `"ended"`; the shared snapshot's `round` projection reveals the word + full history once the room is `ended`. No new transport, query params, or top-level fields.

## Shared types (after this feature)

```ts
type RoomStatus = "lobby" | "playing" | "ended";   // "ended" is NEW

interface RoomSnapshot {
  code: string;
  status: RoomStatus;            // now three values
  hostId: string;
  participants: Participant[];   // participants[].score = final score when ended
  round: RoundSnapshot | null;   // populated when "ended"; null again after restart
  roles: ("drawer" | "guesser")[];
}
```

`Participant`, `RoundSnapshot`, and `GuessSnapshot` keep the **same shape** as feature 003. What changes is the **projection** of `RoundSnapshot` when `status === "ended"`:

- `round.word` is present for **every** viewer (not just the drawer).
- every `round.guesses[]` entry includes `text` (correct guesses are **no longer** masked).

**Reveal invariant**: the word + correct-guess `text` are exposed **only** when `status === "ended"`. While `status === "playing"`, feature 002's drawer-only `round.word` and feature 003's correct-guess masking are **unchanged**.

---

## POST /rooms/:code/end — end the active round (host only)  *(NEW)*

Called by the host to finish the active round and reveal the result. Sync to other players happens on their next `GET /rooms/:code` poll (they observe `status: "ended"`); the host receives the revealed snapshot immediately.

**Request**: `{ "participantId": string }`

**200** → `{ room: RoomSnapshot }` — `status: "ended"`, with `round.word` revealed and all `round.guesses[]` carrying `text`. Example:

```json
{
  "room": {
    "code": "K7P2", "status": "ended", "hostId": "<hostId>",
    "participants": [
      { "id": "<hostId>", "name": "Ann", "score": 0 },
      { "id": "<priyaId>", "name": "Priya", "score": 100 }
    ],
    "round": {
      "number": 1, "drawerId": "<hostId>", "wordLength": 6,
      "maskedWord": "_ _ _ _ _ _", "word": "rocket",
      "guesses": [
        { "id": "g1", "playerId": "<priyaId>", "playerName": "Priya", "correct": false, "text": "house" },
        { "id": "g2", "playerId": "<priyaId>", "playerName": "Priya", "correct": true, "text": "rocket" }
      ]
    },
    "roles": ["drawer", "guesser"]
  }
}
```

Note: in the `ended` state `round.word` is present for **all** viewers and the correct entry `g2` now **includes** `text`.

**Failures**:

| Status | When | Message |
|--------|------|---------|
| `403` | requester is not the host | `"Only the host can end the round."` (FR-001) |
| `409` | room not in `playing` / no active round | `"There is no active round to end."` (FR-001) |
| `404` | room not found / closed | `"Room not found"` (consistent with existing endpoints) |

---

## POST /rooms/:code/restart — restart to a fresh lobby (host only)  *(NEW)*

Called by the host from the result state. Returns the room to `lobby`, clears the round, resets every score to 0, and preserves the participant list and host. Other players observe `status: "lobby"` on their next poll and return to the lobby.

**Request**: `{ "participantId": string }`

**200** → `{ room: RoomSnapshot }` — `status: "lobby"`, `round: null`, every `participants[].score === 0`, same participants and `hostId` as before. Example:

```json
{
  "room": {
    "code": "K7P2", "status": "lobby", "hostId": "<hostId>",
    "participants": [
      { "id": "<hostId>", "name": "Ann", "score": 0 },
      { "id": "<priyaId>", "name": "Priya", "score": 0 }
    ],
    "round": null,
    "roles": ["drawer", "guesser"]
  }
}
```

**Idempotency**: if the room is **already** `lobby`, restart is a **no-op success** (`200` with the current lobby snapshot) — repeated restarts/double-clicks leave a single fresh lobby (FR-014).

**Failures**:

| Status | When | Message |
|--------|------|---------|
| `403` | requester is not the host | `"Only the host can restart the game."` (FR-008) |
| `404` | room not found / closed | `"Room not found"` (consistent with existing endpoints) |

---

## GET /rooms/:code?participantId=… — poll room  *(shape extended)*

Unchanged behavior; `status` may now be `"ended"`. When `status === "ended"`, the returned `RoundSnapshot` reveals `round.word` to every viewer and includes `text` on every guess. This poll is the channel through which all players enter the result state (~2s, SC-003) and later return to the lobby after restart (~2s, SC-004). When `status === "playing"`, the response is identical to feature 003 (word drawer-only; correct guesses masked).

---

## Contract test checklist

- [ ] `POST /rooms/:code/end` by a non-host → `403` "Only the host can end the round."; status stays `playing`.
- [ ] `POST /rooms/:code/end` when `status !== "playing"` → `409` "There is no active round to end."
- [ ] `POST /rooms/:code/end` by the host during a round → `200`, `status: "ended"`, `round.word` present, all guesses include `text`.
- [ ] After `end`, a second participant's `GET /rooms/:code` returns `status: "ended"` with the same revealed `round.word` and full `round.guesses` (FR-007).
- [ ] In the `ended` snapshot, a `GuessSnapshot` with `correct: true` now **contains** `text` (masking lifted).
- [ ] `POST /rooms/:code/restart` by a non-host → `403` "Only the host can restart the game."; status unchanged.
- [ ] `POST /rooms/:code/restart` by the host from `ended` → `200`, `status: "lobby"`, `round: null`, every `participants[].score === 0`, same participant ids + `hostId`.
- [ ] `POST /rooms/:code/restart` again (now `lobby`) → `200` no-op, still a single fresh lobby (FR-014).
- [ ] While `status === "playing"` (no `end` yet), `GET /rooms/:code` still hides `round.word` from guessers and masks correct guesses (feature 002/003 invariants intact — regression).

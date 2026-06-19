# Phase 1 Contract: Rooms API delta (Group 4)

Only the **changes** from the Groups 1–3 contracts. Error bodies remain `{ "message": string }`, surfaced verbatim by the frontend.

---

## Snapshot change — word revealed at result

`RoomSnapshot.status` may now be `"result"`. When `status === "result"`, the snapshot includes `word` for
**every** viewer (not only the drawer):

```jsonc
{
  "status": "result",
  "word": "castle",              // revealed to ALL in result (drawer-only during "active")
  "participants": [ { "id": "…", "name": "Bob", "score": 100 }, … ],  // final scores
  "guesses": [ … ],              // full history
  // …
}
```
_(FR-003, FR-004, FR-005)_

---

## POST /rooms/:code/end  **[new]**

Host ends the active round → result state.

**Request**: `{ "participantId": "uuid-of-host" }`

**Response 200**: `{ "room": { /* snapshot, status: "result", word revealed to all */ } }`

| Status | Condition | Body | FR |
|--------|-----------|------|----|
| 404 | No room for `:code` | `{ "message": "Unable to load room" }` | — |
| 403 | `participantId !== hostId` | `{ "message": "Only the host can end the round." }` | FR-002 |
| 400 | Missing/invalid payload | `{ "message": "Invalid request payload" }` (Zod) | — |

_(FR-001)_

---

## POST /rooms/:code/restart  **[new]**

Host restarts → lobby, players preserved, round state cleared.

**Request**: `{ "participantId": "uuid-of-host" }`

**Response 200**: `{ "room": { /* snapshot, status: "lobby", no drawerId/word, guesses [], all scores 0, same participants */ } }`

| Status | Condition | Body | FR |
|--------|-----------|------|----|
| 404 | No room for `:code` | `{ "message": "Unable to load room" }` | — |
| 403 | `participantId !== hostId` | `{ "message": "Only the host can restart." }` | FR-007 |
| 400 | Missing/invalid payload | `{ "message": "Invalid request payload" }` (Zod) | — |

**Behavior**: sets `status = "lobby"`; clears `drawerId`, `secretWord`, `guesses`; resets every participant
`score` to 0; preserves the `participants` array. _(FR-006, FR-008, FR-009, FR-010)_

---

## Contract test checklist (for `/speckit.tasks`)

- [ ] `endRound` by a non-host → 403; by the host → `status === "result"`.
- [ ] After `endRound`, `toRoomSnapshot(room, guesserId).word === secretWord` (revealed to all at result).
- [ ] During `active`, a guesser snapshot still has no `word` (Group 2 unchanged).
- [ ] `restartGame` by a non-host → 403.
- [ ] After `restartGame`: `status === "lobby"`, `drawerId`/`secretWord` undefined, `guesses` empty, every `score === 0`, and `participants` preserved (same ids, same count).
- [ ] Full lifecycle: start → end → restart leaves a clean lobby that can start again.

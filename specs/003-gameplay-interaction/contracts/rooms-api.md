# Phase 1 Contract: Rooms API delta (Group 3)

Only the **changes** from the Group 1–2 contracts. Error bodies remain `{ "message": string }`, surfaced verbatim by the frontend.

---

## Snapshot additions

`RoomSnapshot` now also carries (for **all** viewers):

```jsonc
{
  // …existing fields (code, status, hostId, drawerId, role, word(drawer-only), availableWords, roles)…
  "participants": [
    { "id": "uuid", "name": "Bob", "joinedAt": "…", "score": 0 }   // score NEW
  ],
  "guesses": [                                                      // NEW — shared, verbatim, ordered
    { "id": "g1", "participantId": "uuid", "name": "Bob", "text": "pizza", "correct": false, "at": "…" }
  ]
}
```
_(FR-007, FR-008, FR-009, FR-012)_

---

## POST /rooms/:code/guess  **[new]**

Submit a guess during the active round.

**Request**:
```jsonc
{ "participantId": "uuid-of-guesser", "text": "  Castle " }
```

**Response 200** (accepted — correct or incorrect): `{ "room": { /* snapshot incl. updated guesses + scores */ } }`

**Error responses**:

| Status | Condition | Body | FR |
|--------|-----------|------|----|
| 404 | No room for `:code` | `{ "message": "Unable to load room" }` | — |
| 400 | Empty/whitespace `text` | `{ "message": "Enter a guess." }` | FR-005 |
| 400 | Missing/invalid payload | `{ "message": "Invalid request payload" }` (Zod) | FR-005 |
| 403 | `participantId === room.drawerId` | `{ "message": "The drawer cannot guess." }` | FR-004 |
| 409 | Guesser already scored (score 100) | `{ "message": "You already guessed the word." }` | FR-011a |

**Behavior**: trims `text`; compares case-insensitively to the secret word; appends
`{ id, participantId, name, text(trimmed), correct, at }` to `room.guesses`; if correct and the guesser's
score is 0, sets it to 100 (once). Returns the updated snapshot. _(FR-006, FR-007, FR-010, FR-011)_

> Drawing is **not** an API concern — strokes are drawer-local (no endpoint). _(FR-001…003)_

---

## Contract test checklist (for `/speckit.tasks`)

- [ ] `submitGuess` with empty/whitespace text → 400; nothing recorded.
- [ ] `submitGuess` by the drawer → 403.
- [ ] Correct guess (different case + spaces, e.g. "  CASTLE ") → recorded `correct:true`; guesser score 100.
- [ ] Incorrect guess → recorded `correct:false`; score unchanged (0).
- [ ] Repeat guess by an already-correct guesser → 409; score stays 100; no extra history entry from the blocked attempt.
- [ ] New participants start with `score === 0`.
- [ ] Snapshot includes the shared `guesses` array (same for all viewers) and participant `score`s.
- [ ] Group 1–2: word still drawer-only; start/host/name rules unchanged (no regression).

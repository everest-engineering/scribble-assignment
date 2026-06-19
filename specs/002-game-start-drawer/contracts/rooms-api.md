# Phase 1 Contract: Rooms API delta (Group 2)

Only the **changes** from the Group 1 contract ([../../001-room-setup-lobby/contracts/rooms-api.md](../../001-room-setup-lobby/contracts/rooms-api.md)) are listed.
Error bodies remain `{ "message": string }`, surfaced verbatim by the frontend.

---

## `RoomSnapshot` shape — viewer-aware additions

```jsonc
// Drawer's view of a started room:
{
  "code": "ABCD",
  "status": "active",
  "hostId": "uuid-host",
  "drawerId": "uuid-host",      // NEW — who is drawing (all viewers)
  "role": "drawer",             // NEW — requesting viewer's role
  "word": "castle",             // NEW — present ONLY in the drawer's view
  "participants": [ /* … */ ],
  "availableWords": [ /* … */ ],
  "roles": ["drawer", "guesser"]
}

// A guesser's view of the SAME room — note `word` is absent entirely:
{
  "code": "ABCD",
  "status": "active",
  "hostId": "uuid-host",
  "drawerId": "uuid-host",      // guessers still see who draws
  "role": "guesser",            // NEW
  "participants": [ /* … */ ],
  "availableWords": [ /* … */ ],
  "roles": ["drawer", "guesser"]
  // no "word" key
}
```

`drawerId`/`role`/`word` are absent while `status === "lobby"`. _(FR-005, FR-006, FR-009, FR-010)_

---

## POST /rooms  **[existing — name validation added]**

**Request**: `{ "playerName": "  Alice  " }`

**Behavior change**: name is trimmed; **blank/whitespace → 400** `{ "message": "Enter a player name." }`.
Accepted name stored trimmed ("Alice"). No more silent "Player" fallback. _(FR-001, FR-002, FR-003)_

## POST /rooms/:code/join  **[existing — name validation added]**

Same name rule as create (400 on blank). Group 1's empty-code and unknown-code behavior is unchanged. _(FR-001…003)_

## POST /rooms/:code/start  **[existing — behavior expanded]**

Group 1 gating unchanged (host-only 403, <2 players 409). **New on success**: the room transitions to
`active` **and** sets `drawerId = hostId` and `secretWord = selectWord(code)`.

**Response 200** (to the host, who is the drawer): snapshot with `status:"active"`, `drawerId`, `role:"drawer"`, and `word`.
_(FR-004, FR-007, FR-008)_

## GET /rooms/:code?participantId=…  **[existing — now viewer-aware]**

`participantId` (already accepted) now **matters**: the returned snapshot's `role` and the presence of `word`
depend on it. Same room polled by the drawer includes `word`; polled by a guesser omits it. Drawer/word are
stable across repeated polls within the round. _(FR-005/006/008/009/010)_

---

## Contract test checklist (for `/speckit.tasks`)

- [ ] `createRoom` with a blank/whitespace name is rejected (no participant created; no "Player").
- [ ] `createRoom`/`joinRoom` store the name trimmed.
- [ ] After `startGame`, `room.drawerId === room.hostId` and `room.secretWord` is one of the 5 starter words.
- [ ] `selectWord(code)` is pure: same code → same word across calls.
- [ ] `toRoomSnapshot(room, drawerId)` includes `word` and `role:"drawer"`.
- [ ] `toRoomSnapshot(room, guesserId)` omits `word` and returns `role:"guesser"`, but still includes `drawerId`.
- [ ] While `lobby`, snapshot has no `word`/`drawerId`/`role`.

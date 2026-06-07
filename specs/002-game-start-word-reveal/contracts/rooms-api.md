# REST Contract Deltas: Game Start, Drawer Selection & Secret Word Reveal

Base URL (dev): `http://localhost:3001`. These are **deltas** on top of feature 001's `contracts/rooms-api.md`. Endpoints and methods are unchanged; the response **shape** becomes viewer-aware and name validation now returns `400`. No new endpoints, transport, or query params.

## Shared types (after this feature)

```ts
interface RoundSnapshot {
  number: number;        // 1
  drawerId: string;      // participantId of the drawer (everyone)
  wordLength: number;    // letter count for blanks (everyone)
  maskedWord: string;    // e.g. "_ _ _ _ _" (everyone)
  word?: string;         // present ONLY when the requester is the drawer
}

interface RoomSnapshot {
  code: string;
  status: "lobby" | "playing";
  hostId: string;
  participants: { id: string; name: string; joinedAt: string; lastSeenAt?: string }[];
  round: RoundSnapshot | null;   // null while in lobby
  roles: ("drawer" | "guesser")[];
  // NOTE: `availableWords` is no longer returned.
}
```

**Secrecy invariant**: `round.word` appears in a response body **only** when the requester (`participantId`) equals `round.drawerId`. For all other viewers the `word` key is absent.

---

## POST /rooms — create room

**Request**: `{ "playerName": string }`

**201** → `{ participantId, room: RoomSnapshot }` (room in `lobby`, `round: null`).

**400** *(NEW)* — empty or whitespace-only name:
```json
{ "message": "Please enter a name to continue." }
```
Server trims `playerName`; if the result is empty, it rejects (does **not** default to `"Player"`). FR-009, FR-010.

---

## POST /rooms/:code/join — join room

**Request**: `{ "playerName": string }`

**200** → `{ participantId, room: RoomSnapshot }`.

**400** *(NEW)* — empty/whitespace-only name → `{ "message": "Please enter a name to continue." }`. FR-009, FR-010.

Existing failures unchanged: `404` not found, `409` "This room is full", `409` "This game has already started".

---

## POST /rooms/:code/start — start game (host only)

**Request**: `{ "participantId": string }`

**200** *(shape extended)* → `{ room: RoomSnapshot }` where:
- `room.status === "playing"`
- `room.round = { number: 1, drawerId: <hostId>, wordLength, maskedWord, word? }`
- Because the host calls start, the host **is** the drawer → this response **includes** `round.word` (the host/drawer is allowed to see it). FR-001, FR-002, FR-006.

Existing failures unchanged: `403` "Only the host can start the game", `409` "At least 2 players are required to start", `409` "This game has already started", `404` "Room not found".

---

## GET /rooms/:code?participantId=… — poll room

The poll is the primary way non-host players learn the round started (status flips to `playing`) and receive their viewer-appropriate round data.

**200** → `{ room: RoomSnapshot }`:

- **Drawer** (`participantId === round.drawerId`):
  ```json
  {
    "room": {
      "code": "K7P2", "status": "playing", "hostId": "<id>",
      "participants": [ ... ],
      "round": { "number": 1, "drawerId": "<id>", "wordLength": 6, "maskedWord": "_ _ _ _ _ _", "word": "castle" },
      "roles": ["drawer", "guesser"]
    }
  }
  ```
- **Guesser** (`participantId !== round.drawerId`): identical **except** `round.word` is **absent**:
  ```json
  {
    "room": {
      "code": "K7P2", "status": "playing", "hostId": "<id>",
      "participants": [ ... ],
      "round": { "number": 1, "drawerId": "<id>", "wordLength": 6, "maskedWord": "_ _ _ _ _ _" },
      "roles": ["drawer", "guesser"]
    }
  }
  ```

**404** — room not found / closed (e.g., host/drawer departed). Unchanged from 001; frontend ejects the player. FR-013.

---

## Contract test checklist

- [ ] `POST /rooms` with `"  "` → `400` + "Please enter a name to continue."
- [ ] `POST /rooms` with `"  Ann  "` → `201`, participant name is `"Ann"` (trimmed).
- [ ] `POST /rooms/:code/join` with empty name → `400` (same message).
- [ ] `POST /rooms/:code/start` by host → `200`, `round.number === 1`, `round.drawerId === hostId`, `round.word` present.
- [ ] `GET /rooms/:code?participantId=<drawer>` → response includes `round.word`.
- [ ] `GET /rooms/:code?participantId=<guesser>` → response has **no** `round.word`; `wordLength`/`maskedWord` present and match the word's length.
- [ ] Two starts in rooms with the **same code** → identical `round.word` (determinism, SC-005).
- [ ] Response bodies no longer contain `availableWords`.

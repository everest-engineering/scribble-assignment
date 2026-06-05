# Data Model: Result, Restart & Final Validation

**Branch**: `004-result-restart-validation` | **Date**: 2026-06-05

## Existing Entities (unchanged)

### `Participant`
```ts
interface Participant {
  id: string;       // UUID, stable across restart
  name: string;     // display name
  joinedAt: string; // ISO timestamp
}
```

### `Guess`
```ts
interface Guess {
  participantId: string;
  participantName: string;
  text: string;       // trimmed guess text
  correct: boolean;
  submittedAt: string; // ISO timestamp
}
```

---

## Modified Entity: `Room`

The `Room` entity is unchanged structurally — `RoomStatus` already includes `"result"`.
No new fields are added for Scenario 4.

```ts
// backend/src/models/game.ts — no code change required
export type RoomStatus = "lobby" | "playing" | "result";

export interface Room {
  code: string;
  status: RoomStatus;       // "lobby" | "playing" | "result"
  participants: Participant[];
  hostId: string;
  drawerId?: string;        // undefined when status = "lobby" or after restart
  secretWord?: string;      // undefined when status = "lobby" or after restart
  guesses: Guess[];         // [] when status = "lobby" or after restart
  scores: Record<string, number>; // {} when status = "lobby" or after restart
  canvasData: string | null; // null when status = "lobby" or after restart
  createdAt: string;
  updatedAt: string;
}
```

### State Transitions

```
lobby ──[host starts game]──► playing ──[host clicks "End Round"]──► result
  ▲                                                                      │
  └──────────────────[host clicks "Restart"]────────────────────────────┘
```

**On transition to `"playing"`** (startRoom — Scenario 2):
- `drawerId`, `secretWord`, `guesses`, `scores` (all zeros), `canvasData` set

**On transition to `"result"`** (endRoom — Scenario 4):
- Only `status` changes; all round data (`guesses`, `scores`, `canvasData`, `secretWord`) preserved for display

**On transition to `"lobby"`** (restartRoom — Scenario 4):
- `status` → `"lobby"`
- `drawerId` → `undefined`
- `secretWord` → `undefined`
- `guesses` → `[]`
- `scores` → `{}`
- `canvasData` → `null`
- `participants` and `hostId` preserved

---

## Modified Entity: `RoomSnapshot`

The snapshot is also structurally unchanged. The `secretWord` field visibility changes
based on status:

| `status` | `secretWord` in snapshot |
|----------|--------------------------|
| `"lobby"` | omitted (undefined) |
| `"playing"` | included for drawer only |
| `"result"` | included for **all** viewers |

This is enforced in `toRoomSnapshot` (see `research.md` Finding 2).

```ts
// frontend/src/services/api.ts — no structural change needed
export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  participants: Participant[];
  hostId: string;
  drawerId?: string;
  secretWord?: string;   // present for all players when status = "result"
  guesses: Guess[];
  scores: Record<string, number>;
  canvasData: string | null;
  availableWords: string[];
  roles: ParticipantRole[];
}
```

---

## Derived View: `RoundResult` (frontend only)

Not a stored or transmitted entity — computed in `RoundResultsView` at render time:

```ts
// Sorted scores (descending, ties in join order)
const sortedParticipants = [...room.participants].sort(
  (a, b) => (room.scores[b.id] ?? 0) - (room.scores[a.id] ?? 0)
);

// Host name (for personalised waiting message)
const hostName = room.participants.find(p => p.id === room.hostId)?.name ?? "host";

// Guess history (already in submission order from server)
const guesses = room.guesses;
```

---

## Validation Rules

| Rule | Location | Detail |
|------|----------|--------|
| Host-only for endRoom | `roomStore.endRoom` | 403 if `participantId !== room.hostId` |
| Host-only for restartRoom | `roomStore.restartRoom` | 403 if `participantId !== room.hostId` |
| Room must exist | both new functions | 404 if `!rooms.get(code)` |
| Guess text HTML-escaping | existing `ResultPanel` / new `RoundResultsView` | render with `textContent` / React's default JSX escaping |

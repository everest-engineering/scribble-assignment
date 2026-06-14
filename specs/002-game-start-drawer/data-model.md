# Phase 1 — Data Model

Spec: [./spec.md](./spec.md) · Plan: [./plan.md](./plan.md) · Research: [./research.md](./research.md)

This feature extends the model from `001-room-setup-lobby`. **Only the deltas are shown**; everything else (Room codes, Participant identity, host wiring, lobby polling) remains as defined in `specs/001-room-setup-lobby/data-model.md`.

---

## New entity — `Round`

A `Round` is the single active round within a `Room`. Lives in process memory as a nullable field on `Room`. Created when the host successfully starts the game; remains the same until the round ends (round-end is out of scope here).

| Field | Type | Notes |
|---|---|---|
| `roundNumber` | `number` | 1-based positive integer. Always `1` in this feature's scope. |
| `drawerParticipantId` | `string` | FK to `Room.participants[].id`. Equals `Room.hostParticipantId` at round 1 (FR-002). |
| `secretWord` | `string` | The cleartext word. **Never** leaves the server unless the viewer's `participantId === drawerParticipantId`. |

### Validation rules

- `roundNumber >= 1`.
- `drawerParticipantId` must reference an existing participant in the same room.
- `secretWord` must be a non-empty string selected via `selectWordForRound(STARTER_WORDS, roundNumber)`.
- A `Round` is **created at most once per Room** within this feature's scope (FR-007).

### State transitions

```text
Room.status = "lobby"  ──host POST /start (≥2 players)──►  Room.status = "round"
                                                             Room.round = { 1, host.id, word }

Room.status = "round"  ──host POST /start (retry)──►       (no change; same Round returned)

Room.status = "round"  ──any non-host POST /start──►       403 (no change)
```

Round-end / cleanup transitions are intentionally **not modeled** in this feature.

---

## Extension — `Room`

```ts
// backend/src/models/game.ts (delta)
export interface Room {
  // ...existing fields from 001...
  status: "lobby" | "round";   // was: "lobby" only
  round: Round | null;          // new — null while in lobby, populated once started
}
```

### Invariants

- `room.round === null` ⇔ `room.status === "lobby"`.
- `room.round !== null` ⇔ `room.status === "round"`.
- `room.round?.drawerParticipantId === room.hostParticipantId` at all times in this feature's scope (single round, host stays drawer).

---

## Extension — `ParticipantView`

```ts
export interface ParticipantView extends Participant {
  isHost: boolean;   // existing from 001
  isDrawer: boolean; // new — true iff room.round?.drawerParticipantId === participant.id
}
```

`isDrawer` is **derived per snapshot**, not stored on the Participant.

---

## Extension — `RoomSnapshot`

```ts
export interface RoomSnapshot {
  // ...existing fields from 001 (code, participants, hostParticipantId, viewerIsHost, canStart, availableWords, roles)...
  status: "lobby" | "round";
  round: RoundView | null;
}

export interface RoundView {
  roundNumber: number;
  drawerParticipantId: string;
  maskedWord: string;        // length-only indicator (e.g., "______" for "rocket"). Always present in-round.
  secretWord?: string;       // ONLY present when the snapshot's viewer is the drawer (FR-005).
}
```

### Viewer-aware filtering rules (server-side, inside `toRoomSnapshot`)

| Condition | `round.secretWord` | `round.maskedWord` | `participants[i].isDrawer` |
|---|---|---|---|
| In lobby (`room.round === null`) | absent (whole `round` is `null`) | absent | always `false` |
| In round, viewer is drawer | **present** (cleartext) | present | `true` for viewer, `false` for others |
| In round, viewer is guesser | **absent** | present | `false` for viewer, `true` for the drawer |
| In round, no `viewerParticipantId` supplied | **absent** (defensive default) | present | matches storage |

The mask is computed from the cleartext on the server: each non-space character becomes `_`; spaces are preserved literally. For a single-word starter list this is just `word.length` underscores.

---

## Helper — `selectWordForRound(words, roundNumber)`

Pure function exported from `backend/src/services/roomStore.ts`. Not stored — recomputed during `startRoom`.

```ts
export function selectWordForRound(words: readonly string[], roundNumber: number): string {
  if (words.length === 0) {
    throw new Error("No words available");
  }
  return words[(roundNumber - 1) % words.length];
}
```

- Pure, total (once the `length > 0` precondition holds), deterministic.
- Test surface: 5 cases — round 1 → first word, round equal to N → last word, round N+1 → wraps to first, empty list → throws, large round number → still deterministic.

---

## No changes to

- `Participant` (the persisted record). `isHost` and `isDrawer` are derived only on `ParticipantView`.
- `Room.participants[]` ordering.
- `Room.code` generation.
- `Room.hostParticipantId` assignment.
- Session keys in `sessionStorage` on the frontend.
- Polling cadence / visibility behavior.

---

## Removed / deprecated

None. This feature is strictly additive on top of `001`.

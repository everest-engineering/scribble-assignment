# Phase 1 Data Model: Game Start & Drawer Flow

In-memory only (no persistence). Types live in `backend/src/models/game.ts`; the frontend mirrors the
snapshot shape in `frontend/src/services/api.ts`. Extends the Group 1 model.

## Entities

### Participant (unchanged shape)

| Field | Type | Notes |
|-------|------|-------|
| `id` | `string` (UUID) | Identity for this room |
| `name` | `string` | **CHANGED behavior** — now always a trimmed, non-empty value (no `"Player"` default) |
| `joinedAt` | `string` (ISO) | Unchanged |

### RoundState (NEW)

Created once when a room first transitions to `started`.

| Field | Type | Notes |
|-------|------|-------|
| `drawerId` | `string` | The host's participant id (drawer for the single round) |
| `secretWord` | `string` | Deterministic: `selectWord(room.code, STARTER_WORDS)` |
| `roles` | `Record<string, "drawer" \| "guesser">` | participantId → role; host = `drawer`, others = `guesser` |

### Room (server-side, authoritative)

| Field | Type | Notes |
|-------|------|-------|
| `code` | `string` | Canonical uppercase, unique among active rooms |
| `status` | `"lobby" \| "started"` | From Group 1 |
| `hostId` | `string` | From Group 1 |
| `participants` | `Participant[]` | Ordered; creator first |
| `round` | `RoundState \| null` | **NEW** — `null` in lobby; set on first `started` |
| `createdAt` / `updatedAt` | `string` (ISO) | Existing |

### RoomSnapshot (sent to clients — viewer-specific)

| Field | Type | Notes |
|-------|------|-------|
| `code` | `string` | Canonical uppercase |
| `status` | `"lobby" \| "started"` | Drives navigation |
| `hostId` | `string` | From Group 1 |
| `drawerId` | `string \| null` | **NEW** — `round?.drawerId ?? null` |
| `participants` | `Array<Participant & { isHost: boolean; role: "drawer" \| "guesser" \| null }>` | **NEW** `role` per participant (`null` in lobby) |
| `availableWords` | `string[]` | Starter field; unchanged |
| `roles` | `("drawer" \| "guesser")[]` | Starter field; unchanged |
| `secretWord` | `string` (optional) | **NEW** — present ONLY when viewer is the drawer; **absent** otherwise |

> `secretWord` is `secretWord?: string` — for non-drawers the key is omitted entirely (clarified), not
> set to `null`.

## Validation Rules

| Rule | Where | Requirement |
|------|-------|-------------|
| `playerName` required, trimmed, `min(1)` after trim | Edge (Zod, create + join) | FR-020, FR-021 |
| No `"Player"` substitution when name invalid | Store (`displayName` removed) | FR-021 |
| Client blocks empty/whitespace name before request | `CreateRoomPage`, `JoinRoomPage` | FR-022 |
| On first `started`: host=`drawer`, others=`guesser` | `startRoom` | FR-023 |
| Drawer identifiable in snapshot (`drawerId` + per-participant `role`) | `toRoomSnapshot` | FR-024 |
| Round init runs in `startRoom`, idempotent, GET read-only | `startRoom` / `toRoomSnapshot` | FR-025 |
| Word = `sum(code char codes) % wordList.length` index | `wordSelection.selectWord` | FR-026 |
| Same code → same word | `selectWord` (pure) | FR-027 |
| `secretWord` included only for drawer viewer | `toRoomSnapshot` | FR-028 |
| `secretWord` omitted for guesser viewer | `toRoomSnapshot` | FR-029 |
| Hiding enforced server-side (not UI-only) | `toRoomSnapshot` projection | FR-030 |
| Game screen shows word only when viewer is drawer | `GamePage` | FR-031 |

## State Transitions (Room)

```text
        create (name validated)
   ────────────────────────────▶  lobby   (round = null, roles = null)
                                     │
                                     │ POST /rooms/:code/start
                                     │   (host AND participants >= 2)   ← Group 1 gate
                                     ▼
                                  started  (round = { drawerId, secretWord, roles })
                                     │
                                     └─ repeat start while started → idempotent (round unchanged)
```

- Round state is created exactly once, on the first `lobby → started` transition.
- No transition back to `lobby` in this group (restart belongs to Group 4).

## Word Selection (pure function)

```typescript
// backend/src/services/wordSelection.ts
export function selectWord(code: string, words: readonly string[]): string {
  const sum = [...code].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return words[sum % words.length];
}
```

- Total over a 5-word starter list; deterministic and unit-tested.
- Example invariant: `selectWord(code, STARTER_WORDS)` is stable for a fixed `code`.

## Viewer Projection Logic

```text
toRoomSnapshot(room, viewerId):
  drawerId   = room.round?.drawerId ?? null
  participants[i].role = room.round?.roles[p.id] ?? null
  if room.round AND viewerId === room.round.drawerId:
      snapshot.secretWord = room.round.secretWord
  else:
      (secretWord key omitted)
```

## Isolation Invariant

For any two rooms A and B with distinct codes: starting A (assigning A's drawer/word) leaves B's
`round`, `status`, roles, and word unchanged. Enforced by the keyed `Map` and covered by a unit test
(FR-005 of SC list / SC-005).

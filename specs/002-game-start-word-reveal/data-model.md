# Phase 1 Data Model: Game Start, Drawer Selection & Secret Word Reveal

Types live in `backend/src/models/game.ts`; the in-memory store and snapshot projection in `backend/src/services/roomStore.ts`; the deterministic picker in `backend/src/services/wordSelection.ts`. Frontend mirrors the snapshot in `frontend/src/services/api.ts`. **No persistence** — single `Map<code, Room>` cleared on restart. This builds on feature 001's model.

## Constants

```ts
// Existing (feature 001) — unchanged
const MAX_PLAYERS = 8;
const PRESENCE_TIMEOUT_MS = 10_000;
const POLL_INTERVAL_MS = 2_000;        // frontend

// This feature
const FIRST_ROUND_NUMBER = 1;          // only round 1 is created this increment (FR-001)
```

## Entities

### Round  *(NEW)*

Represents the single active round created when the game starts.

| Field | Type | Notes |
|-------|------|-------|
| `number` | `number` | Round index; `1` for this increment. FR-001 |
| `drawerId` | `string` | `participantId` of the drawer; equals `room.hostId` for round 1. FR-002 |
| `word` | `string` | The full secret word (drawer-only; **never** projected to guessers). Chosen by `selectWord(code, number)`. FR-004, FR-005, FR-006 |

### Room  *(MODIFY)*

| Field | Type | New? | Notes |
|-------|------|------|-------|
| `code` | `string` | existing | Also the deterministic seed input for word selection. |
| `status` | `RoomStatus` | existing | `"lobby" \| "playing"`. Becomes `"playing"` when the round starts. FR-001 |
| `hostId` | `string` | existing | Becomes `round.drawerId` for round 1. FR-002 |
| `participants` | `Participant[]` | existing | Each has a trimmed, non-empty name (FR-011). |
| `round` | `Round \| null` | **NEW** | `null` while in lobby; set to round 1 on start. |
| `createdAt` / `updatedAt` | `string` (ISO) | existing | — |

### Participant  *(unchanged shape; validation tightened)*

| Field | Type | Notes |
|-------|------|-------|
| `id` | `string` (UUID) | Session identity (no auth). |
| `name` | `string` | **Trimmed, non-empty** (FR-009, FR-010). Internal spaces preserved. Duplicates still disambiguated as `"Name (2)"`. |
| `joinedAt` / `lastSeenAt` | `string` (ISO) | Unchanged (presence from feature 001). |

Per-round **role** is *derived*, not stored: `participant.id === room.round?.drawerId ? "drawer" : "guesser"`.

### RoomSnapshot  *(MODIFY — viewer-aware)*

`toRoomSnapshot(room, viewerParticipantId)` now uses `viewerParticipantId` (previously ignored).

| Field | Type | New? | Notes |
|-------|------|------|-------|
| `code` | `string` | existing | |
| `status` | `RoomStatus` | existing | Client navigates to `/game` on `"playing"` (feature 001). |
| `hostId` | `string` | existing | |
| `participants` | `Participant[]` | existing | |
| `round` | `RoundSnapshot \| null` | **NEW** | `null` in lobby. See below. |
| `roles` | `ParticipantRole[]` | existing | Left as-is for compatibility (static seed array); role is derived from `round.drawerId` on the client. |
| ~~`availableWords`~~ | — | **REMOVED** | The full word list is no longer projected to clients (tightens secrecy; not needed by UI). |

### RoundSnapshot  *(NEW — what clients receive)*

| Field | Type | Sent to | Notes |
|-------|------|---------|-------|
| `number` | `number` | everyone | Round number (1). |
| `drawerId` | `string` | everyone | Lets every client badge the drawer clearly. FR-003 |
| `wordLength` | `number` | everyone | Number of letters for the blanks display. FR-008 |
| `maskedWord` | `string` | everyone | Precomputed blanks, e.g. `"_ _ _ _ _"` (guesser-facing). FR-008 |
| `word` | `string \| undefined` | **drawer only** | Present **iff** `viewerParticipantId === drawerId`; omitted entirely otherwise. FR-006, FR-007 |

> **Secrecy invariant (FR-007, SC-003)**: `round.word` is included in the response body **only** for the drawer. For every guesser it is absent — not blanked, not nulled in a recoverable way — so inspecting the response cannot reveal it.

## Deterministic Word Selection (`wordSelection.ts`)

```ts
// Pure, deterministic. seed = `${code}:${roundNumber}`.
export function selectWord(code: string, roundNumber: number): string {
  const seed = `${code}:${roundNumber}`;
  let hash = 5381;                         // djb2
  for (let i = 0; i < seed.length; i += 1) {
    hash = ((hash << 5) + hash + seed.charCodeAt(i)) >>> 0;
  }
  return STARTER_WORDS[hash % STARTER_WORDS.length];
}
```

Guarantees: same `(code, roundNumber)` → same word (SC-005); no `Math.random`/`Date`; reuses `STARTER_WORDS`.

## Validation Rules

| Rule | Where | FR |
|------|-------|----|
| Name trimmed (surrounding whitespace removed; internal spaces kept) | Client + server (`schemas` / route) | FR-009 |
| Empty/whitespace-only name → **reject** with clear message (not defaulted) | Client guard (block submit) + server `400 "Please enter a name to continue."` | FR-010, FR-011 |
| Duplicate non-empty names disambiguated `"Name (2)"` | Server `roomStore` (unchanged from 001) | — |
| Start requires host (existing) | Server `startGame` → 403 | (001) |
| Start requires ≥2 participants (existing) | Server `startGame` → 409 | (001) |
| On start, create round 1: `drawerId = hostId`, `word = selectWord(code, 1)` | Server `startGame` | FR-001, FR-002, FR-004, FR-005 |
| `word` projected only to drawer | Server `toRoomSnapshot` | FR-006, FR-007 |

## State Transitions

```text
        lobby (host + ≥2 players, all valid names)
          │
          │ host starts  (startGame: requester=host, ≥2 players)
          ▼
        playing + round{ number:1, drawerId:hostId, word:selectWord(code,1) }
          │  clients poll GET /rooms/:code → see status=playing + round
          │  → drawer sees word; guessers see maskedWord/wordLength
          │
   ANY ───┘ host (=drawer) pruned/departs → DELETE room
            remaining players' next poll → 404 → ejected ("host left")   [FR-013]
```

| From | Event | Guard | To / Effect | FR |
|------|-------|-------|-------------|----|
| `lobby` | `startGame` | requester is host AND ≥2 players | `playing`; create `round` 1; `drawerId = hostId`; `word = selectWord(code,1)` | FR-001, FR-002, FR-004, FR-005 |
| `playing` | `getRoom`/poll by drawer | viewer = drawer | snapshot includes `round.word` | FR-006 |
| `playing` | `getRoom`/poll by guesser | viewer ≠ drawer | snapshot includes `maskedWord`/`wordLength`, **no** `word` | FR-007, FR-008 |
| `lobby`/`playing` | host (drawer) departs/pruned | host absent | DELETE room → others ejected on next poll | FR-013 |

## Traceability (FR → artifact)

| FR | Covered by |
|----|-----------|
| FR-001 | `startGame` sets `status="playing"` + `round` |
| FR-002 | `round.drawerId = room.hostId` |
| FR-003 | `RoundSnapshot.drawerId` (every client badges drawer) |
| FR-004 | `selectWord` picks from `STARTER_WORDS` |
| FR-005 | `selectWord` seeded by `code + number` (deterministic) |
| FR-006 | `word` present for drawer viewer |
| FR-007 | `word` omitted for guesser viewers (snapshot boundary) |
| FR-008 | `wordLength` + `maskedWord` for everyone |
| FR-009 | name trim (client + server) |
| FR-010 | empty/whitespace name → reject + message |
| FR-011 | server-enforced non-empty name → all participants valid at start |
| FR-012 | single `drawerId`; identical `maskedWord` for all guessers |
| FR-013 | reuse `closeIfEmptyOrHostGone` on host/drawer departure |

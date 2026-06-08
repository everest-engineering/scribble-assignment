# Phase 1 Data Model: Round Result & Host Restart

Types live in `backend/src/models/game.ts`; the in-memory store, end/restart transitions, and snapshot projection in `backend/src/services/roomStore.ts`. Frontend mirrors the status/snapshot in `frontend/src/services/api.ts`. **No persistence** — single `Map<code, Room>`. Builds on feature 003's model; this feature adds **one status value** and **two transitions** — no new entities or fields.

## Constants

```ts
// Existing — unchanged
const MAX_PLAYERS = 8;
const PRESENCE_TIMEOUT_MS = 10_000;
const CORRECT_GUESS_POINTS = 100;
const POLL_INTERVAL_MS = 2_000;        // frontend (LobbyPage, GamePage, now ResultsPage)
```

No new constants required.

## Entities

### RoomStatus  *(MODIFY)*

```ts
// Before (feature 003)
type RoomStatus = "lobby" | "playing";
// After (this feature)
type RoomStatus = "lobby" | "playing" | "ended";
```

| Value | Meaning | Round | Frontend page |
|-------|---------|-------|---------------|
| `lobby` | Pre-game; players gathered, no active round. | `null` | `/lobby` |
| `playing` | Active round (feature 002/003). | populated | `/game` |
| `ended` | **NEW** — round over; result revealed to all, awaiting host restart. | populated (revealed) | `/results` |

### Room  *(unchanged shape)*

No field changes. `status` now ranges over three values; `round` is populated in `ended` and `null` again after restart.

### Round / Participant / Guess  *(unchanged shape)*

No field additions. In the `ended` state these are **projected differently** (see snapshot below); the stored objects are identical to feature 003. `Participant.score` already holds the per-game points used as the "final score" (FR-004).

### RoundSnapshot  *(MODIFY — projection now status-aware)*

| Field | Type | Sent to (when `playing`) | Sent to (when `ended`) | Notes |
|-------|------|--------------------------|------------------------|-------|
| `number` | `number` | everyone | everyone | Unchanged. |
| `drawerId` | `string` | everyone | everyone | Unchanged. |
| `wordLength` | `number` | everyone | everyone | Unchanged. |
| `maskedWord` | `string` | everyone | everyone | Still sent (harmless); UI shows the real word in `ended`. |
| `word` | `string?` | **drawer only** | **everyone** | FR-003 — revealed to all once the round has ended. |
| `guesses` | `GuessSnapshot[]` | correct entries omit `text` | **all entries include `text`** | FR-005, FR-006 — full history, unmasked once ended. |

### GuessSnapshot  *(unchanged shape; projection differs by status)*

| Field | Present when `playing` | Present when `ended` |
|-------|------------------------|----------------------|
| `id`, `playerId`, `playerName`, `correct` | always | always |
| `text` | only when `correct === false` | **always** (correct guesses no longer masked) |

> **Secrecy lifecycle**: feature 002/003's "word/correct-guess masking" applies **only while `status === "playing"`**. Once `status === "ended"` the word is public, so revealing it and the full history leaks nothing (FR-006). The masking code path is otherwise byte-for-byte unchanged (regression-safe, Constitution V).

## Transitions (`roomStore.ts`)

### `endRound(code, participantId)`  *(NEW)*

```text
host ends round → POST /rooms/:code/end { participantId }
        │  (heartbeat + prune + closeIfEmptyOrHostGone, as in startGame)
        ├─ room missing/closed        → 404 "Room not found"
        ├─ participantId !== hostId    → 403 "Only the host can end the round."   (FR-001, FR-008-analog)
        ├─ status !== "playing" / no round → 409 "There is no active round to end."
        ▼ status = "ended"; round kept intact; updatedAt = now()
        ▼ return viewer-aware snapshot (word + full history revealed to caller)
```

### `restartRoom(code, participantId)`  *(NEW)*

```text
host restarts → POST /rooms/:code/restart { participantId }
        │  (heartbeat + prune + closeIfEmptyOrHostGone)
        ├─ room missing/closed   → 404 "Room not found"
        ├─ participantId !== hostId → 403 "Only the host can restart the game."   (FR-008)
        ├─ status === "lobby"    → no-op success: return current lobby snapshot   (FR-014 idempotent)
        ▼ status = "lobby"; round = null;                                          (FR-009, FR-011)
          participants[].score = 0 for all;                                        (FR-011)
          participants & hostId preserved (untouched);                            (FR-010)
          updatedAt = now()
        ▼ return snapshot (fresh lobby, identical to pre-startGame)               (FR-013)
```

## Validation & Authorization Rules

| Rule | Where | FR |
|------|-------|----|
| Only the host can end the round | `endRound` → `403` if `participantId !== hostId` | FR-001 |
| End allowed only during an active round | `endRound` → `409` if `status !== "playing"` / no round | FR-001 |
| Ending transitions room to result state for all | `endRound` sets `status = "ended"`; poll propagates | FR-002, FR-007 |
| Result reveals word to everyone | `toRoundSnapshot` includes `word` when `status === "ended"` | FR-003 |
| Result shows final scores | existing `participants[].score` (public) | FR-004 |
| Result shows full guess history | `toRoundSnapshot` includes `text` on all guesses when `ended` | FR-005, FR-006 |
| Result state synced to all | existing `GET /rooms/:code` poll carries `status` + revealed round | FR-007 |
| Only the host can restart | `restartRoom` → `403` if `participantId !== hostId` | FR-008 |
| Restart returns all to lobby | `restartRoom` sets `status = "lobby"`; poll propagates; pages navigate | FR-009, FR-012 |
| Restart preserves players + host | `restartRoom` does not touch `participants` / `hostId` | FR-010 |
| Restart clears round + resets scores | `round = null`; every `score = 0` | FR-011 |
| Restart yields a fresh, startable lobby | `lobby` + `round = null` == pre-`startGame` state | FR-013 |
| Restart is idempotent | no-op success when already `lobby` | FR-014 |

## State Transitions (room lifecycle, full picture)

| From | Event | Guard | To / Effect | FR |
|------|-------|-------|-------------|----|
| `lobby` | `startGame` (feature 002) | host, ≥2 players | `playing`; create round; scores → 0 | (002/003) |
| `playing` | `submitGuess` (feature 003) | round active, not drawer | append guess; first correct → +100 | (003) |
| `playing` | **`endRound`** | host | **`ended`**; round kept; reveal to all | FR-001, FR-002, FR-003 |
| `playing` | `endRound` (non-host) | — | `403`; no change | FR-001 |
| `ended` | poll by any viewer | — | snapshot reveals word + full history; scores public | FR-007 |
| `ended` | **`restartRoom`** | host | **`lobby`**; round → null; scores → 0; players/host kept | FR-009–FR-013 |
| `ended` | `restartRoom` (non-host) | — | `403`; no change | FR-008 |
| `lobby` | `restartRoom` | host | no-op success (already fresh) | FR-014 |
| any | host departs (existing) | — | room closed (`closeIfEmptyOrHostGone`); remaining players ejected via 404 | (001 — see research Decision 5) |

## Traceability (FR → artifact)

| FR | Covered by |
|----|-----------|
| FR-001 | `endRound` host check (`403`) + active-round guard (`409`) |
| FR-002 | `endRound` sets `status = "ended"`; poll propagates to all |
| FR-003 | `toRoundSnapshot` reveals `word` to everyone when `ended` |
| FR-004 | existing public `participants[].score` |
| FR-005 | `toRoundSnapshot` includes `text` on all guesses when `ended` |
| FR-006 | full ordered `round.guesses`; masking lifted in `ended` |
| FR-007 | existing `GET /rooms/:code` poll + `ResultsPage` poll loop |
| FR-008 | `restartRoom` host check (`403`); host-only Restart button |
| FR-009 | `restartRoom` sets `status = "lobby"`; pages navigate on poll |
| FR-010 | `restartRoom` leaves `participants` + `hostId` untouched |
| FR-011 | `restartRoom` sets `round = null` and every `score = 0` |
| FR-012 | poll-driven navigation: `ResultsPage` → `/lobby` on `lobby` |
| FR-013 | resulting `lobby` + `round = null` == pre-`startGame` state |
| FR-014 | `restartRoom` no-op success when already `lobby` |

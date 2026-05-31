# Data Model: Game Start & Drawer Flow

**Feature**: `002-game-start-drawer-flow`
**Date**: 2026-05-31
**Source file**: `backend/src/models/game.ts`

This document describes the **additions and changes** to the data model established in
`specs/001-room-setup-lobby/data-model.md`. Only modified or new fields are listed;
unchanged fields carry forward as-is.

---

## Entities

### Room (updated)

Adds one new field. All existing fields (`code`, `status`, `hostId`, `participants`,
`createdAt`, `updatedAt`) are unchanged.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `currentRound` | `CurrentRound \| undefined` | Optional; present when `status === "in-progress"` | Set by `startGame()`; not present in lobby |

---

### CurrentRound (new, embedded in Room)

Tracks the active round. Stored inside `Room`, not as a separate collection.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `roundNumber` | `number` | Integer ≥ 1 | Always `1` for this feature (round rotation is out of scope) |
| `drawerId` | `string` | UUID; must be a `room.participants[].id` | Set to `room.hostId` on game start (round 1) |
| `wordIndex` | `number` | Integer ≥ 0; `< STARTER_WORDS.length` | Derived: `(roundNumber - 1) % STARTER_WORDS.length` |

**Deterministic word selection**:
```
wordIndex = (roundNumber - 1) % STARTER_WORDS.length
// Round 1 → index 0 → "rocket"
// Round 2 → index 1 → "pizza"  (out of scope; documented for completeness)
```

---

### Participant (updated)

No new fields. Validation rule tightened.

| Field | Change | Notes |
|-------|--------|-------|
| `name` | Backend Zod schema changed to `.string().trim().min(1)` | Names are now trimmed before storage. Whitespace-only names (e.g. `"   "`) are rejected at the API layer. |

---

### RoomSnapshot (API-facing projection, updated)

Two new fields added. All existing fields unchanged.

| Field | Type | Notes |
|-------|------|-------|
| `code` | `string` | Unchanged |
| `status` | `"lobby" \| "in-progress"` | Unchanged |
| `hostId` | `string` | Unchanged |
| `participants` | `Participant[]` | Unchanged |
| `availableWords` | `string[]` | Unchanged |
| `roles` | `ParticipantRole[]` | Unchanged |
| `currentDrawerId` | `string \| undefined` | **NEW** — UUID of the active drawer; present only when `status === "in-progress"` |
| `secretWord` | `string \| undefined` | **NEW** — the secret word for this round; **present only for the current drawer** (viewer-conditional); omitted for all other participants |

---

## Validation Rules (additions)

| Rule | Location | Detail |
|------|----------|--------|
| `playerName` trim + non-empty | Backend `schemas.ts` | `z.string().trim().min(1)` — trims whitespace, then enforces min-length; replaces the previous `.string().min(1)` |
| `playerName` trim before send | Frontend `CreateRoomPage`, `JoinRoomPage` | Send `playerName.trim()` so stored name matches validated value |
| Single-player game start allowed | Backend `startGame()` | Remove `participants.length < 2` guard; host alone may start |
| `secretWord` viewer-gated | Backend `toRoomSnapshot()` | Include `secretWord` only when `viewerParticipantId === room.currentRound.drawerId` |

---

## State Transitions (updated)

```
lobby ──(POST /rooms/:code/start, host, ≥1 player)──▶ in-progress
```

The ≥2 player requirement from spec 001 is relaxed to ≥1 for this feature. The route
now accepts a single participant (the host/drawer).

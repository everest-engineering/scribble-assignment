# Phase 1 Data Model: Game Start & Drawer Flow

Additive changes to the Group 1 in-memory model (`backend/src/models/game.ts`,
`backend/src/services/roomStore.ts`). New fields marked **new**.

## Entities

### Participant *(unchanged shape; validation tightened)*

| Field | Type | Notes |
|-------|------|-------|
| `id` | `string` | — |
| `name` | `string` | Now **trimmed and non-empty** (FR-001…003); blank no longer coerced to "Player". |
| `joinedAt` | `string` | — |

### Room

| Field | Type | Change | Notes |
|-------|------|--------|-------|
| `code`, `status`, `hostId`, `participants`, timestamps | — | unchanged | From Groups 0–1. `status: "lobby" \| "active"`. |
| `drawerId` | `string \| undefined` | **new** | Set on start = `hostId` (FR-004). Undefined while `lobby`. |
| `secretWord` | `string \| undefined` | **new** | Set on start = deterministic pick from `STARTER_WORDS` (FR-007/008). Undefined while `lobby`. |

### RoomSnapshot *(now viewer-aware)*

| Field | Type | Change | Notes |
|-------|------|--------|-------|
| `code`, `status`, `hostId`, `participants`, `availableWords`, `roles` | — | unchanged | From Group 1. |
| `drawerId` | `string \| undefined` | **new** | Always present once started, for all viewers (so everyone sees who draws) (FR-005). |
| `role` | `"drawer" \| "guesser" \| undefined` | **new** | The **requesting viewer's** role: `drawer` iff `viewerId === drawerId`, else `guesser` (FR-006). Undefined if viewer unknown / lobby. |
| `word` | `string \| undefined` | **new** | The secret word — **included only when `viewerId === drawerId`**; omitted entirely otherwise (FR-009/010). |

## Selection function (deterministic word)

```text
selectWord(code):
    index = (sum of char codes of code) mod STARTER_WORDS.length
    return STARTER_WORDS[index]
```
Pure function of `code` → same room always yields the same word (FR-008). Computed once in `startGame`,
stored as `room.secretWord`.

## State machine (Room) — extends Group 1

```text
   lobby  ──(host start, ≥2 players: Group 1 gating)──►  active
                                                          │ on entry (this group):
                                                          │   drawerId  = hostId
                                                          │   secretWord = selectWord(code)
                                                          └─ (terminal for Group 2; restart = Group 4)
```
- While `lobby`: `drawerId` and `secretWord` are undefined.
- Invalid start requests (non-host / <2) do not enter `active` and set neither field (Group 1 behavior).

## Validation rules (traced to FRs)

| Rule | Where | FR |
|------|-------|----|
| Trim name on create & join | `schemas.ts` transform + `roomStore` | FR-001 |
| Reject blank/whitespace name (400 + message); no "Player" fallback | `schemas.ts` / `roomStore` | FR-002 |
| Store/display trimmed name | `roomStore` `createParticipant` | FR-003 |
| Exactly one drawer = host on start | `startGame` sets `drawerId = hostId` | FR-004 |
| Drawer identity visible to all | `toRoomSnapshot` always returns `drawerId` | FR-005 |
| Non-drawer identified as guesser | `toRoomSnapshot` returns `role` per viewer | FR-006 |
| Exactly one word from starter list | `startGame` sets `secretWord = selectWord(code)` | FR-007 |
| Deterministic, stable per room | pure `selectWord(code)` | FR-008 |
| Word only in drawer's view | `toRoomSnapshot` includes `word` iff viewer is drawer | FR-009 |
| Word (and length) absent from guesser view | `toRoomSnapshot` omits `word` for guessers | FR-010 |
| Group 1 behaviors preserved | no changes to host/poll/start-gating/auto-advance logic | FR-011 |

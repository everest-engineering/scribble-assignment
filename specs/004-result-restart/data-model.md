# Phase 1 Data Model: Result, Restart & Final Validation

Additive change to the Groups 1–3 in-memory model. New marked **new**.

## Entities

### Room

| Field | Type | Change | Notes |
|-------|------|--------|-------|
| `status` | `"lobby" \| "active" \| "result"` | **widened** | `result` is the ended-round state (FR-001). |
| `drawerId`, `secretWord`, `guesses`, `participants` (with `score`), timestamps | — | unchanged | Cleared/reset on restart (see below). |

### RoomSnapshot

| Field | Type | Change | Notes |
|-------|------|--------|-------|
| `status` | `"lobby" \| "active" \| "result"` | **widened** | Drives result view + post-restart return. |
| `word` | `string \| undefined` | rule change | Included when viewer is the drawer **or** `status === "result"` (revealed to all at result) (FR-003). |
| `participants[].score`, `guesses` | — | unchanged | Final scores + full history already present for all (FR-004). |

No new fields — the result reuses existing `word`/`score`/`guesses`.

## Lifecycle state machine

```text
   lobby ──(host start, ≥2 players)──► active ──(host end)──► result
     ▲                                                          │
     └───────────────── (host restart) ◄───────────────────────┘
       restart also reachable from active (host may restart without ending)
```

- **End** (`endRound`): host-only; `active → result`. Non-host → 403. (Optional: only meaningful from `active`.)
- **Restart** (`restartGame`): host-only; `result | active → lobby`. Non-host → 403.

## Operations (server) — traced to FRs

```text
endRound(code, participantId):
    room ← rooms.get(code)            else 404
    if participantId != room.hostId   → 403 "Only the host can end the round."   (FR-002)
    room.status = "result"                                                        (FR-001)
    return room

restartGame(code, participantId):
    room ← rooms.get(code)            else 404
    if participantId != room.hostId   → 403 "Only the host can restart."          (FR-007)
    room.status   = "lobby"                                                       (FR-006, FR-010)
    room.drawerId = undefined
    room.secretWord = undefined
    room.guesses  = []
    for each participant: participant.score = 0                                   (FR-009)
    // participants array itself is preserved                                     (FR-008)
    return room
```

## Word-reveal rule (toRoomSnapshot)

```text
revealWord = isDrawer OR (room.status === "result")
word = revealWord ? room.secretWord : undefined
```
Guessers see no word during `active` (Group 2 unchanged); everyone sees it in `result` (FR-003).

## Validation rules (traced to FRs)

| Rule | Where | FR |
|------|-------|----|
| Host ends round → result | `endRound` | FR-001 |
| Non-host end refused (403) | `endRound` | FR-002 |
| Word revealed to all at result | `toRoomSnapshot` | FR-003 |
| Final scores + full history visible to all | snapshot (already) | FR-004 |
| Result identical for all + polled | snapshot via ~2s poll | FR-005 |
| Host restart → lobby | `restartGame` | FR-006, FR-010 |
| Non-host restart refused (403) | `restartGame` | FR-007 |
| Participants preserved on restart | `restartGame` keeps `participants` | FR-008 |
| Round state cleared; scores reset 0 | `restartGame` | FR-009 |
| Clients return to lobby; start gating reapplies | `GamePage` status effect + Group 1 lobby | FR-010 |
| No Groups 1–3 regression | additive only | FR-011 |

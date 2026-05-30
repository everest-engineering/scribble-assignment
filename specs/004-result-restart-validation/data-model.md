# Data Model: Result, Restart & Final Validation

**Feature**: 004-result-restart-validation | **Extends**: [003 data-model](../003-gameplay-interaction/data-model.md)

## RoomStatus (extended)

```typescript
type RoomStatus = "lobby" | "playing" | "result";
```

| Status | Meaning |
|--------|---------|
| `lobby` | Waiting for host to start; no round data exposed |
| `playing` | Active round; drawer-only word; strokes/guesses mutable |
| `result` | Round ended; word public; scores/history frozen; no gameplay mutations |

## Room (internal — backend)

No new fields on `Room`. Existing round fields retained through `result`, cleared on restart.

| Field | In `playing` | In `result` | After `restart` → `lobby` |
|-------|--------------|-------------|---------------------------|
| `status` | `"playing"` | `"result"` | `"lobby"` |
| `secretWord` | set | preserved | `null` |
| `drawerParticipantId` | set | preserved | `null` |
| `strokes` | mutable | preserved (not in snapshot) | `[]` |
| `guesses` | mutable | frozen | `[]` |
| `scoredParticipantIds` | mutable | frozen | `[]` |
| `participants[].score` | mutable | frozen | `0` |
| `hostParticipantId` | preserved | preserved | preserved |
| `participants[]` | preserved | preserved | preserved (same ids/names) |

## State transitions (Scenario 4 scope)

```text
lobby ──(host start)──> playing          [Scenario 2 — unchanged]

playing ──(host end round)──> result
playing ──(drawer stroke / guesser guess)──> playing   [Scenario 3 — unchanged]

result ──(host restart)──> lobby

lobby ──(host start again)──> playing    [Scenario 2 — fresh round init]
```

### Transition rules

| Action | Preconditions | Effects |
|--------|---------------|---------|
| `endRoom` | `status === "playing"`, caller is host | `status = "result"` |
| `restartRoom` | `status === "result"`, caller is host | Clear round fields; `status = "lobby"` |
| `submitGuess` | `status === "playing"` only | Reject with `not_playing` in result |
| `addStroke` / `clearCanvas` | `status === "playing"` only | Reject with `not_playing` in result |
| `startRoom` | `status === "lobby"` only | Unchanged from Scenario 2 |

## RoomSnapshot (API response — extended)

| Field | `lobby` | `playing` | `result` |
|-------|---------|-----------|----------|
| `status` | `"lobby"` | `"playing"` | `"result"` |
| `secretWord` | omitted | drawer viewer only | **all viewers** |
| `strokes` | omitted | included | **omitted** |
| `guesses` | omitted | included | included (final) |
| `participants[].score` | `0` | live | final |
| `drawerParticipantId` | `null` | set | set (until restart) |

## Service result types (new)

```typescript
type EndRoomResult =
  | { ok: true; room: Room }
  | { ok: false; reason: "not_found" | "not_host" | "not_playing" };

type RestartRoomResult =
  | { ok: true; room: Room }
  | { ok: false; reason: "not_found" | "not_host" | "not_result" };
```

## Frontend session state

`GamePage` derives UI mode from `room.status`:

| Derived | Logic |
|---------|-------|
| `isPlaying` | `room.status === "playing"` |
| `isResult` | `room.status === "result"` |
| `showCanvas` | `isPlaying` only |
| `showSecretWord` | `(isPlaying && isDrawer) \|\| isResult` |
| `showGuessForm` | `isPlaying && !isDrawer` |
| `showEndRound` | `isPlaying && isHost` |
| `showRestart` | `isResult && isHost` |
| `shouldPoll` | `isPlaying \|\| isResult` |

## Requirement traceability

| Requirement | Data / behavior |
|-------------|-----------------|
| FR-001–FR-002 | `endRoom` host + `playing` guard |
| FR-003, FR-003a | Gameplay mutations require `playing` |
| FR-004–FR-006 | Result snapshot: word all, guesses, scores |
| FR-004a, FR-007a | No strokes in result snapshot; same `/game` route |
| FR-007 | Poll while `playing` or `result` |
| FR-008–FR-011 | `restartRoom` host guard + lobby reset |
| FR-012 | `/game` redirects when `status === "lobby"` |
| FR-010 | Restart clearing table above |

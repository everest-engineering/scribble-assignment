# Data Model: Result, Restart & Final Validation

**Feature**: `004-result-restart` | **Date**: 2026-05-31

## Status Extension

```text
RoomStatus = "lobby" | "playing" | "result"
```

| Status | Meaning |
|--------|---------|
| `lobby` | Waiting for host to start; join allowed |
| `playing` | Active round; draw/guess allowed per role rules |
| `result` | Round ended; read-only outcome display |

## State Transitions

```text
lobby ──(host startGame)──► playing
                              │
                              ├── (correct guess) ──► result
                              │
result ──(host restartRoom)──► lobby
                                │
                                └── (host startGame) ──► playing  (new round)
```

## Room Fields by Status

| Field | lobby | playing | result | After restart |
|-------|-------|---------|--------|---------------|
| `participants` | ✓ | ✓ | ✓ | preserved |
| `hostId` | ✓ | ✓ | ✓ | preserved |
| `code` | ✓ | ✓ | ✓ | preserved |
| `drawerId` | null | set | set (historical) | null |
| `secretWord` | null | set | set | null |
| `scores` | {} | live | frozen final | {} |
| `strokes` | [] | live | frozen | [] |
| `guesses` | [] | live | frozen | [] |

During `result`, round fields are **read-only** (mutations rejected).

## Snapshot Rules (`toRoomSnapshot`)

| Field | lobby | playing | result |
|-------|-------|---------|--------|
| `availableWords` | ✓ | omit | omit |
| `secretWord` | omit | drawer only | **all viewers** |
| `scores` | {} or omit | ✓ | ✓ |
| `guesses` | [] | ✓ | ✓ |
| `strokes` | [] | ✓ | ✓ (optional UI) |

## Validation Rules

| Action | Allowed when |
|--------|----------------|
| `startGame` | `status === "lobby"`, host, ≥2 players |
| `appendStroke` / `clearStrokes` | `status === "playing"`, caller is drawer |
| `submitGuess` | `status === "playing"`, caller is guesser |
| `restartRoom` | `status === "result"`, caller is host |
| `joinRoom` | `status === "lobby"` only |

## Round End Side Effects

On correct guess in `submitGuess`:

1. Append guess record (correct: true)
2. Add 100 to guesser score
3. Set `room.status = "result"`
4. Update `updatedAt`

No further mutations except `restartRoom`.

## Restart Side Effects

On successful `restartRoom`:

```text
status = "lobby"
drawerId = null
secretWord = null
scores = {}
strokes = []
guesses = []
updatedAt = now()
```

Participants and `hostId` unchanged.

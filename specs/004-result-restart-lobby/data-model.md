# Data Model: Round Results and Lobby Restart

**Feature**: `004-result-restart-lobby` | **Date**: 2026-06-01

## Room (extensions)

| Field | Type | Notes |
|-------|------|-------|
| `status` | includes `"result"` | After first correct guess |
| `revealedWord` | string | Set at round end; visible to all in result |
| `secretWord` | string | Hidden during drawing; same value as revealed after end |
| `guesses` | `Guess[]` | Full round history while in result |
| `canvasStrokes` | array | Read-only on result screen optional; cleared on restart |

## RoomSnapshot (result)

| Field | Notes |
|-------|-------|
| `revealedWord` | All participants (FR-002) |
| `participants[].score` | Session totals (FR-003) |
| `guesses` | Full round history (FR-004) |
| `viewer` | No role-based word hiding in result |

## State transitions

```text
drawing --first correct guess--> result
result --POST restart (host)--> lobby (scores 0, round fields cleared)
lobby --POST start--> drawing (feature 002)
```

## restartGame clears

- `revealedWord`, `secretWord`, `drawerParticipantId`, `canvasStrokes`, `guesses`, participant `role`, `roundNumber` reset
- `participants[].score = 0`
- `status = "lobby"`

## Join rules (001 extension)

- Allow join when `status === "lobby"` or `status === "result"`
- Reject when `status === "drawing"`

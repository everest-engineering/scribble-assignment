# Data Model: Round Result & Restart

## Entity Changes

### Room (existing — extended)

| Field | Type | Change |
|-------|------|--------|
| `status` | `"lobby" \| "awaiting_rename" \| "playing" \| "result"` | Extended — added `"result"` value |

**Validation rules**:
- Status can only transition: `"playing"` → `"result"` (via round end), `"result"` → `"lobby"` (via restart)
- `currentRound` MUST be non-null when status is `"result"`
- `currentRound` MUST be null when status returns to `"lobby"` after restart
- Participants list MUST be unchanged across the `"result"` → `"lobby"` transition

### Round (existing — unchanged)

No structural changes. The existing `Round` entity serves as the result data container when `room.status === "result"`. Key fields reused for result display:

| Field | Usage in Result |
|-------|-----------------|
| `word` | Displayed as "the correct word" to all players |
| `guesses` | Displayed as full guess history (chronological) |
| `scores` | Displayed as ranked final scores |
| `drawerId` | Used to identify non-participating scorers |
| `roundNumber` | Displayed as reference |

### Player (existing — unchanged)

Persists across restart. No fields added. Scores are reset via the `scores` map being cleared on restart.

## State Transitions

```
                    submitGuess (all correct)
  ┌──────────┐  ──────────────────────────>  ┌──────────┐
  │ playing  │                                │  result  │
  └──────────┘  <── POST /:code/restart ────  └──────────┘
       │                                           │
       │  (round active)                     (scores, word,
       │   drawer draws,                     guesses visible
       │   guessers guess)                   to all players)
       │                                           │
       │                                           │ restart:
       │                                     clears currentRound,
       │                                     resets scores,
       │                                     status → "lobby"
       v                                           v
  ┌──────────┐                                     │
  │  lobby   │  <──────────────────────────────────┘
  └──────────┘
       │
       │ startGame:
       │ creates new Round,
       │ status → "playing"
       v
  ┌──────────┐
  │ playing  │
  └──────────┘
```

## Validation Rules (from spec)

- **FR-001**: Round end triggers status transition `"playing"` → `"result"`. All players receive the result screen on next poll.
- **FR-006**: Restart action requires `participant.isHost === true`. Non-host requests return 403.
- **FR-008**: After restart, `room.participants` MUST be identical to pre-restart participants (same count, same IDs, same names).
- **FR-009**: After restart, `room.currentRound` MUST be `null`, all scores reset to 0.

## Key Design Decisions

- **No separate RoundResult entity**: The existing `Round` serves as the result payload. The `"result"` status signals to the frontend that the round data should be displayed in read-only result mode.
- **Host transfer on disconnect**: When the host disconnects during `"result"` state, the `isHost` flag transfers to the next eligible participant. The result screen remains unchanged — the new host gains the restart button.
- **All players see the word**: In `"result"` state, `toRoomSnapshot` includes `currentWord` for ALL viewers (not just the drawer), since the round is over.

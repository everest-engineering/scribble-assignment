# Data Model: Result, Restart & Final Validation

## Participant (updated)

```
Participant {
  id: string          (UUID, unchanged)
  name: string        (unchanged, now max 20 chars validated by Zod)
  joinedAt: string    (ISO timestamp, unchanged)
  lastSeenAt: string  (ISO timestamp, NEW — updated on every GET /:code poll)
}
```

## Room (updated)

```
Room {
  // Existing fields (unchanged):
  code: string
  status: "lobby" | "playing"
  hostId: string
  participants: Participant[]
  createdAt: string
  updatedAt: string
  currentRound?: number
  drawerId?: string
  secretWord?: string
  strokes: DrawingStroke[]
  guessHistory: GuessEntry[]
  scores: Record<string, ParticipantScore>
  lastRoundResult?: RoundResult
  lastRoundResultSetAt?: number

  // NEW:
  skipSuggested: boolean  // true when non-host player requests skip
}
```

## RoomSnapshot (updated)

```
RoomSnapshot {
  // Existing fields (unchanged):
  code: string
  status: "lobby" | "playing"
  hostId: string
  participants: Participant[]
  availableWords: string[]
  roles: ParticipantRole[]
  currentRound?: number
  drawerId?: string
  secretWord?: string
  strokes: DrawingStroke[]
  guessHistory: GuessEntry[]
  scores: Record<string, ParticipantScore>
  lastRoundResult?: RoundResult

  // NEW (computed in toRoomSnapshot()):
  hostDisconnected?: boolean    // true if host's lastSeenAt > 30s ago
  drawerDisconnected?: boolean  // true if playing + drawer's lastSeenAt > 30s ago
  skipSuggested?: boolean       // from Room.skipSuggested
}
```

## Validation Rules

### Participant Name

- Must be non-empty after trimming
- Max 20 characters (new, enforced by Zod)
- Validation applies to: `POST /rooms`, `POST /rooms/:code/join`

### New Endpoint Validation

| Endpoint | Field | Type | Required | Rules |
|----------|-------|------|----------|-------|
| POST /:code/restart | playerId | string | yes | Must match hostId |
| POST /:code/claim-host | participantId | string | yes | Must exist in participants |
| POST /:code/skip-round | playerId | string | yes | Must match hostId, no correct guess in current round |
| POST /:code/suggest-skip | participantId | string | yes | Must exist in participants |

## State Transitions

### Room Status Transitions

```
[Created as "lobby"] → startGame() → ["playing"] → restartGame() → ["lobby"]
                                                       ↑              ↓
                                                  (restart from    (start new game)
                                                   result screen)
```

### Round Lifecycle (with Disconnect Detection)

```
Round Active → correctGuess() → [Round Result Displayed]
             → skipRound()    → [Round Result Displayed]
             → restartGame()  → [Back to Lobby]

During Round Active:
  - Host stops polling for 30s → hostDisconnected = true
  - Drawer stops polling for 30s → drawerDisconnected = true
  - Non-host clicks Notify Host → skipSuggested = true
  - Host sees skipSuggested badge → clicks Skip Round
  - Someone claims host → hostId changes, hostDisconnected = false
```

## lastSeenAt Update Strategy

```
GET /:code?participantId=XXX
  → Find participant in room.participants
  → Set participant.lastSeenAt = now()
  → (continue to build snapshot)
  → lastSeenAt is included in the snapshot for this participant
```

Important: `lastSeenAt` is NOT updated on POST endpoints (restart, claim-host, etc.). Only GET /:code updates it. This means claiming host does not itself prevent the original host from appearing disconnected — the new host's next poll updates their lastSeenAt.

## Disconnect Computation

```ts
function isDisconnected(participant: Participant): boolean {
  const elapsed = Date.now() - new Date(participant.lastSeenAt).getTime();
  return elapsed > 30000; // 30 seconds
}

// In toRoomSnapshot():
const host = room.participants.find(p => p.id === room.hostId);
snapshot.hostDisconnected = host ? isDisconnected(host) : false;

if (room.status === "playing" && room.drawerId) {
  const drawer = room.participants.find(p => p.id === room.drawerId);
  snapshot.drawerDisconnected = drawer ? isDisconnected(drawer) : false;
}

snapshot.skipSuggested = room.skipSuggested ?? false;
```

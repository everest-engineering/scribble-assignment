# Data Model: Result, Restart & Final Validation

## Modified: `Room`

The `status` field gains a third value: `"ended"`.

```
Room {
  // --- existing fields (unchanged) ---
  code:         string
  hostId:       string
  drawerId:     string | null
  currentWord:  string | null
  status:       "lobby" | "active" | "ended"    ← "ended" is new
  participants: Participant[]
  strokes:      Stroke[]
  guesses:      Guess[]
  scores:       Record<string, number>
  createdAt:    string
  updatedAt:    string
}
```

No new fields are added to `Room`. The only change is the extended union type for `status`.

---

## Modified: `RoomSnapshot`

The `status` field gains the same third value, and `currentWord` visibility rules change when `status === "ended"`.

```
RoomSnapshot {
  // --- existing fields ---
  code:         string
  hostId:       string
  drawerId:     string | null
  currentWord:  string | null   ← null for non-drawers when "active"; always set when "ended"
  status:       "lobby" | "active" | "ended"    ← "ended" is new
  participants: Participant[]
  availableWords: string[]
  roles:        ParticipantRole[]
  strokes:      Stroke[]
  guesses:      Guess[]
  scores:       Record<string, number>
}
```

**`currentWord` visibility rule** (updated in `toRoomSnapshot`):
- `status === "active"`: `currentWord` is `null` for any viewer who is not the drawer (unchanged from Feature 002).
- `status === "ended"`: `currentWord` is always the actual word — revealed to all players.
- `status === "lobby"`: `currentWord` is `null` for all viewers (unchanged).

---

## State Transitions

```
POST /rooms/:code/end   (host only, must be "active")
  └─ room.status: "active" → "ended"
  └─ all other fields unchanged

POST /rooms/:code/restart   (host only, must be "ended")
  └─ room.status: "ended" → "lobby"
  └─ room.currentWord = null
  └─ room.drawerId    = null
  └─ room.strokes     = []
  └─ room.guesses     = []
  └─ room.scores      = {}
  └─ room.participants: PRESERVED (no change)
```

Full room lifecycle:

```
createRoom
  └─ status="lobby", currentWord=null, drawerId=null, strokes=[], guesses=[], scores={}

POST /rooms/:code/start  (host only)
  └─ status="lobby" → "active"
  └─ drawerId assigned, currentWord selected, scores initialized

POST /rooms/:code/end  (host only)   ← NEW
  └─ status="active" → "ended"

POST /rooms/:code/restart  (host only)   ← NEW
  └─ status="ended" → "lobby"
  └─ round state cleared, participants preserved
```

---

## Validation Rules

| Endpoint | Rule | Error |
|----------|------|-------|
| `POST /rooms/:code/end` | Caller must be host (`participantId === room.hostId`) | 403 |
| `POST /rooms/:code/end` | Room must be `"active"` | 400 |
| `POST /rooms/:code/restart` | Caller must be host (`participantId === room.hostId`) | 403 |
| `POST /rooms/:code/restart` | Room must be `"ended"` | 400 |

No new entity types are introduced by this feature.

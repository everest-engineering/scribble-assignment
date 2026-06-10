# Data Model: Game Start & Drawer Flow

## Room (extended again)

```
Room {
  code:         string           // 4-char uppercase, unique
  status:       "lobby" | "active" | "completed"
  hostId:       string           // from FG1
  drawerId:     string | null    // ← NEW: set at game start, null in lobby
  secretWord:   string | null    // ← NEW: set at game start, null in lobby
  participants: Participant[]
  createdAt:    string           // ISO 8601
  updatedAt:    string           // ISO 8601
}
```

**Validation rules**:
- `drawerId` is set to `room.hostId` when status transitions to `"active"`.
- `secretWord` is set to `STARTER_WORDS[0]` when status transitions to `"active"`.
- Both are `null` while status is `"lobby"` or `"completed"`.

## RoomSnapshot (viewer-specific)

```
RoomSnapshot {
  code:           string
  status:         "lobby" | "active" | "completed"
  hostId:         string
  drawerId:       string | null    // ← NEW: always included (lets UI mark the drawer)
  secretWord:     string | null    // ← NEW: only non-null when viewer === drawer
  participants:   Participant[]
  availableWords: string[]
  roles:          ParticipantRole[]
}
```

**Viewer-specific behaviour**:
- `secretWord` is populated (`"rocket"`) only when the requesting `participantId` matches
  `drawerId`.
- `secretWord` is `null` for all other viewers (guessers and unauthenticated fetches).
- `drawerId` is always exposed so all clients can render the "Drawing" label next to that
  participant.

## State Transitions (updated)

```
[createRoom]  ──► lobby   (drawerId=null, secretWord=null)
lobby         ──► active  (drawerId=hostId, secretWord=STARTER_WORDS[0])
active        ──► completed
completed     ──► lobby   (drawerId=null, secretWord=null on restart)
```

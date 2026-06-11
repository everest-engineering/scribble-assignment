# Data Model: Game Start & Drawer Flow

## Round

| Field | Type | Description |
|-------|------|-------------|
| `roundNumber` | `number` | 1-indexed round number. First round is 1. |
| `drawerId` | `string` | Participant ID of the drawer for this round |
| `secretWord` | `string` | The word selected for this round. Never exposed to guessers. |

**Validation rules**:
- `roundNumber` MUST be >= 1
- `drawerId` MUST match a participant ID in the room
- `secretWord` MUST be one of the words from `STARTER_WORDS`
- Only one round may exist per room (first round); subsequent rounds extend the same `rounds` array

## Room (extended)

New fields added to the existing Room model:

| Field | Type | Description |
|-------|------|-------------|
| `rounds` | `Round[]` | Array of completed and active rounds. Empty while in "lobby" status. |

**Validation rules**:
- `rounds` MUST be empty when `status === "lobby"`
- `rounds` MUST have exactly 1 entry when `status === "playing"` (first round)
- `rounds` is appended to, never mutated in place (immutable append)

## RoomSnapshot (extended)

New fields added to the existing RoomSnapshot response:

| Field | Type | Description |
|-------|------|-------------|
| `roundNumber` | `number \| null` | Current active round, or null if still in lobby |
| `drawerId` | `string \| null` | Drawer participant ID for current round, or null if lobby |
| `yourRole` | `"drawer" \| "guesser" \| null` | Role of the viewer participant, computed server-side |
| `wordForDrawer` | `string \| undefined` | Secret word — only present when viewer is the drawer |
| `wordLength` | `number \| null` | Character count of secret word, or null if lobby |

**Validation rules**:
- `yourRole` MUST be `"drawer"` when `viewerParticipantId === drawerId`
- `yourRole` MUST be `"guesser"` when `viewerParticipantId !== drawerId` and room is playing
- `wordForDrawer` MUST be `undefined` when viewer is not the drawer
- `wordLength` MUST equal `secretWord.length`

## State Transitions

```
lobby + host starts game
  └─→ playing + round 1 created
       ├─ drawer: sees secretWord
       └─ guessers: see drawerId + wordLength
```

## Word Selection

The secret word is deterministically selected using:

```
index = abs(hash(roomCode) + (roundNumber - 1)) % STARTER_WORDS.length
word = STARTER_WORDS[index]
```

Where the hash function iterates over each character of the room code:
```
hash = 0
for each char in roomCode:
  hash = (hash * 31 + charCode) | 0  // 32-bit integer overflow
```

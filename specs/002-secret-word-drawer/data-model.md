# Data Model: Secret Word Drawer

## Room

- **Fields**
  - `code`: Unique 4-character room code
  - `status`: Current room status, starting at `lobby`
  - `participants`: Ordered list of participants currently in the room
  - `round`: Active round state, present once the game starts
  - `createdAt`: Creation timestamp
  - `updatedAt`: Last mutation timestamp
- **Validation rules**
  - `code` must be unique among active rooms
  - `status` must be a known room status
  - A room created through the API starts with exactly one participant
- **Relationships**
  - Contains many `Participant` records
  - May contain one active `Round` record
- **State transitions**
  - `lobby` is the initial state
  - The room transitions to `game` when the host starts the first round

## Participant

- **Fields**
  - `id`: Unique participant identifier
  - `name`: Display name shown in the lobby and round views
  - `joinedAt`: Timestamp of when the player joined
- **Validation rules**
  - Name must not be empty after trimming
  - A participant belongs to exactly one room at a time
- **Relationships**
  - Belongs to one `Room`

## Round

- **Fields**
  - `drawerParticipantId`: Participant id of the first player in the room
  - `secretWord`: Word chosen by the host from the starter list
  - `startedAt`: Timestamp when the round began
- **Validation rules**
  - `drawerParticipantId` must refer to the first participant in the room
  - `secretWord` must come from the starter word list
  - `secretWord` must remain unchanged for the lifetime of the round
- **Relationships**
  - Belongs to one `Room`

## RoomSnapshot

- **Fields**
  - `code`: Room code
  - `status`: Current room status
  - `participants`: Current room participants
  - `availableWords`: Starter word list
  - `roles`: Starter role list
  - `drawerParticipantId`: The participant currently assigned as drawer
  - `secretWord`: Present only for the drawer viewer
- **Validation rules**
  - Snapshot content must reflect the current active room only
  - Snapshot must not expose the secret word to guessers
  - Snapshot must not expose participants from other rooms

## RoomSessionResponse

- **Fields**
  - `participantId`: Viewer identity for the current session
  - `room`: Initial snapshot returned when creating, joining, or starting
- **Validation rules**
  - Must return a valid participant identifier for later room refreshes

## Derived Rules

- The first participant in a newly created room is the drawer for the first round.
- The host selects the secret word from the starter word list when the round
  starts.
- The drawer sees the secret word in their snapshot; guessers see the same room
  state without it.
- Player names are trimmed before storage and rejected if they become empty.

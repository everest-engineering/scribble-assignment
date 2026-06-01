# Data Model: Host and Join Lobby Flow

## Room

- **Fields**
  - `code`: Unique 4-character room code
  - `status`: Current room status, starting at `lobby`
  - `participants`: Ordered list of participants currently in the room
  - `createdAt`: Creation timestamp
  - `updatedAt`: Last mutation timestamp
- **Validation rules**
  - `code` must be unique among active rooms
  - `status` must be a known room status
  - A room created through the API starts with exactly one participant
- **Relationships**
  - Contains many `Participant` records
- **State transitions**
  - `lobby` is the initial state
  - The room may later transition to a game state when the host starts play

## Participant

- **Fields**
  - `id`: Unique participant identifier
  - `name`: Display name shown in the lobby
  - `joinedAt`: Timestamp of when the player joined
- **Validation rules**
  - Name must not be empty after trimming
  - A participant belongs to exactly one room at a time
- **Relationships**
  - Belongs to one `Room`

## RoomSnapshot

- **Fields**
  - `code`: Room code
  - `status`: Current room status
  - `participants`: Current room participants
  - `availableWords`: Starter word list
  - `roles`: Starter role list
- **Validation rules**
  - Snapshot content must reflect the current active room only
  - Snapshot must not expose participants from other rooms

## RoomSessionResponse

- **Fields**
  - `participantId`: Viewer identity for the current session
  - `room`: Initial snapshot returned when creating or joining
- **Validation rules**
  - Must return a valid participant identifier for later room refreshes

## Derived Rules

- The first participant in a newly created room is the host.
- A room should only be startable when at least two participants are present.
- Room membership changes must be visible to the lobby through polling.

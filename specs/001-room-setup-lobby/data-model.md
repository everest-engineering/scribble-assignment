# Data Model: Room Setup & Lobby

## Room

Represents a multiplayer game session scoped by a unique room code.

Fields:
- `code`: string — unique room identifier shared between players
- `status`: string — current room phase, e.g. `lobby`
- `participants`: Participant[] — list of players currently in the room
- `createdAt`: string — ISO timestamp when the room was created
- `updatedAt`: string — ISO timestamp for the latest room activity

## Participant

Represents a player in a room.

Fields:
- `id`: string — unique participant identifier
- `name`: string — display name for the participant
- `joinedAt`: string — ISO timestamp when the participant joined the room

## RoomSnapshot

The subset of room state returned to clients.

Fields:
- `code`: string
- `status`: string
- `participants`: Participant[]
- `availableWords`: string[]
- `roles`: string[]

## Key Relationships

- A Room contains one or more Participants.
- A RoomSnapshot is derived from a Room for client consumption.

## Validation Rules

- `code` must be non-empty and canonicalized to uppercase.
- `name` may be optional at creation/join, but the server will default it to `Player`.
- Join requests must only succeed if the provided room code matches an active room.
- The host is implicitly the first participant in the room. Only that participant may start the game.

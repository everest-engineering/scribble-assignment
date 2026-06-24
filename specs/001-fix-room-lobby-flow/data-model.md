# Data Model: Fix Room Lobby Flow

No new entities are introduced by this feature. Existing entities are documented
below for reference.

## Room

| Field | Type | Description |
|-------|------|-------------|
| code | string | Unique 4-character room code |
| status | "lobby" | Current room status |
| participants | Participant[] | Players in the room |
| createdAt | string (ISO) | Room creation timestamp |
| updatedAt | string (ISO) | Last update timestamp |

## Participant

| Field | Type | Description |
|-------|------|-------------|
| id | string | Server-assigned UUID |
| name | string | Player display name |
| joinedAt | string (ISO) | Join timestamp |

## RoomSnapshot

Read-only projection of Room returned by the API:

| Field | Type | Description |
|-------|------|-------------|
| code | string | Room code |
| status | "lobby" | Current status |
| participants | Participant[] | Visible participants |
| availableWords | string[] | Word pool for drawing rounds |
| roles | ("drawer" \| "guesser")[] | Role assignments |

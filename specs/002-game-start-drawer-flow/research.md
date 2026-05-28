# Research: Game Start and Drawer Flow

## Needs Clarification Resolution

All clarifications were resolved during the specification phase:
- **Masking behavior**: Decided to send `secretWord: null` for guessers.
- **Validation message**: Decided on explicit "Name cannot be empty or whitespace".

## Current State Analysis

### Backend
- **Room Store (`backend/src/services/roomStore.ts`)**: Currently transitions `status` to `"playing"` in the `startGame` method. It does NOT currently assign roles or set a secret word. `toRoomSnapshot` ignores the `viewerParticipantId` argument.
- **Models (`backend/src/models/game.ts`)**: `ParticipantRole` is defined (`"drawer" | "guesser"`), but not actually attached to the `Participant` interface. `Room` does not track `secretWord`. `RoomSnapshot` does not track `secretWord` either.
- **API (`backend/src/api/rooms.ts`)**: The `GET /:code` endpoint accepts `participantId` from query params, but the underlying store doesn't use it yet for masking. Late join blocking is not implemented.

### Frontend
- **Game Page (`frontend/src/pages/GamePage.tsx`)**: Contains hardcoded placeholder HTML for both drawing tools and guesser inputs. It needs to conditionally render these blocks based on the local player's assigned role.
- **Store (`frontend/src/state/roomStore.ts`)**: Already fetches and receives the `RoomSnapshot` and stores `participantId`. We can derive the local player's role by looking up `participantId` in `room.participants`.

## Implementation Strategy

1. **Models**: Update `Participant` to include `role: ParticipantRole | null`. Update `Room` to include `secretWord: string | null`. Update `RoomSnapshot` to include `secretWord: string | null`.
2. **Game Logic**: In `roomStore.ts -> startGame`, loop through participants. If `id === hostId`, set `role = "drawer"`. Otherwise set `role = "guesser"`. Set `room.secretWord = "rocket"`.
3. **Masking Logic**: In `roomStore.ts -> toRoomSnapshot`, locate the viewer's `participant` object using `viewerParticipantId`. If the viewer's role is `"drawer"`, include `room.secretWord` in the snapshot. Otherwise, set it to `null`.
4. **Late Join Protection**: In `roomStore.ts -> joinRoom`, return an error or null if `room.status === "playing"`. Update `api/rooms.ts` to handle this explicitly and return `403 Forbidden`.
5. **Frontend Rendering**: In `GamePage.tsx`, find the current participant from the list. If `role === "drawer"`, show the Canvas block. If `role === "guesser"`, show the Guess Form block.

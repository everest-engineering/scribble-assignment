# Research: Host Start Control

**Date**: 2026-07-06 | **Phase**: 0 (Outline & Research)

## Key Decisions

### Host Identification: RoomStore participantId + isHost

- **Decision**: Derive host status by comparing `roomStore.participantId` with the current `room.participants` array to find the current user's participant object and check its `isHost` flag.
- **Rationale**: The roomStore already stores `participantId` (set on create/join). The room snapshot includes all participants with their `isHost` flags. No new data or endpoints needed.
- **Alternatives considered**:
  - Backend `GET /rooms/:code` returning a `isHost` flag for the requesting participant: Would require endpoint changes — unnecessary since we can derive it client-side.

### Minimum Player Check: room.participants.length

- **Decision**: Check `room.participants.length >= 2` to determine if the button should be enabled.
- **Rationale**: The participant list is always up-to-date via auto-polling (Feature 004). Length directly reflects player count.
- **Alternatives considered**:
  - Backend-side validation on a "start game" endpoint: Not needed yet since "start game" currently just navigates. If a backend start endpoint is added later, server-side validation should be added then.

### Button States

- **Decision**: Three states based on role + player count:
  - Host + >= 2 players → enabled button
  - Host + < 2 players → disabled button with "Need at least 2 players to start" message
  - Non-host → no button shown; "Waiting for host to start the game..." message already exists in status card
- **Rationale**: Disabled button (not hidden) for the host when < 2 players maintains discoverability — the host can see the button and understands the requirement.

### Existing Patterns Confirmed

- `roomStore.getSnapshot().room.participants` — array of participants with `id`, `name`, `isHost`
- `roomStore.getSnapshot().participantId` — current user's participant ID (set from createRoom/joinRoom response)
- Current user's host status: `room.participants.find(p => p.id === participantId)?.isHost ?? false`
- The status card already shows "Waiting for the host to start the game." — this works for non-host participants

# Research: Room Setup And Lobby

## Overview

No NEEDS CLARIFICATION markers existed in the spec. All technical context was resolved by examining the existing codebase. This research documents the key architectural decisions for the feature.

## Architecture Decisions

### Decision 1: Host Designation via Participant ID
- **Decision**: The room creator's participant ID is stored as `hostId` on the Room model
- **Rationale**: Participant IDs are UUIDs generated server-side, making them unforgeable. The host check is done by comparing the request's `participantId` against the stored `hostId`. No authentication or session mechanism needed (per project constraints).
- **Alternatives considered**: Storing host as a boolean on the Participant — rejected because it conflates identity with role and makes host transfer harder.

### Decision 2: Auto-Polling in the Frontend
- **Decision**: `LobbyPage` uses `setInterval` at 2000ms to call `roomStore.fetchRoom()` when the component mounts, clearing the interval on unmount
- **Rationale**: Matches the spec's "~2 second" polling requirement. Uses existing `fetchRoom` API. Cleanup via `useEffect` return prevents leaks.
- **Alternatives considered**: WebSockets — rejected (per project constraints). Server-Sent Events — rejected (over-engineered for polling requirement). Manual refresh only — rejected (spec requires auto-refresh).

### Decision 3: Empty Code Validation
- **Decision**: Client-side validation blocks empty codes before submission with "Please enter a room code"; server-side also rejects empty strings with 400 status
- **Rationale**: Dual validation provides immediate UX feedback and defense-in-depth. Client catches it before network round-trip; server catches it in case of direct API calls.
- **Alternatives considered**: Server-only validation — rejected (worse UX, unnecessary delay).

### Decision 4: Start Game Endpoint
- **Decision**: New `POST /rooms/:code/start` endpoint that accepts `participantId` in body; checks that the participant is the host and at least 2 players are present; transitions room status from `lobby` to an active game state
- **Rationale**: Dedicated endpoint ensures the start action is authorized and validated server-side. The host check prevents non-hosts from starting.
- **Alternatives considered**: PATCH to room status — rejected (less explicit, harder to authorize).

### Decision 5: Room Status Expansion
- **Decision**: Add `"playing"` to the `RoomStatus` type (currently only `"lobby"`)
- **Rationale**: The start game action needs to transition the room out of lobby state. Future game phases will use additional statuses.
- **Alternatives considered**: Keeping only `"lobby"` and tracking game state separately — rejected (unnecessary indirection).

## Existing Patterns Confirmed

| Pattern | Source | Status |
|---------|--------|--------|
| Express Router with try/catch + next(error) | `rooms.ts` | Follow |
| Zod schema parsing in route handler | `schemas.ts` | Follow |
| Room snapshot pattern (toRoomSnapshot) | `roomStore.ts` | Extend |
| RoomStore class + Context + useSyncExternalStore | `roomStore.tsx` | Extend |
| API client with typed request function | `api.ts` | Extend |
| CSS class naming (BEM-like) | Components | Follow |

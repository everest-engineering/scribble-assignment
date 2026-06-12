# Research: Room Creation and Join

## Decisions

### Polling Interval
- **Decision**: 2-second `setInterval` in `LobbyPage.tsx` calling `fetchRoom`.
- **Rationale**: Matches the spec requirement (FR-008) and aligns with Constitution Principle III (HTTP Polling Only). A 2s interval balances responsiveness with server load for the expected scale (< 100 rooms).
- **Alternatives considered**: 1s (too aggressive for evaluation load), 5s (too slow for UX).

### No New Dependencies
- **Decision**: Use only existing dependencies (Express, React, Zod, vitest).
- **Rationale**: The starter already provides everything needed. Adding libraries (e.g., react-query for polling, nanoid for codes) would violate Constitution Principle IV (Extend the Starter).
- **Alternatives considered**: `nanoid` for room codes (rejected — existing `generateCode` in `roomStore.ts` is sufficient).

### Host Tracking
- **Decision**: Add `hostParticipantId` to the `Room` model.
- **Rationale**: The spec requires host designation and host-only game start. Tracking by participant ID is unambiguous and avoids edge cases with duplicate names.
- **Alternatives considered**: `isHost` boolean on `Participant` (rejected — less explicit for transfer logic and complicates snapshot filtering).

### Input Validation
- **Decision**: Reject empty/whitespace-only `playerName` at the API layer using Zod, and trim valid names before storage.
- **Rationale**: Prevents garbage data at the boundary. Frontend mirrors validation for immediate feedback.
- **Alternatives considered**: Allow empty names and default to "Player" (rejected — violates FR-005 and spec edge cases).

### Room Cleanup
- **Decision**: Immediate deletion when participant count reaches 0; 10-minute idle timeout for non-empty rooms in lobby status.
- **Rationale**: Matches spec clarification #2 and Constitution Principle II (In-Memory State Discipline).
- **Alternatives considered**: No cleanup (rejected — memory leak risk).

### Game Start Endpoint
- **Decision**: New `POST /rooms/:code/start` endpoint guarded by host verification and minimum player count.
- **Rationale**: Centralizes state transition logic and prevents race conditions between clients.
- **Alternatives considered**: Client-side only start button (rejected — cannot enforce host-only or minimum players reliably).

## Unknowns Resolved

All technical context items were resolved from the existing starter codebase. No external research required.

# Research: Host Tracking on Room Creation

**Phase**: 0 | **Date**: 2026-07-05 | **Input**: Feature spec + codebase exploration

## Scope & Findings

### Decision: Data Model — `hostId` + `isHost`

- **Decision**: Add both `hostId: string` to Room (for O(1) host lookup) and `isHost: boolean` to Participant (for per-participant display).
- **Rationale**: Future host-only permission checks (start game, restart) need efficient host identification without scanning the participants array. The `isHost` flag on Participant enables simple conditional rendering in the frontend.
- **Alternatives considered**:
  - `isHost` only on Participant (O(n) scan to find host — fine for current scale but less future-proof)
  - `hostId` only on Room (frontend needs to match IDs to render labels — more complex UI logic)

### Decision: Existing Patterns to Follow

- **Mutation style**: `joinRoom()` uses in-place mutation (`push`) — follow this pattern for consistency (per Brownfield principle). `createRoom()` already constructs a new Room object.
- **Snapshot creation**: `toRoomSnapshot()` uses `{ ...participant }` spread — new boolean fields propagate automatically. No snapshot structure changes needed.
- **Type extension**: Add fields to existing interfaces in `game.ts` (backend) and `api.ts` (frontend) rather than creating new types.

### Code Locations Verified

| Area | File | Lines | What We Learned |
|------|------|-------|-----------------|
| Participant type | `backend/src/models/game.ts` | 4-8 | Current fields: id, name, joinedAt |
| Room type | `backend/src/models/game.ts` | 10-16 | Current fields: code, status, participants, createdAt, updatedAt |
| Room creation | `backend/src/services/roomStore.ts` | 52-68 | Creator added as first participant; room stored in Map |
| Join room | `backend/src/services/roomStore.ts` | 70-86 | New participant pushed to existing participants array (in-place mutation) |
| Snapshot projection | `backend/src/services/roomStore.ts` | 99-109 | `{ ...participant }` spread — new fields propagate automatically |
| Participant creation | `backend/src/services/roomStore.ts` | 36-42 | Returns `{ id, name, joinedAt }` — add `isHost` param |
| Frontend Participant type | `frontend/src/services/api.ts` | 3-8 | Mirrors backend Participant |
| Frontend RoomStore | `frontend/src/state/roomStore.ts` | 1-130 | Uses useSyncExternalStore; no change needed for new fields |
| Lobby participant display | `frontend/src/pages/LobbyPage.tsx` | 49-56 | Renders `participant.name` in a list — add host badge |
| Game player info | `frontend/src/pages/GamePage.tsx` | 50-66 | Shows viewer's name + "Playing" status — add host label |
| Scoreboard placeholder | `frontend/src/components/Scoreboard.tsx` | 1-14 | Static "Waiting for players..." — needs update per spec |
| Backend tests | `backend/src/services/roomStore.test.ts` | — | Tests for createRoom/joinRoom — need new field assertions |
| Frontend tests | `frontend/src/services/api.test.ts` | — | Tests API calls — no assertion changes needed (type-only) |

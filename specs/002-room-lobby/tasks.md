# Tasks: Room & Lobby Sync

**Input**: [plan.md](./plan.md), [spec.md](./spec.md)

## Phase 1: Backend

- [ ] T001 Add `hostId` to room state and set it when a room is created in `backend/src/services/roomStore.ts`.
- [ ] T002 Validate `playerName` trim and non-empty admission in `backend/src/api/schemas.ts`.
- [ ] T003 Implement room join validation for empty or invalid codes in `backend/src/api/rooms.ts`.
- [ ] T004 Ensure room snapshots include `hostId`, `participants`, and `status` in `backend/src/services/roomStore.ts`.

## Phase 2: Frontend

- [ ] T005 Add lobby polling in `frontend/src/state/roomStore.ts` that refreshes room state every 2 seconds.
- [ ] T006 Show the participant roster in `frontend/src/pages/LobbyPage.tsx` and highlight the host.
- [ ] T007 Enable the start button only for the host when `participants.length >= 2`.

## Phase 3: Validation

- [ ] T008 Manually verify a two-tab flow where one tab creates a room and the other joins by code.
- [ ] T009 Confirm invalid room codes and empty names are rejected with clear UI feedback.

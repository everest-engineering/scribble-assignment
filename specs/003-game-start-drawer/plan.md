# Implementation Plan: Game Start and Drawer Flow

## Scope

This feature slice starts the active game round after the lobby is ready. It does not add multi-round behavior, timers, drawer rotation, custom word packs, persistence, or WebSockets.

## Technical Approach

- Implement `startGame(code, participantId)` in the room store as the authoritative state transition.
- Reuse host and participant lookup helpers from the lobby slice.
- Select the first starter word deterministically for repeatable tests.
- Assign the host as drawer for the single round.
- Initialize empty drawing state, empty guess history, and zero scores.
- Extend room snapshots so the frontend knows the viewer role and drawer identity.
- Hide the secret word unless the viewer is the drawer or the room has moved to result state.
- Update the lobby so all players navigate to the game page after polling sees active status.
- Update the game page to render the viewer role, drawer name, and drawer-only word card.

## Files

- `backend/src/services/roomStore.ts`
- `backend/src/services/roomStore.test.ts`
- `backend/src/api/rooms.ts`
- `frontend/src/pages/LobbyPage.tsx`
- `frontend/src/pages/GamePage.tsx`
- `frontend/src/pages/GamePage.test.tsx`

## Risks

- The frontend must not decide secret-word visibility locally. The backend snapshot remains authoritative.
- Polling means non-host navigation may lag up to about 2 seconds, which is accepted by the assignment.

## Validation Plan

- Backend tests for state transition, initialized scores, drawer assignment, deterministic word, and secret-word filtering.
- Frontend tests for drawer and guesser rendering.
- Manual two-browser validation for start and role-specific word visibility.

# Quickstart: Room Setup and Lobby

## Scope

Validate Feature Group 1: create room, join by code, invalid-code feedback, room isolation, 2-second lobby polling, host-only start, and minimum 2-player start.

## Implementation Steps

1. Update backend room models and snapshots with host/start metadata.
2. Add backend validation for player names, room codes, participant IDs, and start attempts.
3. Extend the room service with host assignment, room-code normalization, room isolation checks, and start-game transition.
4. Add or update room routes for create, join, polling fetch, and host start.
5. Align frontend API types and methods with the room contracts.
6. Add frontend form validation for create/join inputs.
7. Update the room store and lobby page to poll every 2 seconds with interval cleanup.
8. Update lobby UI to show host labels, start eligibility, and clear rejection feedback.
9. Add focused tests for backend rules and frontend API behavior.

## Validation Commands

From `backend/`:

```sh
npm run test
npm run build
```

From `frontend/`:

```sh
npm run test
npm run build
```

## Manual Two-Tab Check

1. Start the backend and frontend dev servers.
2. In tab A, create a room as Alice and confirm Alice is marked as host.
3. In tab B, enter an invalid room code and confirm clear feedback with no lobby navigation.
4. In tab B, join Alice's room as Bob and confirm both tabs show Bob within 2 seconds.
5. Confirm Bob cannot start the game.
6. Confirm Alice cannot start when alone, then can start after Bob joins.
7. Create a second room in another tab and confirm participants and host state do not appear across rooms.

## Review Checklist

- No WebSockets, server-sent events, long polling, databases, authentication, sessions, or unrelated refactors were introduced.
- All user-controlled values are validated in the frontend and backend before room state changes.
- Polling uses a single 2-second timer per mounted lobby and cleans up on unmount or status transition.
- Rejected join/start attempts do not mutate room state.
- Every behavior maps back to `spec.md` user stories and functional requirements.

## Validation Findings

- 2026-05-29: Backend tests passed with 19 tests across room service, schemas, and rooms API.
- 2026-05-29: Backend TypeScript build passed.
- 2026-05-29: Frontend API tests passed with 5 tests.
- 2026-05-29: Frontend TypeScript and production build passed.
- 2026-05-29: Manual two-tab browser validation remains pending.

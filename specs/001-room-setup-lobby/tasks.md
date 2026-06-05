# Tasks: Room Setup & Lobby

## Source

- Spec: `speckit/specs/01-room-setup-lobby.md`
- Plan: `speckit/plans/01-room-setup-lobby.md`

## Status

Implemented and validated.

## Backend Tasks

- [x] Extend the shared room model with host identity and a minimal started-game status.
- [x] Expose `hostParticipantId` and viewer-specific `isHost` in room snapshots.
- [x] Normalize room codes consistently before room lookup.
- [x] Validate room codes with Zod and reject empty or malformed codes.
- [x] Add a start-game request schema requiring `participantId`.
- [x] Set the room creator as host during room creation.
- [x] Preserve room isolation when participants join by code.
- [x] Add start-game service logic for missing rooms, unknown participants, non-host attempts, and the 2-player minimum.
- [x] Add `POST /rooms/:code/start`.
- [x] Return clear API error messages through the existing error handler.

## Frontend Tasks

- [x] Update frontend room snapshot types to include host fields and started-game status.
- [x] Add `api.startGame(code, participantId)`.
- [x] Add `roomStore.startGame()`.
- [x] Trim and reject empty room codes before join submission.
- [x] Add 2-second lobby polling while the lobby page is mounted.
- [x] Stop lobby polling on page unmount.
- [x] Navigate participants to the game page when polling observes a started room.
- [x] Label the host in the lobby participant list.
- [x] Show start controls only for the host.
- [x] Disable host start until at least 2 players are present.
- [x] Show readable feedback for polling, start-game, and minimum-player states.

## Test Tasks

- [x] Add backend tests for host assignment.
- [x] Add backend tests for room isolation.
- [x] Add backend tests for non-host start rejection.
- [x] Add backend tests for 2-player minimum enforcement.
- [x] Add backend tests for successful host start.
- [x] Add schema tests for room-code normalization and rejection.
- [x] Add schema tests for start-game participant id validation.
- [x] Add frontend API test for `startGame`.
- [x] Run backend tests.
- [x] Run frontend tests.
- [x] Run backend build.
- [x] Run frontend build.
- [x] Run whitespace diff check.

## Scenario Validation Checklist

- [x] Create a room as host in the browser.
- [x] Reject empty room codes in the join form.
- [x] Join the same room as a second player.
- [x] Confirm the host lobby sees the new player through polling.
- [x] Confirm a separate room does not show players from the first room.
- [x] Confirm the non-host cannot start the game.
- [x] Confirm the host cannot start while alone.
- [x] Confirm the host can start with 2 players.
- [x] Confirm participants observe the transition to game state through polling.

Note: The in-app browser exposed one active tab during validation, so the polling scenario was verified with one real browser lobby and a localhost API call simulating the second player. Backend REST checks verified the same room isolation and authorization rules directly.

## Completed Verification

```sh
cd backend && npm test
cd frontend && npm test
cd backend && npm run build
cd frontend && npm run build
git diff --check
```

## Scenario Verification

- Browser UI: host creation, empty join-code rejection, non-host waiting control, host-alone disabled start, polling update, and host start navigation.
- Backend REST: invalid code rejection, unknown code rejection, lowercase code normalization, room isolation, non-host start rejection, 2-player minimum, host start success, and guest snapshot observing `playing`.

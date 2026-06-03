# Scribble Assignment Validation Notes

**Branch**: `sdd-scribble-assignment`
**Feature**: `specs/001-scribble-game`

## Setup Verification

- Backend scripts verified in `backend/package.json`: `dev`, `build`, `start`, `test`.
- Frontend scripts verified in `frontend/package.json`: `dev`, `build`, `preview`, `test`.
- README run commands verified for backend and frontend local development.

## Scenario 1 - Room Setup & Lobby

Status: Passed automated validation.

- Backend room store tests cover host assignment, empty-name rejection, join validation, unknown-room rejection, room isolation, start preconditions, and secret-word visibility.
- Frontend API and room store tests cover start-game request shape, stored session state, polling fetch context, and snapshot updates.
- Lobby now polls every 2 seconds, identifies the host, tracks player count, and enables start only when the viewer is the host and at least two players are present.

## Scenario 2 - Game Start & Drawer Flow

Status: Pending.

## Scenario 3 - Gameplay Interaction

Status: Pending.

## Scenario 4 - Result, Restart & Final Validation

Status: Pending.

## Automated Validation

Status: Partial pass after Scenario 1.

- `backend`: `npm run test` passed, 14 tests.
- `backend`: `npm run build` passed.
- `frontend`: `npm run test` passed, 6 tests.
- `frontend`: `npm run build` passed.

## Manual Two-Browser Validation

Status: Pending.

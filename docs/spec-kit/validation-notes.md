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

Status: Passed automated validation.

- Backend room store tests cover active state transition, host drawer assignment, deterministic starter word selection, empty drawing/guess state, initialized scores, and viewer-specific secret-word filtering.
- Frontend game page tests cover role-specific active rendering: the drawer sees the secret word, while guessers see drawer identity without the word.
- Lobby polling now redirects all players to the game page after the room becomes active.

## Scenario 3 - Gameplay Interaction

Status: Passed automated validation.

- Backend room store tests cover drawer-only drawing updates, clear drawing, empty guess rejection, drawer guess rejection, incorrect guesses, case-insensitive correct guesses, 100-point scoring, and result transition.
- Backend routes now accept drawing updates, clear actions, and guesses with schema validation.
- Frontend tests cover drawing path rendering, clear controls, API/store request handling, trimmed guess normalization, score rendering, and shared guess history rendering.
- Game page now polls active rooms, renders a shared SVG drawing canvas, allows only the drawer to draw/clear, disables guessing for the drawer, and shows synchronized scores and guesses.

## Scenario 4 - Result, Restart & Final Validation

Status: Pending.

## Automated Validation

Status: Partial pass after Scenario 1.

- `backend`: `npm run test` passed, 19 tests.
- `backend`: `npm run build` passed.
- `frontend`: `npm run test` passed, 18 tests.
- `frontend`: `npm run build` passed.

## Manual Two-Browser Validation

Status: Pending.

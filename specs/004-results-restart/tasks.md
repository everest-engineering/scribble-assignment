# Tasks: Result, Restart & Final Validation

## Source

- Discovery: `speckit/discovery.md`
- Spec: `specs/004-results-restart/spec.md`
- Plan: `specs/004-results-restart/plan.md`

## Status

Implemented and verified.

## Backend Tasks

- [X] Extend room status with a result state.
- [X] Add result snapshot field for `correctWord`.
- [X] Expose `correctWord` only while room is in result state.
- [X] Preserve final scores in result snapshots.
- [X] Preserve complete guess history in result snapshots.
- [X] Transition room to result state when a correct guess is submitted.
- [X] Preserve selected word, drawer, scores, drawing, and guess history for result display.
- [X] Reject further drawing updates once room is in result state.
- [X] Reject clear-canvas actions once room is in result state.
- [X] Reject further guess submissions once room is in result state.
- [X] Add restart schema requiring `participantId`.
- [X] Add restart service action.
- [X] Reject restart for unknown room codes.
- [X] Reject restart from unknown participants.
- [X] Reject restart from non-host participants.
- [X] Reject restart when room is not in result state.
- [X] Preserve room code on restart.
- [X] Preserve participant list and participant order on restart.
- [X] Preserve `hostParticipantId` on restart.
- [X] Set room status back to lobby on restart.
- [X] Clear drawer assignment on restart.
- [X] Clear selected word and correct-word exposure on restart.
- [X] Clear drawing state on restart.
- [X] Clear scores on restart.
- [X] Clear guess history on restart.
- [X] Update room timestamp on restart.
- [X] Add `POST /rooms/:code/restart`.

## Frontend Tasks

- [X] Update frontend room status type with result state.
- [X] Update frontend snapshot type with nullable `correctWord`.
- [X] Add restart API method.
- [X] Add restart action to room store.
- [X] Continue game-page polling while room is playing or result.
- [X] Navigate back to lobby when polling sees room status return to lobby.
- [X] Display result state on game page.
- [X] Display correct word in result state.
- [X] Display final scores in result state.
- [X] Display complete guess history in result state.
- [X] Show restart control only for host in result state.
- [X] Hide or disable restart control for non-hosts.
- [X] Disable canvas drawing and clear control in result state.
- [X] Disable guess form in result state.
- [X] Preserve existing lobby polling behavior after restart.

## Test Tasks

- [X] Add backend test for correct guess transitioning room to result.
- [X] Add backend test for result snapshot exposing correct word.
- [X] Add backend test for result snapshot preserving final scores.
- [X] Add backend test for result snapshot preserving full guess history.
- [X] Add backend test rejecting drawing updates in result state.
- [X] Add backend test rejecting clear actions in result state.
- [X] Add backend test rejecting guesses in result state.
- [X] Add backend test rejecting non-host restart.
- [X] Add backend test rejecting unknown participant restart.
- [X] Add backend test rejecting restart outside result state.
- [X] Add backend test for host restart preserving room code, host, participants, and order.
- [X] Add backend test for host restart clearing drawer, word, drawing, scores, and guess history.
- [X] Add backend test confirming restarted lobby snapshot does not expose previous correct word.
- [X] Add schema test for restart participant id validation.
- [X] Add frontend API test for restart endpoint.
- [X] Run backend tests.
- [X] Run frontend tests.
- [X] Run backend build.
- [X] Run frontend build.
- [X] Run whitespace diff check.

## Manual Validation Checklist

- [X] Start a 2-player game.
- [X] Submit a correct guess.
- [X] Confirm result state displays correct word.
- [X] Confirm result state displays final scores.
- [X] Confirm result state displays complete guess history.
- [X] Confirm non-host cannot restart.
- [X] Confirm host can restart.
- [X] Confirm all players return to lobby through polling.
- [X] Confirm room code is preserved.
- [X] Confirm all players are preserved.
- [X] Confirm host identity is preserved.
- [X] Confirm previous drawer assignment is cleared.
- [X] Confirm previous word is cleared.
- [X] Confirm previous drawing is cleared.
- [X] Confirm previous scores are cleared.
- [X] Confirm previous guess history is cleared.

## Completed Verification

- Backend tests: `npm test` in `backend` passed 32 tests.
- Frontend tests: `npm test` in `frontend` passed 7 tests.
- Backend build: `npm run build` in `backend` passed.
- Frontend build: `npm run build` in `frontend` passed.
- Whitespace check: `git diff --check` passed.
- HTTP scenario: verified create, join, start, draw, wrong guess, correct guess result transition, correct-word exposure, final score/history preservation, post-result mutation rejections, non-host restart rejection, host restart, lobby cleanup, and polling returning lobby.

## Scenario Verification Result

```json
{
  "verified": true,
  "resultStatus": "result",
  "correctWord": "rocket",
  "historyCount": 2,
  "guestScore": 100,
  "postResultStatuses": [400, 400, 400],
  "nonHostRestartStatus": 403,
  "restartStatus": "lobby",
  "scoresAfterRestart": [0, 0],
  "pollAfterRestart": "lobby"
}
```

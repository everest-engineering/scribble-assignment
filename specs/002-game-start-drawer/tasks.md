# Tasks: Game Start & Drawer Flow

## Source

- Spec: `speckit/specs/02-game-start-drawer.md`
- Plan: `speckit/plans/02-game-start-drawer.md`

## Status

Implemented and API-validated.

## Backend Tasks

- [x] Update create-room schema to require and trim `playerName`.
- [x] Update join-room schema to require and trim `playerName`.
- [x] Reject empty or whitespace-only player names with clear API errors.
- [x] Ensure failed name validation does not create rooms or add participants.
- [x] Store only trimmed participant names.
- [x] Remove fallback participant names for create/join flows.
- [x] Extend room state with started-round fields for drawer participant id and selected word.
- [x] Extend room snapshots with drawer participant id, drawer name, and viewer-specific secret word.
- [x] Keep drawer and secret-word fields absent or null while a room is still in lobby.
- [x] Update start-game logic to assign the first participant as drawer.
- [x] Select the first starter word deterministically when the game starts.
- [x] Fail start-game gracefully if the starter word list is empty.
- [x] Ensure all participants see the same drawer identity after game start.
- [x] Ensure only the drawer receives the secret word in snapshots.
- [x] Ensure non-drawers, missing viewer ids, and unknown viewer ids do not receive the secret word.

## Frontend Tasks

- [x] Update frontend room snapshot types with drawer and secret-word fields.
- [x] Trim player names before create-room submission.
- [x] Reject empty create-room names client-side with clear feedback.
- [x] Trim player names before join-room submission.
- [x] Reject empty join-room names client-side with clear feedback.
- [x] Preserve backend validation error display on create and join pages.
- [x] Update the game page to identify the drawer by name.
- [x] Show the secret word only when the current viewer is the drawer.
- [x] Hide the secret word from non-drawers and show neutral waiting/drawing copy.
- [x] Preserve Feature Group 1 lobby polling and game navigation behavior.

## Test Tasks

- [x] Add schema tests for valid trimmed create-room names.
- [x] Add schema tests for valid trimmed join-room names.
- [x] Add schema tests rejecting empty and whitespace-only names.
- [x] Add room-store tests confirming participant names are stored trimmed.
- [x] Add room-store tests confirming first participant becomes drawer on start.
- [x] Add room-store tests confirming deterministic first starter word selection.
- [x] Add room-store tests confirming drawer snapshots include the secret word.
- [x] Add room-store tests confirming non-drawer snapshots hide the secret word.
- [x] Add room-store tests confirming missing or unknown viewer ids hide the secret word.
- [x] Add frontend API/type tests for the new room snapshot fields.
- [x] Run backend tests.
- [x] Run frontend tests.
- [x] Run backend build.
- [x] Run frontend build.
- [x] Run whitespace diff check.

## Manual Validation Checklist

- [x] Create a room with leading/trailing spaces in the name and confirm the API stores the trimmed name.
- [x] Attempt to create a room with a whitespace-only name and confirm a clear API error.
- [x] Attempt to join a room with a whitespace-only name and confirm a clear API error.
- [x] Start a 2-player game and confirm the first participant is identified as drawer.
- [x] Confirm the drawer receives the secret word.
- [x] Confirm the non-drawer does not receive the secret word.
- [x] Confirm a room fetched without a participant id does not expose the secret word.

Note: Browser form automation could not complete text entry in this session because the in-app browser wrapper failed on input filling. The frontend implementation was verified by build/type checks and source-level behavior; the end-to-end feature rules were verified through the backend HTTP API.

## Completed Verification

```sh
cd backend && npm test
cd frontend && npm test
cd backend && npm run build
cd frontend && npm run build
git diff --check
```

## Scenario Verification

- Backend REST: whitespace-only create and join rejected, spaced names trimmed, first participant assigned as drawer, first starter word selected, drawer receives `rocket`, non-drawer/missing/unknown viewers receive no secret word.

## Speckit Verify: Scenario 2

Verified against the requested scenario:

- [x] Player names are trimmed on create and join.
- [x] Empty or whitespace-only create names are rejected with a message.
- [x] Empty or whitespace-only join names are rejected with a message.
- [x] When the first round begins, the first player becomes drawer.
- [x] Drawer is identified by participant id and name.
- [x] Secret word is deterministically selected from the starter list as `rocket`.
- [x] Drawer snapshot includes the secret word.
- [x] Non-drawer and anonymous snapshots do not include the secret word.

Latest verification result:

```json
{
  "verified": true,
  "trimmedNames": ["Host Player", "Guess Player"],
  "drawer": "Host Player",
  "deterministicWord": "rocket",
  "guesserSecret": null
}
```

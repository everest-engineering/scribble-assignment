# Plan: Game Start & Drawer Flow

## Source

- Spec: `speckit/specs/02-game-start-drawer.md`
- Prior feature: `speckit/specs/01-room-setup-lobby.md`
- Constitution: `speckit/constitution.md`

## Goal

Complete the first started-game state: player names are trimmed and required, starting a game assigns the first participant as drawer, a starter word is selected deterministically, the drawer is visible to everyone, and the secret word is visible only to the drawer.

## Current State

Feature Group 1 added host tracking, room-code validation, lobby polling, and a `playing` room status. The game page still shows generic player info and placeholders. Room snapshots do not yet include drawer identity, selected word state, or viewer-specific secret word visibility.

## Backend Plan

1. Tighten player-name validation in `backend/src/api/schemas.ts`.
   - Require `playerName` for create and join requests.
   - Trim before validation and storage.
   - Reject empty or whitespace-only names with a clear error.

2. Extend the game model in `backend/src/models/game.ts`.
   - Add optional started-round state to `Room`, including `drawerParticipantId` and selected `word`.
   - Add `drawerParticipantId`, `drawerName`, and viewer-specific `secretWord` to `RoomSnapshot`.
   - Keep these fields absent or null while the room is still in lobby.

3. Update participant creation in `backend/src/services/roomStore.ts`.
   - Store the already-trimmed validated name.
   - Remove fallback names such as `Player` for create/join requests covered by this feature.

4. Update start-game logic in `backend/src/services/roomStore.ts`.
   - When transitioning from `lobby` to `playing`, set the drawer to `participants[0]`.
   - Select the first word from `STARTER_WORDS` as the deterministic word.
   - Fail gracefully if no starter word is available.
   - Preserve the existing host-only and 2-player minimum checks.

5. Update snapshot generation in `backend/src/services/roomStore.ts`.
   - Expose drawer identity to all viewers once the game has started.
   - Include `secretWord` only when `viewerParticipantId` matches `drawerParticipantId`.
   - Omit or null `secretWord` for non-drawers, missing viewer ids, and unknown viewer ids.

## Frontend Plan

1. Update `frontend/src/services/api.ts` snapshot types.
   - Add `drawerParticipantId`, `drawerName`, and optional or nullable `secretWord`.
   - Keep compatibility with lobby snapshots where these fields are null or absent.

2. Update create and join pages.
   - Trim player names before submission.
   - Reject empty names client-side with clear feedback before making API calls.
   - Continue showing backend validation errors if the API rejects the request.

3. Update game page display.
   - Clearly identify the drawer by name for all participants.
   - Show the secret word only when the current viewer is the drawer and `secretWord` is present.
   - Show non-drawers a neutral prompt that the drawer is choosing/drawing the word, without revealing it.

4. Keep polling behavior from Feature Group 1.
   - Existing lobby polling should carry the started snapshot into `/game`.
   - Do not add WebSockets or new persistence.

## Data Flow

1. Create or join room.
   - Frontend trims `playerName`.
   - Backend validates and stores only non-empty trimmed names.

2. Host starts game.
   - Backend verifies host and minimum-player rules.
   - Backend sets status to `playing`.
   - Backend sets drawer to the first participant.
   - Backend stores the deterministic starter word.

3. Fetch room snapshot.
   - All viewers receive drawer identity.
   - Only the drawer receives `secretWord`.
   - Non-drawers receive the same round metadata without the word.

## Testing Plan

1. Backend schema tests.
   - Create-room and join-room schemas trim valid names.
   - Empty and whitespace-only names are rejected.

2. Backend room store tests.
   - Names are stored trimmed.
   - Empty names do not create or join rooms through validated API paths.
   - Starting a game assigns the first participant as drawer.
   - Starting a game selects the first starter word.
   - Drawer snapshots include `secretWord`.
   - Non-drawer, missing-viewer, and unknown-viewer snapshots do not include `secretWord`.

3. Frontend API/type tests.
   - Snapshot shape supports drawer fields and viewer-specific secret word.

4. Frontend manual validation.
   - Create with a spaced valid name and confirm trimmed display.
   - Attempt create/join with whitespace-only names and confirm clear error.
   - Start a 2-player game and confirm the first player is identified as drawer.
   - Confirm drawer sees the secret word and guesser does not.

## Risks

1. Frontend and backend snapshot types are duplicated, so both must be updated together.
2. Browser refresh still loses local participant identity; without `participantId`, the secret word must stay hidden.
3. Later gameplay features will extend the round state, so this plan should keep only drawer and word fields for now.
4. API-level name validation must avoid accidentally allowing direct empty-name requests that bypass frontend checks.

## Out Of Scope

1. Drawing interaction.
2. Guess submission.
3. Guess history.
4. Scoring.
5. Results and restart.
6. Timers, multiple rounds, drawer rotation, or custom word selection.

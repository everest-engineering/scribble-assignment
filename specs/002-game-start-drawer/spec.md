# Feature Specification: Game Start & Drawer Flow (US2)

**Feature Branch**: `001-scribble-game`
**Created**: 2026-06-04
**Status**: Complete

## User Story

The host starts the game from the lobby. The first player in the room becomes the drawer. A secret word is deterministically selected and shown only to the drawer. All players automatically navigate to the game screen. The drawer's role is clearly labelled; guessers see no secret word.

## Acceptance Scenarios

1. **Given** the host clicks Start Game with 2+ players, **When** the game starts, **Then** `participants[0]` becomes the drawer and `secretWord = STARTER_WORDS[participants.length % 5]`.
2. **Given** the game starts, **When** the drawer views the game screen, **Then** they see the secret word and "You are Drawing"; guess form is disabled.
3. **Given** the game starts, **When** a guesser views the game screen, **Then** they see "You are Guessing"; secret word is absent.
4. **Given** lobby polling receives `status === "playing"`, **When** any player's poll fires, **Then** they navigate to `/game` automatically.
5. **Given** a non-host calls `POST /:code/start`, **When** the server processes it, **Then** it returns 403.
6. **Given** fewer than 2 players are in the room, **When** host calls start, **Then** 400 is returned.
7. **Given** a player joins after game has started, **When** they poll the room, **Then** they are redirected to the game screen.
8. **Given** host navigates back during a game, **When** they return to lobby URL, **Then** lobby auto-redirects them to `/game`.

## Functional Requirements

- FR-006: `startGame` assigns `drawer = participants[0].id`
- FR-007: `secretWord = STARTER_WORDS[participants.length % STARTER_WORDS.length]`
- FR-008: `toRoomSnapshot` hides `secretWord` unless viewer is drawer or status is `"result"`
- FR-009: Lobby polls detect `status === "playing"` and navigate to `/game`
- FR-010: `POST /:code/start` guarded by hostId check (403) and player count (400)

## Success Criteria

- SC-004: Start triggers navigation for both tabs within next poll cycle
- SC-005: Drawer sees word; guesser does not — verified via snapshot filtering

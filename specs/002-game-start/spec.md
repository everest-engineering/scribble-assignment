# Feature Specification: Game Start & Drawer Flow (Scenario 2)

## Overview

When the host starts the game, player names are validated (trim, reject empty). The host becomes the drawer. A secret word is deterministically selected and visible only to the drawer.

## User Stories

- **US-2.1** As a player, I must enter a non-empty trimmed name to create or join a room.
- **US-2.2** As the host/drawer, I see the secret word on the game screen.
- **US-2.3** As a guesser, I do not see the secret word.
- **US-2.4** As any player, I can identify who is the drawer.

## Acceptance Criteria

### AC-2.1 Name validation
- **Given** a player submits whitespace-only or empty name, **When** they create or join, **Then** API returns 400 "Player name is required" and frontend shows the error.

### AC-2.2 Game start transition
- **Given** host starts game with 2+ players, **When** start succeeds, **Then** room status becomes `playing`, all scores reset to 0.

### AC-2.3 Drawer assignment
- **Given** game starts, **When** snapshot is fetched, **Then** `drawerId` equals `hostId` (host is drawer).

### AC-2.4 Secret word — drawer only
- **Given** a drawer fetches the room, **When** status is `playing`, **Then** snapshot includes `secretWord`.
- **Given** a guesser fetches the room, **When** status is `playing`, **Then** snapshot does NOT include `secretWord`.

### AC-2.5 Deterministic word
- **Given** room code "ABCD", **When** game starts, **Then** word is always the same index from STARTER_WORDS (hash of code % length).

### AC-2.6 Auto-navigation
- **Given** a player is in lobby, **When** polled snapshot shows `status === "playing"`, **Then** they are navigated to `/game`.

## Edge Cases

- Start called twice → 400 "Game already started"
- Name with leading/trailing spaces → trimmed before validation

## Out of Scope

- Drawer rotation, custom word packs, timers

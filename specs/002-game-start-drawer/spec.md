# Feature 002: Game Start & Drawer Flow

## Discovery

Builds on Feature 001 host tracking. Additional gaps:
- No server-side game start transition
- No drawer assignment or secret word
- Player names accept whitespace-only input

## User Story

As the host, I want to start the game so that I become the drawer and see the secret word while other players wait to guess.

## Acceptance Criteria

### AC-1: Name Validation
- **Given** a player submits a name on create or join
- **When** the name is empty or whitespace-only after trim
- **Then** the API returns 400 with "Player name is required"
- **And** the frontend shows the same validation before submit

### AC-2: Start Game
- **Given** the host is in lobby with ≥2 participants
- **When** they call `POST /rooms/:code/start` with their `participantId`
- **Then** room status changes to `"playing"`
- **And** `drawerId` is set to `hostId`
- **And** `secretWord` is deterministically selected from `STARTER_WORDS`
- **And** all participant scores initialize to 0

### AC-3: Authorization
- **When** a non-host calls start → 403 "Only the host can start the game"
- **When** start called with <2 participants → 409 "Need at least 2 players"
- **When** start called outside lobby → 409 "Game already started"

### AC-4: Drawer Identification
- **Given** the game is in `playing` state
- **When** any player views the game page
- **Then** the drawer participant is clearly labeled (badge or header text)

### AC-5: Secret Word Visibility
- **Given** the game is `playing`
- **When** the drawer polls `GET /rooms/:code?participantId=<drawerId>`
- **Then** snapshot includes `secretWord`
- **When** a guesser polls with their participantId
- **Then** snapshot does NOT include `secretWord`
- **And** guesser sees "Drawer is drawing…" placeholder

### AC-6: Navigation
- **When** host starts successfully, both host and guests navigate to `/game`
- **When** room status is `lobby` and user is on `/game`, redirect to `/lobby`

## Edge Cases

- Word selection is deterministic: same room code always yields same word
- Join blocked when room is not in lobby (409)
- Frontend trims names before API call

## Out of Scope

- Drawing, guessing, scoring (Feature 003)
- Result/restart (Feature 004)

# Feature Specification: Result, Restart & Final Validation (Scenario 4)

## Overview

When a round ends (correct guess), all players see the result: correct word, final scores, full guess history. The host can restart, returning everyone to lobby with players preserved and round state cleared.

## User Stories

- **US-4.1** As any player, I see the correct word when the round ends.
- **US-4.2** As any player, I see final scores and complete guess history on the result screen.
- **US-4.3** As the host, I can restart the game back to lobby.
- **US-4.4** As any player, after restart I return to lobby with all players still present.

## Acceptance Criteria

### AC-4.1 Result state
- **Given** a correct guess ends the round, **When** any player polls, **Then** status is `result`, `secretWord` visible to all, scores and guesses preserved.

### AC-4.2 Result UI
- **Given** status is `result`, **When** on game page, **Then** UI shows word, scores, and guess history prominently.

### AC-4.3 Host restart
- **Given** host on result screen, **When** they click Restart, **Then** `POST /rooms/:code/restart` succeeds.
- **Given** non-host, **When** on result screen, **Then** no Restart button shown.

### AC-4.4 Restart reset
- **Given** restart succeeds, **When** any player polls, **Then** status is `lobby`, strokes/guesses/secretWord/drawerId cleared, participants and hostId preserved, scores reset to 0.

### AC-4.5 Restart navigation
- **Given** restart succeeds, **When** clients poll, **Then** they navigate to `/lobby`.

## Edge Cases

- Restart called when not in result → 400
- Non-host restart attempt → 403

## Out of Scope

- Multiple rounds without restart, persistent score across rounds

# Feature Spec: Result, Restart & Final Validation (Scenario 4)

## Overview

Display shared result state when a round ends and allow the host to restart back to lobby with round state cleared.

## User Stories

### US-1: Result display
**As** any player, **I want** to see the correct word, scores, and guess history when the round ends.

**Acceptance Criteria:**
- [ ] Result panel shows revealed secret word to all players
- [ ] Final scores displayed for all participants
- [ ] Full guess history visible

### US-2: Host restart
**As** the host, **I want** to restart the game, **so that** we can play again.

**Acceptance Criteria:**
- [ ] Only host sees restart button on result screen
- [ ] `POST /rooms/:code/restart` clears round state (drawer, word, scores, guesses, strokes)
- [ ] Participants preserved; status returns to "lobby"
- [ ] All clients navigate to lobby via polling

## API Changes

- `POST /rooms/:code/restart` — host only, body `{ participantId }`

## Validation Strategy

Complete round → verify result on both tabs → host restarts → both return to lobby with players intact.

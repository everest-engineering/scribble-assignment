# Feature 004: Result, Restart & Final Validation

## Discovery

Builds on Feature 003 result transition. Additional gaps:
- ResultPanel is a static placeholder
- No restart flow to return to lobby
- Round state not cleared on restart

## User Story

As a player, I want to see the round result and have the host restart so we can play again from the lobby.

## Acceptance Criteria

### AC-1: Result Display
- **Given** the room is in `result` status
- **When** any player views the game page
- **Then** they see the revealed word, final scores, and full guess history

### AC-2: Revealed Word
- **Given** status is `result`
- **When** any player polls
- **Then** snapshot includes `revealedWord` (same as secretWord)
- **And** secretWord is NOT included (use revealedWord for all)

### AC-3: Host Restart
- **Given** status is `result`
- **When** the host calls `POST /rooms/:code/restart`
- **Then** status returns to `lobby`
- **And** participants are preserved
- **And** drawerId, secretWord, strokes, guesses are cleared
- **And** scores reset to 0

### AC-4: Restart Authorization
- **When** non-host calls restart → 403
- **When** restart called outside result → 409

### AC-5: Navigation After Restart
- **When** any player polls and status is `lobby`
- **Then** game page redirects to `/lobby`
- **And** lobby shows preserved participants with reset state

### AC-6: End-to-End Validation
- Two browsers complete full flow: create → join → start → draw → guess → result → restart → lobby

## Edge Cases

- Guess history and scores visible during result before restart
- Host restart button hidden for non-host
- Canvas and guess form disabled during result

## Out of Scope

- Multiple rounds with drawer rotation
- Persistent scores across restarts

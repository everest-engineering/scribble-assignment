# Feature Specification: Game Start & Drawer Flow

**Feature Group**: 2 — Game Start & Drawer Flow
**Date**: 2026-06-04
**Status**: Draft

## User Stories

### User Story 1 — Drawer Assignment (P1)
When the game starts, one player is designated as the drawer with the secret word.

**Acceptance Scenarios**:
1. Given a game with 2+ players, When the host starts, Then the host (first participant) is assigned as drawer
2. Given the drawer is assigned, When the game screen loads, Then the drawer sees "You are the drawer!" and the secret word
3. Given a player is a guesser, When the game screen loads, Then they see "Waiting for drawer to draw..." and do NOT see the secret word

### User Story 2 — Secret Word Selection (P1)
A word is deterministically selected from the starter word list.

**Acceptance Scenarios**:
1. Given the game starts, When the round begins, Then the word is deterministically selected (first word from STARTER_WORDS: "rocket")
2. Given the word is selected, When a player views the room, Then only the drawer sees the word

## Edge Cases
- If all players leave during lobby, start is blocked (already handled by ≥2 check)
- The drawer is always participant at index 0 (the host)

## Functional Requirements
- **FR-001**: System MUST select word as STARTER_WORDS[0]
- **FR-002**: System MUST assign the host participant as drawer
- **FR-003**: System MUST set status to "playing" on start
- **FR-004**: System MUST NOT reveal the secret word to guessers in RoomSnapshot
- **FR-005**: System MUST include role (drawer/guesser) and secretWord (drawer only) in the snapshot

## Key Entities
- **Room**: adds drawerId, secretWord, round
- **RoomSnapshot**: adds drawerId (always), secretWord (only for drawer)

## Success Criteria
- **SC-001**: Drawer sees secret word on game screen
- **SC-002**: Guesser does not see secret word
- **SC-003**: Word is always "rocket" (deterministic from STARTER_WORDS[0])

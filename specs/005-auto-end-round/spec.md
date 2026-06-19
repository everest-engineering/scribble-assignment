# Feature Specification: Auto-end Round on Correct Guess

**Feature Branch**: `scribble-assignment` (single-branch lab; feature dir `specs/005-auto-end-round`)

**Created**: 2026-06-18

**Status**: Draft

**Type**: Refinement increment — refines Group 3 (Gameplay) and Group 4 (Result/Restart)

**Input**: User description: "auto-end the round when a guesser guesses correctly: a correct guess moves the room to the result state for all players; keep the host End Round as a fallback. Refines Group 3/4."

**Why this increment**: Evaluation feedback flagged that a correct guess should end the round and move all
players to the result state, rather than requiring the host to press End Round. The original Group 4
clarification chose host-ends-explicitly; this increment supersedes that for the correct-guess case while
keeping the host control as a fallback.

## Clarifications

### Session 2026-06-18

- Q: When does the round auto-end? → A: On the **first correct guess** — that guess is scored, then the room moves to the result state for everyone.
- Q: Does the host End Round action stay? → A: Yes, as a fallback for when no one guesses correctly. Restart is unchanged.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A correct guess ends the round for everyone (Priority: P1)

When a guesser submits a correct guess, that guess is scored and the round immediately ends: all players move
to the result state (correct word revealed, final scores, full history) without the host doing anything.

**Why this priority**: This is the whole point of the increment and the behavior the assignment expects.

**Independent Test**: With two browsers in an active round, a guesser submits the correct word; both screens
move to the result view within ~2 seconds and the guesser's score shows 100.

**Acceptance Scenarios**:

1. **Given** an active round, **When** a guesser submits the correct word, **Then** their score becomes 100 and the room transitions to the result state.
2. **Given** the round auto-ended by a correct guess, **When** any player's screen next updates, **Then** they see the result state (revealed word, final scores, full history) — the guesser immediately and others via polling within ~2 seconds.
3. **Given** an active round, **When** a guesser submits an incorrect guess, **Then** the round does NOT end and play continues.
4. **Given** the round has ended (by a correct guess), **When** any further guess is attempted, **Then** it is not accepted (the round is no longer active).
5. **Given** a round in which no one guesses correctly, **When** the host presses End Round, **Then** the round still ends to the result state (fallback preserved).

### Edge Cases

- **First correct guess wins** → the round ends on the first correct guess; later guessers do not get a turn after that (single-round game).
- **Incorrect guesses** → never end the round.
- **Word reveal** → the auto-end uses the same result state as the host End Round, so the word is revealed to all exactly as before.
- **Host End Round with no correct guess** → still works (fallback).
- **Restart** → unchanged: from the result state the host restarts back to a clean lobby.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: When a guesser submits a correct guess, the system MUST record the score (100) and, in the same action, transition the room to the result state.
- **FR-002**: The auto-end MUST produce the same result state as a host-ended round (word revealed to all, final scores, full guess history).
- **FR-003**: An incorrect guess MUST NOT end the round.
- **FR-004**: Once a round has ended (by correct guess or by the host), the system MUST NOT accept further guesses.
- **FR-005**: The host's explicit End Round action MUST remain available as a fallback (e.g., when no correct guess occurs).
- **FR-006**: The system MUST preserve Groups 1–4 behaviors without regression (drawer-only word during active play, deterministic word, scoring-once, restart to a clean lobby, polling).

### Key Entities *(include if feature involves data)*

- **Round / result state**: Unchanged from Group 4 — the auto-end reuses the existing `result` state and its reveal of the word + final scores + full history. No new data is introduced.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A correct guess ends the round for all players within ~2 seconds (the guesser immediately; others on their next poll).
- **SC-002**: The correct guesser's score is exactly 100 in the resulting result state.
- **SC-003**: 100% of incorrect guesses leave the round active (they never trigger the result state).
- **SC-004**: When no correct guess occurs, the host End Round fallback still moves all players to the result state.
- **SC-005**: All Groups 1–4 acceptance criteria still pass (no regression), including restart from the auto-ended result.

## Assumptions

- Auto-end fires on the **first** correct guess; this is a single-round game with no rotation, so ending on the first solve is acceptable (confirmed in Clarifications).
- The correct guesser is still scored before the transition, so the result shows their 100.
- Host End Round and Restart are unchanged; this increment only adds the automatic transition on a correct guess.
- Implementation extends the existing guess handling and the existing result state; no new endpoints, persistence, auth, real-time transport, or libraries (brownfield, polling-only).

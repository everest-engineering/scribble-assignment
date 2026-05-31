# Feature Specification: Gameplay Interaction

**Feature Branch**: `003-gameplay-interaction-drawing`

**Created**: 2026-05-31

**Status**: Draft

**Input**: User description: "Gameplay interaction — interactive drawing canvas with clear action, guess submission with validation, synced guess history via polling, and scoring (Scribble lab Scenario 3)"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Drawer Drawing (Priority: P1)

While a round is active, the drawer can draw on an interactive canvas. Their strokes appear on their screen immediately. All other participants see the same drawing update through room polling without needing to refresh manually.

**Why this priority**: Drawing is the central activity of the game; without a shared canvas there is nothing for guessers to interpret.

**Independent Test**: Two tabs — drawer draws simple strokes → within a few seconds the guesser tab shows the same drawing.

**Acceptance Scenarios**:

1. **Given** an active round and the viewer is the drawer, **When** they draw on the canvas, **Then** strokes appear on their canvas.
2. **Given** an active round and the viewer is a guesser, **When** the drawer has drawn strokes and the guesser receives room updates, **Then** the guesser canvas shows the same drawing as the drawer.
3. **Given** an active round and the viewer is a guesser, **When** they attempt to draw on the canvas, **Then** they cannot add strokes (read-only or disabled interaction).
4. **Given** an active round, **When** a participant polls for room updates approximately every 2 seconds, **Then** canvas changes from the drawer propagate to all participants.

---

### User Story 2 - Clear Canvas (Priority: P2)

The drawer can clear the entire canvas during the round. After clearing, all participants see an empty canvas on the next sync.

**Why this priority**: Clearing lets the drawer restart a sketch without ending the round; it must stay consistent across all views.

**Independent Test**: Drawer draws, clears → both tabs show empty canvas after sync.

**Acceptance Scenarios**:

1. **Given** the drawer has strokes on the canvas, **When** they choose clear, **Then** their canvas becomes empty.
2. **Given** the drawer clears the canvas, **When** guessers receive the next room update, **Then** their canvas is also empty.
3. **Given** a guesser is viewing the game, **When** they look for a clear control, **Then** no clear action is available to them (drawer-only).

---

### User Story 3 - Guesses, History, and Scoring (Priority: P3)

Guessers submit text guesses during the round. Empty or whitespace-only guesses are rejected with a clear message. Valid guesses are trimmed, compared to the secret word without regard to letter case, and recorded in a shared guess history visible to all participants. Correct guesses add 100 points to that guesser's score; incorrect guesses add 0. All scores started at 0 when the round began.

**Why this priority**: Guessing and scoring complete the core gameplay loop for the active round.

**Independent Test**: Guesser submits wrong then correct guess → history shows both entries; score increases by 100 only on correct; drawer never gains points from guessing.

**Acceptance Scenarios**:

1. **Given** a guesser on the game screen, **When** they submit an empty or whitespace-only guess, **Then** they see a validation message and the guess is not recorded.
2. **Given** a guesser submits a trimmed guess that does not match the secret word (case-insensitive), **When** the guess is accepted, **Then** it appears in the shared guess history, is marked incorrect, and their score increases by 0.
3. **Given** a guesser submits a guess that matches the secret word (case-insensitive, after trim), **When** the guess is accepted, **Then** it appears in the shared guess history, is marked correct, and their score increases by 100.
4. **Given** multiple participants, **When** any guesser submits a guess, **Then** all participants see the same guess history ordering and content after polling sync.
5. **Given** the drawer is viewing the game screen, **When** they look for guess submission, **Then** they cannot submit guesses (they already know the secret word).
6. **Given** a guesser submits `"  Rocket  "` and the secret word is `rocket`, **When** the guess is evaluated, **Then** it is treated as correct.

---

### Edge Cases

- What happens when the drawer draws nothing? Guessers see a blank canvas; guessing is still allowed.
- What happens when a guesser submits multiple guesses in one round? Each valid guess is recorded in history; scoring applies per guess (+100 only on correct submissions).
- What happens when the same guess text is submitted twice? Both entries may appear in history; each is scored independently (+0 unless correct).
- What happens when a non-participant or unknown session submits a guess? Request is rejected; no history or score change.
- What happens when a guess is submitted after the round ends? Out of scope for this feature — round-end behavior belongs to Scenario 4.
- What happens if polling is temporarily slow? Participants eventually converge on the same canvas, history, and scores; no manual refresh required beyond normal game polling.
- What happens when the backend restarts mid-round? In-memory state is lost; acceptable per lab constraints.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow only the drawer to create or modify drawing strokes during an active round.
- **FR-002**: System MUST persist drawing data on the server so all participants can receive the same canvas state via room updates.
- **FR-003**: System MUST allow only the drawer to clear the canvas; clearing removes all strokes for all participants after sync.
- **FR-004**: System MUST reject empty or whitespace-only guesses with a clear user-facing message.
- **FR-005**: System MUST trim leading and trailing whitespace from accepted guesses before comparison and storage.
- **FR-006**: System MUST compare guesses to the secret word case-insensitively.
- **FR-007**: System MUST record each accepted guess in a shared guess history including guesser identity, guess text, and whether it was correct.
- **FR-008**: System MUST add exactly 100 points to a guesser's score for each correct guess and 0 points for each incorrect guess.
- **FR-009**: System MUST prevent the drawer from submitting guesses.
- **FR-010**: System MUST expose guess history and current scores to all participants in the active round through room updates.
- **FR-011**: System MUST keep game screen state (canvas, guesses, scores) synchronized across participants through polling at approximately 2-second intervals during an active round.
- **FR-012**: System MUST restrict drawing, clearing, and guessing to rooms in an active playing state.

### Key Entities

- **Stroke / drawing data**: The serialized representation of the drawer's marks on the canvas for the current round; replaced entirely when the canvas is cleared.
- **Guess**: A single submission by a guesser — trimmed text, submitter, correctness flag, and timestamp (or stable ordering) for history display.
- **Guess history**: Ordered list of guesses for the current round, visible to all participants.
- **Score**: Points per participant for the current round; initialized to 0 at round start; updated on each correct guess (+100).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In two-browser testing, drawing made by the drawer appears on the guesser canvas within 5 seconds in 95% of attempts.
- **SC-002**: After the drawer clears the canvas, all participants see an empty canvas within 5 seconds.
- **SC-003**: 100% of empty or whitespace-only guess attempts show validation feedback without appearing in history.
- **SC-004**: A correct guess (any casing) increases the guesser's displayed score by exactly 100 within one poll cycle.
- **SC-005**: An incorrect guess leaves the guesser's score unchanged (still reflecting only prior correct guesses).
- **SC-006**: All participants display identical guess history content after sync for the same round state.
- **SC-007**: The drawer cannot submit a guess or modify the canvas from a guesser's session identity in manual testing.

## Assumptions

- Scenarios 1 and 2 are implemented: lobby with host start, drawer assignment, secret word visible only to drawer, scores initialized to 0, game screen polling, and route guards for active rounds.
- One round per room session; drawer rotation and round-end transitions are Scenario 4 scope.
- The drawer cannot guess; only non-drawer participants submit guesses.
- Multiple guesses per guesser per round are allowed; duplicate text is allowed and scored independently.
- Round does not automatically end on first correct guess in this scenario; result/restart is Scenario 4.
- Drawing is represented as server-stored stroke data (or equivalent) included in room snapshots — not local-only canvas state.
- Polling interval during gameplay matches lobby behavior (~2 seconds).
- Starter word list and deterministic word selection from Scenario 2 remain unchanged.

## Scope Boundaries

**In scope**: Interactive drawer canvas, drawer-only clear, guess validation and submission, case-insensitive matching, shared guess history, score updates (+100 / +0), gameplay polling sync, guesser vs drawer UI permissions.

**Out of scope**: Round end / result screen, host restart, drawer rotation, timers, WebSockets, persistence across server restart, moderation, spectators, multiple rounds.

**Depends on**: `001-room-setup-lobby` and `002-game-start-drawer` — active round with drawer, secret word, and zeroed scores must exist before gameplay interaction.

# Feature Specification: Gameplay Interaction

**Feature Branch**: `003-gameplay-interaction`

**Created**: 2026-05-29

**Status**: Draft

**Input**: User description: "Feature Group 3: Gameplay Interaction. Given a round is active with a drawer and guessers, all scores start at 0. When the drawer draws or clears the canvas and guessers submit guesses, drawing is visible on the drawer's screen, the drawer can clear the canvas, guesses are trimmed before validation, empty guesses are rejected with user feedback, guess comparison is case-insensitive, guess history is synchronized to all players through polling, correct guesses award exactly 100 points, incorrect guesses award 0 points, scores update immediately after a correct guess, multiple rooms remain isolated, and polling continues without requiring page refresh. Include acceptance criteria, edge cases, error handling, state changes, API requirements, UI requirements, validation rules, and non-goals aligned with project scope. Do not introduce WebSockets, multiple rounds, timers, drawer rotation, or persistent storage."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Drawer Uses the Canvas (Priority: P1)

As the assigned drawer in an active round, I want to draw on the canvas and clear it when needed so I can communicate the secret word visually.

**Why this priority**: The drawer must be able to create and reset the visual clue before guessers can meaningfully participate in the round.

**Independent Test**: Start a room with one drawer and at least one guesser, open the drawer view, draw visible marks on the canvas, clear the canvas, and confirm the drawer's canvas reflects each action without a page refresh.

**Acceptance Scenarios**:

1. **Given** an active round with an assigned drawer, **When** the drawer draws on the canvas, **Then** the marks are visible on the drawer's screen.
2. **Given** the drawer has marks on the canvas, **When** the drawer clears the canvas, **Then** the canvas returns to a blank state on the drawer's screen.
3. **Given** a guesser is viewing the active round, **When** they attempt to draw or clear the canvas, **Then** the application prevents the action and leaves the round state unchanged.

---

### User Story 2 - Guessers Submit Answers (Priority: P2)

As a guesser, I want to submit guesses and receive clear feedback so I know whether I matched the secret word.

**Why this priority**: Guess submission is the core interaction that turns the drawing into a playable game round.

**Independent Test**: In an active round, submit empty, incorrect, and correct guesses from a guesser view and confirm validation, feedback, guess history, and score changes match the acceptance scenarios.

**Acceptance Scenarios**:

1. **Given** a guesser enters only whitespace, **When** they submit the guess, **Then** the guess is rejected with user feedback and no guess history or score change is recorded.
2. **Given** a guesser submits a non-empty incorrect guess, **When** the guess is evaluated, **Then** the trimmed guess appears in guess history and the guesser receives 0 points.
3. **Given** a guesser submits the correct word using different capitalization, **When** the guess is evaluated, **Then** the guess is accepted as correct and the guesser receives exactly 100 points.
4. **Given** a guesser has already earned the correct-guess award for the active round, **When** they submit the correct word again, **Then** their score does not increase again and the repeated guess is still handled predictably.

---

### User Story 3 - Players Stay Synchronized (Priority: P3)

As any player in the active room, I want guess history and scores to stay current through polling so everyone sees the same gameplay progress without refreshing the page.

**Why this priority**: Shared game awareness keeps the active round fair and understandable for both drawer and guessers.

**Independent Test**: Open one drawer tab and two guesser tabs for the same room, submit guesses from each guesser, and confirm all tabs show updated history and scores within the polling freshness target while another room remains unaffected.

**Acceptance Scenarios**:

1. **Given** a guesser submits a guess, **When** other players' views poll for room updates, **Then** the submitted guess appears in the shared guess history for all players in that room.
2. **Given** a guesser submits a correct guess, **When** the correct guess is accepted, **Then** the updated score is visible to the guesser immediately and to other room participants through polling.
3. **Given** two active rooms exist at the same time, **When** a player draws, clears, or guesses in one room, **Then** the other room's canvas, guess history, scores, and participants remain unchanged.
4. **Given** a player remains on the gameplay page, **When** polling continues, **Then** current room state keeps refreshing without requiring a page reload.

---

### Edge Cases

- A guess containing leading or trailing spaces is trimmed before empty-checking and word comparison.
- A guess that becomes empty after trimming is rejected and is not added to guess history.
- A correct guess with different capitalization than the secret word is accepted.
- An incorrect guess that differs only by spacing after trimming or capitalization is evaluated consistently against the normalized secret word.
- A drawer attempt to submit a guess is rejected or disabled because the drawer already knows the word.
- A guesser attempt to draw or clear is rejected or disabled because only the drawer controls the canvas.
- A correct guess submitted more than once by the same guesser in the active round does not award more than 100 total points for that guesser.
- Multiple guessers may each earn the correct-guess award independently during the active round.
- Guess history remains room-specific when multiple rooms are active concurrently.
- Polling failures do not erase the latest successfully displayed room state and should be surfaced as recoverable feedback.
- If a player leaves the gameplay page, polling for that view stops so stale views do not keep requesting updates.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow the assigned drawer to draw visible marks on the active round canvas in their gameplay view.
- **FR-002**: System MUST allow the assigned drawer to clear the active round canvas.
- **FR-003**: System MUST prevent non-drawers from changing or clearing the canvas.
- **FR-004**: System MUST allow guessers to submit guesses during an active round.
- **FR-005**: System MUST trim submitted guesses before validation, display, and comparison.
- **FR-006**: System MUST reject guesses that are empty after trimming and show clear feedback without changing guess history or scores.
- **FR-007**: System MUST compare guesses to the secret word case-insensitively.
- **FR-008**: System MUST record each accepted non-empty guess in room-specific guess history with the guesser identity, displayed guess text, and whether it was correct.
- **FR-009**: System MUST synchronize guess history to all players in the same room through polling.
- **FR-010**: System MUST award exactly 100 points to a guesser for a correct guess in the active round.
- **FR-011**: System MUST award 0 points for incorrect guesses.
- **FR-012**: System MUST update the correct guesser's score immediately after accepting a correct guess.
- **FR-013**: System MUST ensure a guesser cannot receive more than one 100-point correct-guess award in the active round.
- **FR-014**: System MUST keep rooms isolated so canvas state, clear actions, guess history, scores, and polling updates from one room never affect another room.
- **FR-015**: System MUST continue polling active gameplay state while a player remains on the gameplay page, without requiring manual refresh.
- **FR-016**: System MUST preserve existing host-only start, drawer assignment, secret word selection, and drawer-only word visibility behavior.
- **FR-017**: System MUST validate gameplay actions against the current room, participant, role, and active-round state before changing room or game state.
- **FR-018**: System MUST return user-appropriate error messages for invalid guesses, unauthorized canvas actions, missing rooms, unknown participants, and inactive rounds.
- **FR-019**: System MUST keep all gameplay state scoped to the current active round and must not advance to another round as part of this feature.

### State Changes

- **Canvas State**: Changes when the drawer draws or clears; non-drawer attempts leave it unchanged.
- **Guess History**: Adds an entry only for accepted non-empty guesses in the active room.
- **Scores**: Starts at 0 for all players in the active round; incorrect guesses leave scores unchanged, and a correct guess adds exactly 100 points to the correct guesser's score once.
- **Polling State**: Gameplay views continue refreshing shared room state while mounted and stop when the player leaves the view.
- **Room Isolation**: State changes are applied only to the room identified by the current gameplay session.

### API Requirements

- The application MUST provide a way for the drawer to submit canvas drawing updates for the active room.
- The application MUST provide a way for the drawer to clear the active room canvas.
- The application MUST provide a way for guessers to submit guesses for the active room.
- The application MUST provide a way for players to retrieve the current active room gameplay state, including guess history, scores, drawer identity, and role-appropriate round information.
- Gameplay mutation requests MUST identify the room and participant and MUST be rejected when the room is missing, the participant is not in the room, the round is not active, or the participant role is not allowed to perform the action.
- Polling responses MUST include enough current room state for all players to observe updated guess history and scores without a page refresh.

### UI Requirements

- Drawer view MUST display an interactive drawing canvas.
- Drawer view MUST include a clear-canvas control.
- Guesser view MUST display a guess input and submit control.
- Guesser view MUST provide clear feedback when a submitted guess is empty after trimming.
- All player views MUST show synchronized guess history for the active room.
- All player views MUST show current scores and reflect correct-guess score changes.
- Gameplay UI MUST continue to refresh via polling while the player stays on the page.
- Guesser UI MUST not reveal the secret word.

### Validation Rules

- Guess text is trimmed before validation, display, and comparison.
- Empty trimmed guesses are invalid.
- Guess comparison is case-insensitive.
- Only guessers may submit guesses.
- Only the assigned drawer may draw or clear the canvas.
- Gameplay actions require an existing active room, a known participant, and an active round.
- Correct-guess scoring is limited to one 100-point award per guesser in the active round.

### Error Handling

- Empty guess submissions MUST show feedback near the guessing flow and MUST NOT change shared state.
- Unauthorized canvas or guess actions MUST be rejected and MUST NOT change shared state.
- Requests for missing rooms, unknown participants, or inactive rounds MUST return clear recoverable errors.
- Temporary polling failures SHOULD keep the latest successful gameplay state visible and indicate that updates may be stale.
- Retrying after a recoverable polling failure SHOULD resume synchronization without requiring a page refresh.

### Key Entities *(include if feature involves data)*

- **Active Round**: The current playing state for a room, including drawer, secret word, canvas state, guess history, and score changes for this round.
- **Canvas State**: The drawer-controlled visual content for the active room, including the ability to reset it to blank.
- **Guess**: A guesser-submitted answer after trimming, with submitter identity, correctness result, and display text.
- **Score**: The points associated with each participant in the active room; starts at 0 and changes only when a guesser earns the correct-guess award.
- **Room Gameplay Snapshot**: The room-specific state returned to players during polling, including shared history and scores while preserving drawer-only secret visibility.

### Traceability & Scope

- **Source Scenario(s)**: Feature Group 3 Gameplay Interaction business scenario; User Story 1, User Story 2, and User Story 3 in this specification.
- **In Scope**: Drawer canvas drawing and clearing; guess submission; guess trimming and validation; case-insensitive correctness checks; guess history; score updates; room isolation; gameplay polling continuity; player-facing feedback for recoverable gameplay errors.
- **Out of Scope**: WebSockets or push protocols; multiple rounds; timers; drawer rotation; persistent storage; authentication; databases; score rules beyond the active round; redesigning room creation, joining, lobby behavior, or game start behavior.
- **Polling Behavior**: Gameplay state MUST refresh automatically while a player remains on the gameplay page. User-visible guess history and score updates SHOULD appear within the existing application polling interval, and polling MUST stop for a view after the player leaves the gameplay page.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In a two-player active room, the drawer can draw and clear the canvas successfully on the first attempt without refreshing the page.
- **SC-002**: 100% of empty or whitespace-only guesses are rejected with visible feedback and no score or guess-history change.
- **SC-003**: 100% of correct guesses, regardless of letter casing, award exactly 100 points to the submitting guesser within one completed submission flow.
- **SC-004**: 100% of incorrect non-empty guesses award 0 points and appear in guess history after submission.
- **SC-005**: In a three-player active room, all players see the same accepted guess history and scores within the existing polling freshness window.
- **SC-006**: In two simultaneous rooms, actions in one room produce 0 visible changes to the other room's canvas, guess history, scores, or player state.
- **SC-007**: A player can remain on the gameplay page for at least 5 minutes and continue receiving polling updates without manually refreshing.

## Assumptions

- The active round, drawer, and secret word already exist from the completed game-start feature.
- All participant scores are 0 at the start of the active round.
- The existing polling cadence is reused for gameplay synchronization.
- Canvas drawing persistence is limited to the active room's in-memory gameplay state.
- Each guesser can earn the correct-guess award once per active round to prevent repeated scoring from the same answer.
- This feature keeps the game in the current active round after correct guesses; ending rounds and progressing rounds are separate future features.

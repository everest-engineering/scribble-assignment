# Feature Specification: Scribble — Full Game Implementation

**Created**: 2026-06-04
**Status**: Draft

## Scenarios

### Scenario 1 — Room Setup & Lobby
- Creator automatically becomes the host.
- Invalid room codes rejected with clear feedback.
- Rooms remain isolated.
- Lobby refreshes automatically via polling (~2 seconds).
- Only the host can start the game.
- Game starts only when at least 2 players are present.

### Scenario 2 — Game Start & Drawer Flow
- Player names are trimmed.
- Empty or whitespace-only names rejected.
- A drawer is assigned when the game starts.
- A secret word is selected from the starter word list.
- Secret word visible only to the drawer.
- Guessers cannot see the secret word.

### Scenario 3 — Gameplay Interaction
- Drawer can draw on the canvas.
- Drawer can clear the canvas.
- Drawing visible to all players.
- Guessers can submit guesses.
- Guesses are trimmed.
- Empty guesses rejected.
- Guess comparison is case-insensitive.
- Guess history synchronized via polling.
- Correct guesses score 100 points.
- Incorrect guesses score 0 points.
- All scores start at 0.

### Scenario 4 — Result, Restart & Final Validation
- Display the correct word.
- Display final scores.
- Display full guess history.
- Host can restart the game.
- Restart returns all players to the lobby.
- Players are preserved.
- Round state is cleared.

## Functional Requirements
- **FR-001**: Room creator MUST be designated as host via `hostId`.
- **FR-002**: Invalid/empty room codes MUST be rejected by Zod before business logic.
- **FR-003**: Rooms MUST be isolated — each room's state independent of others.
- **FR-004**: Lobby MUST auto-poll at ~2 second intervals.
- **FR-005**: Only the host MAY start the game (non-hosts get 403).
- **FR-006**: Game start requires at least 2 participants.
- **FR-007**: Player names MUST be trimmed and empty/whitespace-only rejected.
- **FR-008**: A drawer MUST be assigned via `drawerId` when game starts.
- **FR-009**: A secret word MUST be selected from starter word list on game start.
- **FR-010**: Secret word MUST be masked for non-drawer participants in snapshots.
- **FR-011**: Drawing data MUST be stored as serializable strokes in the room.
- **FR-012**: Drawer MAY clear the canvas.
- **FR-013**: Guesses MUST be trimmed and empty guesses rejected.
- **FR-014**: Guess comparison MUST be case-insensitive.
- **FR-015**: Correct guess scores 100 points; incorrect scores 0.
- **FR-016**: All scores start at 0.
- **FR-017**: Game end MUST display the correct word, final scores, and guess history.
- **FR-018**: Host MAY restart the game — returns to lobby, preserves players, clears round.

## AI Usage Rules
+- AI-assisted code generation is permitted but all output MUST be human-reviewed.
+- AI MUST NOT be instructed to violate hard constraints (WebSockets, databases, auth).
+- AI-generated code must adhere to the same quality standards as human-written code.

## Success Criteria
- **SC-001**: Two browser tabs can join the same room.
- **SC-002**: Host can start the game.
- **SC-003**: Drawer receives the secret word.
- **SC-004**: Drawing is shared.
- **SC-005**: Guesses are synchronized.
- **SC-006**: Scores are calculated.
- **SC-007**: Results are displayed.
- **SC-008**: Restart returns everyone to the lobby.

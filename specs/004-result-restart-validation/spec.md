# Feature Specification: Result, Restart & Final Validation

**Feature Branch**: *(continues on current branch; no new branch required)*

**Created**: 2026-05-29

**Status**: Draft

**Input**: Scenario 4 from README — Result, Restart & Final Validation: when a round has ended, the result state is displayed and the host restarts; all players see the correct word, final scores, and full guess history; on restart, everyone returns to the lobby with players preserved and all round state cleared.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Round Ends After a Correct Guess (Priority: P1)

When any guesser submits a guess that matches the secret word (case-insensitive), the active round ends and the room transitions to a result state. No further guesses or drawing are accepted after the round ends.

**Why this priority**: A defined round-end trigger is required before a result screen can exist; without it, the game never reaches the outcome phase.

**Independent Test**: Guesser submits a correct guess — room leaves active play; subsequent guess and draw attempts are rejected; all clients reach the result view within one poll cycle.

**Acceptance Scenarios**:

1. **Given** an active round with at least one guesser, **When** a guesser submits a case-insensitive match to the secret word, **Then** the room transitions from active play to a result state.
2. **Given** a room in the result state, **When** any participant attempts to submit a new guess, **Then** the attempt is rejected and no new guess is recorded.
3. **Given** a room in the result state, **When** the drawer attempts to add strokes or clear the canvas, **Then** the attempt is rejected and the drawing is unchanged.
4. **Given** multiple clients in the same room, **When** the round ends, **Then** all clients detect the result state within one poll cycle without manual refresh.

---

### User Story 2 - Result Shows Word, Scores, and History to All (Priority: P2)

In the result state, every participant sees the revealed secret word, final scores for all players, and the complete guess history from the ended round.

**Why this priority**: The result screen is the payoff of the round — all players must see the same authoritative outcome before restarting.

**Independent Test**: After a correct guess ends the round, every tab shows the same word, score totals, and full guess list.

**Acceptance Scenarios**:

1. **Given** a room that has entered the result state, **When** any participant views the result screen, **Then** the secret word is visible (no longer drawer-only).
2. **Given** a room in the result state, **When** any participant views the result screen, **Then** final scores match the totals at round end for every participant.
3. **Given** a room in the result state with multiple guesses recorded, **When** any participant views the result screen, **Then** the full guess history from the round is displayed in submission order.
4. **Given** drawer and guesser clients viewing the same result state, **When** they compare displayed word, scores, and history, **Then** all three match across clients.

---

### User Story 3 - Result State Stays Synchronized via Polling (Priority: P3)

While the room is in the result state, clients receive consistent word, scores, and history through the same HTTP polling pattern used elsewhere (~2 seconds).

**Why this priority**: Multi-client consistency must hold through the result phase, not only at the moment of round end.

**Independent Test**: Two tabs on the result view show identical content; temporary poll failure does not crash the UI; data reconciles on the next successful poll.

**Acceptance Scenarios**:

1. **Given** clients on the result view, **When** polling runs on an interval of approximately 2 seconds, **Then** word, scores, and guess history remain consistent across clients.
2. **Given** a client experiences a temporary poll failure on the result view, **When** the next poll succeeds, **Then** the UI shows the correct result data without crashing.

---

### User Story 4 - Host Restarts to Lobby with Round State Cleared (Priority: P4)

The host may restart the room from the result state. Restart returns all participants to the lobby with the same player roster preserved, and all round-specific state (scores, drawing, guesses, drawer assignment, secret word) is cleared.

**Why this priority**: Restart completes the game loop and prepares the room for another round without requiring players to rejoin.

**Independent Test**: Host clicks restart — both tabs return to lobby; participant list unchanged; scoreboard/history/canvas reset; host can start again when ≥2 players present.

**Acceptance Scenarios**:

1. **Given** a room in the result state and the host on the result screen, **When** the host initiates restart, **Then** the room returns to lobby status for all clients within one poll cycle.
2. **Given** a successful restart, **When** clients view the lobby, **Then** the same participants remain in the room (no one removed).
3. **Given** a successful restart, **When** clients inspect room state, **Then** round data is cleared — no prior secret word, scores, strokes, or guess history from the ended round.
4. **Given** a non-host participant on the result screen, **When** they attempt to restart, **Then** restart is not available or is rejected with clear feedback.
5. **Given** a restarted lobby with at least two participants, **When** the host starts a new game, **Then** a fresh round begins per Scenarios 2–3 rules.

---

### User Story 5 - Clients Navigate Together Through End and Restart (Priority: P5)

When the round ends or the host restarts, all connected clients leave the game view and follow the room to the result or lobby view automatically (via polling), without requiring manual navigation.

**Why this priority**: Split navigation (some players stuck on the game screen) breaks the shared session experience.

**Independent Test**: Tab A (host) and Tab B (guesser) — correct guess moves both to result; host restart moves both to lobby without manual URL changes.

**Acceptance Scenarios**:

1. **Given** clients on the game view when the round ends, **When** polling detects the result state, **Then** all clients navigate to the result view.
2. **Given** clients on the result view when the host restarts, **When** polling detects lobby status, **Then** all clients navigate to the lobby view.
3. **Given** a client that missed the initial round-end event, **When** they poll and see result state, **Then** they are shown the result view with current data.

---

### Edge Cases

- **Round ends on first correct guess**: The first case-insensitive match ends the round; further correct submissions are not accepted (round already ended).
- **Incorrect guesses after round end**: Rejected; history and scores frozen at round-end values.
- **Drawer sees word on result screen**: Word is revealed to everyone, including the former drawer.
- **Restart with two players minimum**: Lobby after restart behaves like Scenario 1 — host can start when ≥2 players remain.
- **Poll during result/restart transition**: Temporary errors surface non-crashing messages; polling continues.
- **Host disconnects on result screen**: Non-hosts cannot restart; room stays in result state until host returns and restarts (no auto-restart).
- **Join during result state**: New joins rejected while room is not in lobby (consistent with Scenario 1 post-start rule, extended to result state).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST transition the room from active play to a result state when any guesser submits a case-insensitive match to the secret word.
- **FR-002**: System MUST reject new guess submissions while the room is in the result state.
- **FR-003**: System MUST reject new drawing strokes and canvas clears while the room is in the result state.
- **FR-004**: System MUST expose the secret word to all participants in the result state (not drawer-only).
- **FR-005**: System MUST expose final participant scores from the ended round in the result state.
- **FR-006**: System MUST expose the complete guess history from the ended round in the result state.
- **FR-007**: System MUST keep result-state word, scores, and history consistent across all clients on each poll cycle (~2 seconds).
- **FR-008**: System MUST allow only the host to restart from the result state.
- **FR-009**: System MUST transition the room from result state to lobby when the host successfully restarts.
- **FR-010**: System MUST preserve all participants in the room across restart (no roster changes).
- **FR-011**: System MUST clear round-specific state on restart — scores, strokes, guesses, drawer assignment, and secret word.
- **FR-012**: System MUST reject join attempts while the room is in the result state (same as non-lobby join rule).
- **FR-013**: System MUST navigate clients from the game view to the result view when the room enters the result state.
- **FR-014**: System MUST navigate clients from the result view to the lobby when restart completes.
- **FR-015**: System MUST surface API and validation errors in the UI without crashing the client.

### Key Entities

- **Result state**: Room phase after active play ends — reveals secret word to all, freezes gameplay actions, shows final scores and guess history.
- **Round-end snapshot**: Authoritative post-round data — revealed word, final scores, full guess history (immutable after transition).
- **Restart action**: Host-only operation that resets round fields and returns room to lobby with participants intact.
- **Room status lifecycle (extended)**: `lobby` → `playing` → `results` → `lobby` (on restart).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of first correct guesses transition the room to result state within one server request.
- **SC-002**: 100% of clients viewing the result state see the same secret word, scores, and guess history within one poll cycle.
- **SC-003**: 0% of non-host clients can successfully restart the room.
- **SC-004**: 100% of successful restarts preserve the full participant roster with zero removals.
- **SC-005**: 100% of successful restarts clear all round-specific fields before returning to lobby.
- **SC-006**: 100% of connected clients reach the result view within one poll cycle after round end.
- **SC-007**: 100% of connected clients reach the lobby within one poll cycle after host restart.

## Assumptions

- **Scenario 1–3 dependency**: Lobby, start flow, drawer/word visibility, gameplay (drawing, guesses, scoring) implemented per prior specs.
- **Round-end trigger**: The first case-insensitive correct guess ends the round and triggers the result transition (standard single-round scribble flow).
- **Frozen result data**: Scores and guess history at round end are not modified while in result state.
- **Host-only restart**: Only the room host may restart, mirroring host-only game start from Scenario 1.
- **Single round per cycle**: Restart clears round state for a fresh start; no drawer rotation or multi-round progression within one session cycle.
- **Polling cadence**: Result and restart detection use ~2 second HTTP polling, consistent with lobby and game views.
- **Join rule extension**: Join rejected when status is not `lobby` — applies to both `playing` and `results`.
- **Constitution alignment**: HTTP polling only, in-memory rooms, Zod validation, Vitest for round-end/restart logic, two-tab manual validation.

## Out of Scope (Explicit Reminders)

The following MUST NOT appear in implementation work for this scenario:

- **Transport**: WebSockets, Socket.io, SSE, or any real-time push protocol — HTTP polling only.
- **Persistence**: Databases or durable storage across server restarts.
- **Identity**: Authentication, accounts, sessions, JWT, or OAuth.
- **Gameplay during result**: New guesses, drawing, or scoring while in result state.
- **Multiple rounds without restart**: Automatic second rounds, drawer rotation, timers, countdowns, speed bonuses, drawer bonuses.
- **Custom content**: Custom or random word packs beyond the starter list.
- **Social/moderation**: Spectators, kick, mute, room passwords.
- **Infrastructure**: Deployment, CI, Docker, new top-level dependencies without plan justification.

**Boundary note**: Scenario 4 begins when active play ends (first correct guess). It owns result display, word reveal to all, and restart-to-lobby reset. Scenarios 1–3 own everything up to and including gameplay during active play.

# Feature Specification: Result and Restart

**Feature Branch**: `004-result-restart-validation`

**Created**: 2026-06-03

**Status**: Draft

**Input**: User description: "Scenario 4 — Result and restart: Given a round has ended, When the result state is displayed and the host restarts, Then all players see the correct word, final scores, and full guess history; on restart, everyone returns to the lobby with players preserved and all round state cleared."

## Clarifications

### Session 2026-06-03

- Q: What round state is cleared on restart? → A: All round state including scores, strokes, guesses, secret word, and drawer assignment; participant list preserved (A4).
- Q: What guess history appears in the result view? → A: Full chronological history including incorrect guesses visible to all players (Q1).
- Q: Who draws after restart when a new round starts? → A: Same first participant (host/drawer per A2); no drawer rotation (Q2).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Shared result state for all players (Priority: P1)

When a round ends, every participant sees the revealed correct word, final scores, and the complete guess history (correct and incorrect) in chronological order. The result view is identical across host, drawer, and guessers except for role-specific action buttons.

**Why this priority**: README Scenario 4 requires all players to see the same outcome before restart; without a shared result state the game loop is incomplete.

**Independent Test**: Complete a round with a correct guess in two tabs; both tabs show the secret word, final scores, and full guess history without manual refresh beyond polling.

**Acceptance Scenarios**:

1. **Given** the room is in result state, **When** any participant polls or views the game page, **Then** they see the correct secret word revealed (not masked).
2. **Given** the room is in result state, **When** any participant views scores, **Then** they see final scores reflecting the completed round (+100 for the correct guesser per A3).
3. **Given** multiple guesses were submitted during the round, **When** any participant views the result, **Then** they see the full chronological guess history including incorrect guesses (Q1).
4. **Given** the room is in result state, **When** a guesser views the page, **Then** guess input is disabled and drawing controls are hidden.
5. **Given** the room is in result state, **When** the drawer views the page, **Then** they see the revealed word (same as guessers) rather than only the drawer-only card from playing state.

---

### User Story 2 - Host-only restart to lobby (Priority: P1)

Only the host can restart the game after a round ends. Restart clears all round state (scores, strokes, guesses, secret word, drawer assignment) while preserving the participant list. All players return to the lobby automatically via polling or navigation triggered by the host action.

**Why this priority**: Restart completes the single-round loop and enables playing again; host-only gating matches start-game permissions.

**Independent Test**: Host clicks Play Again after result; both tabs show lobby with same participants, no round data, scores reset; non-host cannot restart.

**Acceptance Scenarios**:

1. **Given** the room is in result state and the viewer is the host, **When** they click Play Again, **Then** the room transitions to lobby status and round data is cleared (A4).
2. **Given** the room is in result state and the viewer is not the host, **When** they view the game page, **Then** Play Again is hidden or disabled with a clear host-only message.
3. **Given** a non-host attempts restart via the API, **Then** the action is rejected with a forbidden message.
4. **Given** restart succeeds, **When** any participant polls, **Then** status is lobby, currentRound is absent, and participants are unchanged.
5. **Given** restart succeeds, **When** participants were on the game page, **Then** they navigate or poll-detect return to lobby within one poll cycle.
6. **Given** restart from lobby or playing state (invalid), **Then** restart is rejected with a conflict-style message.

---

### User Story 3 - Final two-tab validation walkthrough (Priority: P1)

The complete Scenarios 1–4 flow works end-to-end in two browser tabs: create/join, start, draw, guess, result, restart, start again.

**Why this priority**: Lab rubric requires full game flow validation; this scenario closes all four README business scenarios.

**Independent Test**: Execute the full walkthrough documented in Validation section with host and guest tabs; no manual server refresh required.

**Acceptance Scenarios**:

1. **Given** two tabs in the same room, **When** the full flow from lobby through result to restart is executed, **Then** both tabs stay synchronized via polling throughout.
2. **Given** restart completes, **When** the host starts a new round, **Then** the first participant is drawer again (Q2), scores start at 0, and a fresh word is assigned deterministically (A1).
3. **Given** the lab precheck script runs, **Then** builds, tests, and forbidden-tech checks pass.

---

### Edge Cases

- Host refreshes browser during result state: polling restores result view with full data.
- Guest tab on game page when host restarts: guest navigates to lobby on next poll without clicking anything.
- Restart attempted twice rapidly: second call rejected or idempotent to lobby (no error crash).
- Room not found after backend restart: clients show recoverable not-found on poll/actions.
- Result state with zero guesses (should not occur with A3, but if forced): word and scores still visible.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST reveal the secret word to all participants in room snapshots when status is `"result"` (not drawer-only masking).
- **FR-002**: System MUST include final scores and full guess history in snapshots during result state for all viewers.
- **FR-003**: System MUST expose a host-only restart action that transitions the room from `"result"` to `"lobby"`.
- **FR-004**: System MUST clear all round state on restart: delete `currentRound`, reset scores, strokes, guesses, secret word, and winner (A4); preserve `participants` and `hostParticipantId`.
- **FR-005**: System MUST reject restart from non-host participants with a forbidden message.
- **FR-006**: System MUST reject restart when room status is not `"result"` with a conflict-style message.
- **FR-007**: Frontend MUST render a dedicated result view when `status === "result"` showing revealed word, final scores, and guess history.
- **FR-008**: Frontend MUST show a host-only "Play Again" button that calls restart and navigates the host to lobby.
- **FR-009**: Frontend MUST detect lobby status via polling on GamePage and navigate non-host players to lobby when restart occurs.
- **FR-010**: Frontend MUST keep lobby polling active so restarted rooms show Ready to play with participant list intact.
- **FR-011**: Frontend MUST disable guess and draw controls during result state.
- **FR-012**: System MUST preserve guess history display format from Scenario 3 (participant name, text, correct indicator) in result view.

### Key Entities

- **Room (extended)**: Status includes `"result"` → `"lobby"` transition on restart; `currentRound` removed on restart.
- **Room Snapshot (extended)**: In result state, `secretWord` is non-null for all viewers; round data retained until restart clears it.
- **Restart request**: Host participant id; no additional payload.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of participants see the revealed word within one poll cycle after result state is reached.
- **SC-002**: 100% of participants see identical final scores and guess history order in result state.
- **SC-003**: Non-host restart attempts are rejected 100% of the time without mutating room state.
- **SC-004**: After host restart, all connected clients return to lobby view within 3 seconds (one poll cycle + navigation).
- **SC-005**: Participant count and identities unchanged across restart; round fields absent in lobby snapshot.
- **SC-006**: Full Scenarios 1–4 walkthrough completes in two tabs without server errors.

## Assumptions

- **A4**: Restart clears all round state including scores; participants preserved (discovery.md).
- **Q1**: Full guess history including incorrect guesses shown in result to all players (discovery.md default).
- **Q2**: Same drawer (first participant) on next start after restart — academic for single round but documented (discovery.md default).
- **A3**, **A5**: First correct guess ends round; 2000 ms polling (Scenarios 1–3 complete).
- Scenarios 1–3 (lobby, start, draw, guess, score, result transition) are implemented before this ships.

## Dependencies

- Scenario 3: `"result"` status, scores, guess history, result transition on first correct guess.
- Constitution v2.0.0: snapshot purity exception for result state word reveal; host-only mutations.

## Out of Scope

- Drawer rotation across multiple rounds beyond Q2 default.
- Multi-round scoring persistence across restarts (scores reset per A4).
- WebSockets, databases, authentication.
- Timers, speed bonuses, spectator mode.

## Validation

Two-tab manual check (final lab validation):

1. Tab A creates room; Tab B joins with code.
2. Host starts game; drawer draws; guest guesses wrong then correct.
3. Both tabs show result: revealed word, guest +100, full guess history.
4. Non-host tab: no Play Again button (or disabled with message).
5. Host clicks Play Again; both tabs return to lobby with same two players, no round data.
6. Host starts again; new round begins with scores at 0.
7. Run `node .github/scripts/pre-evaluation-check.mjs` — all checks pass.

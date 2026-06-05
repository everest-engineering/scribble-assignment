# Feature Specification: Result, Restart & Final Validation

**Feature Branch**: `004-result-restart`

**Created**: 2026-06-05

**Status**: Draft

**Input**: Business Scenario 4 — "Given a round has ended, When the result state is
displayed and the host restarts, Then all players see the correct word, final
scores, and full guess history; on restart, everyone returns to the lobby with
players preserved and all round state cleared."

## Clarifications

### Session 2026-06-05

- Q: What ends the round? → A: The first correct guess. When any guesser guesses
  correctly, `submitGuess` flips the room to `finished` (single round, no timer).
- Q: What is revealed in the result state? → A: To ALL players: the correct word,
  the final scores, and the full guess history. The word is now public (the round
  is over), so the snapshot includes `word` for everyone once `finished`.
- Q: Who can restart and what does it reset? → A: Host-only `POST
  /rooms/:code/restart`. It clears `strokes`, `guesses`, resets every score to 0,
  clears `drawerId`, sets status back to `lobby`, and keeps all participants. The
  word index is advanced deterministically for the next round's start.
- Q: How do non-hosts return to the lobby on restart? → A: Polling detects
  `status === "lobby"` on the game screen and navigates everyone back to `/lobby`.
- Q: Does the next round reuse the same word? → A: On restart the room picks the
  next deterministic word (advance `wordIndex` by one, modulo the list) so a new
  round is not identical; selection stays index-based (no randomness).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Round ends and result is shown to all (Priority: P1)

When a guesser guesses correctly, the round ends and every player sees the correct
word, final scores, and the full guess history.

**Why this priority**: The result state is the payoff of the round and must be
identical for all players.

**Independent Test**: With a drawer and a guesser, submit the correct word as the
guesser; confirm both tabs show `finished`, the correct word, final scores, and
the complete history within ~2s.

**Acceptance Scenarios**:

1. **Given** an active round, **When** a guesser submits the correct word,
   **Then** the room status becomes `finished` and that guesser's score is 100.
2. **Given** a finished round, **When** any player polls, **Then** they see the
   correct word, final scores, and the full guess history.
3. **Given** a finished round, **When** a guesser views the result, **Then** the
   word is now visible to them (round is over).

---

### User Story 2 - Host restarts to a clean lobby (Priority: P1)

The host restarts; all round state is cleared, players are preserved, and everyone
returns to the lobby.

**Why this priority**: Restart is the loop-closer that lets the same group play
again without re-joining.

**Independent Test**: After a finished round, the host clicks Restart; confirm
both tabs return to the lobby, the participant list is unchanged, and scores,
strokes, and guesses are all cleared.

**Acceptance Scenarios**:

1. **Given** a finished round, **When** the host restarts, **Then** the room
   status becomes `lobby`, `strokes`/`guesses` are empty, all scores are 0, and
   `drawerId` is cleared.
2. **Given** a restart, **When** it completes, **Then** all participants are
   preserved (same ids and names).
3. **Given** a restart, **When** non-host clients poll on the game screen, **Then**
   they are navigated back to `/lobby`.
4. **Given** a non-host, **When** they attempt to restart, **Then** the backend
   rejects it (host-only).

---

### User Story 3 - End-to-end single round (Priority: P1)

A full round can be played start to finish and restarted by two browsers.

**Why this priority**: This is the final validation that all four scenarios
compose into a working game.

**Independent Test**: Two tabs: create+join, host starts, drawer draws, guesser
guesses correctly → result shown to both → host restarts → both back in lobby with
players preserved.

**Acceptance Scenarios**:

1. **Given** two browsers, **When** they play one round and restart, **Then** the
   flow completes without manual refresh and state stays consistent across tabs.

---

### Edge Cases

- A guess submitted after the round is `finished` is rejected (the round is over).
- Restart is only valid by the host; from any state it returns the room to a clean
  lobby (idempotent if already in lobby).
- Restarting preserves participant ids so the same host keeps hosting.
- The word for the next round differs from the just-finished one (index advanced).
- Strokes and guesses cleared on restart do not reappear via polling.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: `RoomStatus` MUST be extended to `"lobby" | "playing" | "finished"`.
- **FR-002**: A correct guess MUST transition the room to `finished` (single
  round ends on first correct guess).
- **FR-003**: While `finished`, the snapshot MUST include the correct `word` for
  ALL viewers (the secret is now public).
- **FR-004**: The result state MUST present, to all players, the correct word,
  final scores, and the full guess history.
- **FR-005**: A `POST /rooms/:code/restart` endpoint MUST exist and MUST be
  host-only.
- **FR-006**: Restart MUST clear `strokes` and `guesses`, reset every score to 0,
  clear `drawerId`, and set status to `lobby`.
- **FR-007**: Restart MUST preserve all participants (ids and names unchanged).
- **FR-008**: On restart, the next deterministic word MUST be selected (advance
  `wordIndex` by one modulo the list); selection MUST remain index-based.
- **FR-009**: A guess submitted to a `finished` room MUST be rejected.
- **FR-010**: The game screen MUST detect `status === "lobby"` via polling and
  navigate all players back to `/lobby` on restart; and detect `finished` to show
  the result.

### Key Entities

- **Room** (extended): `status` gains `"finished"`; restart mutates `strokes`,
  `guesses`, `scores`, `drawerId`, `status`, and advances `wordIndex`.
- **RoomSnapshot** (extended): `word` is present for everyone when `finished`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A correct guess ends the round; both tabs show `finished` within
  ~2s.
- **SC-002**: All players see the same correct word, final scores, and full
  history in the result state.
- **SC-003**: After host restart, all players return to the lobby within ~2s with
  participants preserved and scores/strokes/guesses cleared.
- **SC-004**: A non-host restart and a post-finish guess are both rejected.
- **SC-005**: A complete round + restart works end-to-end across two browsers
  without manual refresh.

## Assumptions

- Single round; "first correct guess ends the round" is the terminal condition
  (no timer, per scope).
- The correct word becoming public on `finished` is intended (the round is over).
- Restart advances the word so a replay is not identical, while staying
  deterministic (index-based).
- Drawer remains the host across restarts (no rotation); a fresh start re-assigns
  the drawer from the host as in Scenario 2.
- Polling cadence/resilience reuse Scenarios 1–3 (2s, non-fatal failures).

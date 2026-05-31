# Feature Specification: Result, Restart, and Final Validation

**Feature Branch**: `feat/scribble-spec-kit`
**Created**: 2026-05-31
**Status**: Draft
**Input**: User description: "Result, restart, and final validation. When a round has ended
(after the first correct guess from scenario 3), all participants see a result view showing
the correct word, every participant's final score, and the full guess history. The host sees
a Restart button. When the host restarts, the room returns to the lobby state with all
participants preserved but all round state cleared — drawer, secret word, guesses, and scores
are reset — and every participant navigates back to the lobby via the existing polling.
Non-hosts do not see a restart control. The round-ending trigger, scoring, guess history,
and secret-word reveal on ended are inherited from scenario 3 — reference them, don't
re-specify."

**Prerequisites**: The round-ending trigger (first correct guess → status `"ended"`), scoring
(100 points for correct, 0 for incorrect), complete guess history, and secret-word reveal in
`"ended"` status are fully specified in `specs/003-gameplay-interaction/spec.md` (FR-007,
FR-008, FR-011). This spec does not re-specify those behaviors.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — All Participants See the Full Result View (Priority: P1)

When the room status transitions to `"ended"`, all participants — drawer and guessers alike —
see a result view that displays the secret word that was being drawn, each participant's final
score, and the complete ordered guess history from the round. This view is delivered
automatically through the existing polling mechanism without requiring any participant action.

**Why this priority**: Without a visible result, participants cannot confirm who won, what the
word was, or how the round played out. The result view is the minimum required closure to a
completed round. It is the entry point to the restart flow and the primary artifact the host
acts on.

**Independent Test**: Open two browser tabs. Tab A (host/Alice) creates a room; Tab B (Bob)
joins. Alice starts the game. Bob submits the correct word. Within ~4 seconds, both tabs display:
the secret word revealed in full, a scoreboard showing Bob with 100 points and Alice with 0, and
the guess history showing all submitted guesses with correct/incorrect indicators.

**Acceptance Scenarios**:

1. **Given** the room status is `"ended"`, **When** any participant's screen next refreshes via
   polling, **Then** they see the secret word displayed prominently.
2. **Given** the room status is `"ended"`, **When** any participant views the result, **Then**
   they see every participant's final score clearly labeled with the participant's name.
3. **Given** the room status is `"ended"`, **When** any participant views the result, **Then**
   the full ordered guess history from the round is visible, including each guesser's name,
   the guessed text, and a correct/incorrect indicator.
4. **Given** the room status is `"ended"`, **When** a guesser (non-host/non-drawer) views the
   result, **Then** they see the same result content as the host — no content is hidden from
   any participant on the result view.

---

### User Story 2 — Host Restarts the Game (Priority: P1)

The host sees a Restart button on the result view. When activated, the server resets the room
to `"lobby"` status: all round state (drawer assignment, secret word, guess history, scores)
is cleared, but every participant remains in the room. Non-host participants do not see a
Restart control at any point. The server rejects restart requests from non-host participants.

**Why this priority**: Without a restart mechanism the product delivers a single-use experience.
Restart is the completion of the game loop and closes the scenario set. Host-gating prevents
disruption by non-host participants.

**Independent Test**: Tab A (host/Alice) sees a Restart button on the result view. Tab B (Bob)
does not. Alice clicks Restart. Confirm the server accepts the request and the room's status
changes to `"lobby"` with all round fields cleared.

**Acceptance Scenarios**:

1. **Given** the room status is `"ended"` and the viewer is the host, **When** they view the
   result, **Then** a Restart button is visible and interactive.
2. **Given** the room status is `"ended"` and the viewer is not the host, **When** they view
   the result, **Then** no Restart button or restart control is visible to them.
3. **Given** the host activates the Restart control, **When** the server processes the request,
   **Then** the room status becomes `"lobby"`, the drawer ID is cleared, the secret word is
   cleared, the guess history is empty, and all scores are reset to 0.
4. **Given** the host activates the Restart control, **When** the server processes the request,
   **Then** the participant list is preserved exactly — every participant who was in the room
   before restart is still present after restart.
5. **Given** a non-host participant attempts to trigger a restart (e.g., by a direct server
   request), **When** the server processes the request, **Then** the request is rejected with
   a clear error and the room state is unchanged.
6. **Given** a restart is attempted when the room status is not `"ended"`, **When** the server
   processes the request, **Then** the request is rejected with a clear error.

---

### User Story 3 — All Participants Navigate Back to the Lobby After Restart (Priority: P2)

When the host successfully restarts the game, the room status becomes `"lobby"`. All
participants — including the host — navigate back to the lobby screen automatically, driven
by the existing polling cadence. No participant needs to manually navigate or refresh.

**Why this priority**: Automatic navigation is required for the multi-player experience — if
non-host participants had to manually navigate they would be stranded on the result screen
with no instruction. This story is P2 because it depends on US1 and US2 being functional first.

**Independent Test**: With both Tab A (Alice) and Tab B (Bob) on the result screen, Alice
clicks Restart. Within ~4 seconds both tabs automatically display the lobby screen showing
all participants still listed.

**Acceptance Scenarios**:

1. **Given** the host restarts the game, **When** all participants' screens next poll the
   server (within ~2 seconds), **Then** the room status in their snapshot is `"lobby"`.
2. **Given** the room status changes to `"lobby"` via polling, **When** a participant's screen
   detects the change, **Then** they are automatically navigated to the lobby screen without
   any manual action.
3. **Given** participants have returned to the lobby after a restart, **When** they view the
   lobby participant list, **Then** all pre-restart participants are still listed — no one was
   dropped from the room by the restart.

---

### Edge Cases

- What if the host refreshes their browser tab before restarting? → Per the ephemeral session
  model (established in Scenarios 1 and 2), the host loses their session and lands on the home
  screen. Another participant cannot become host; the room remains in `"ended"` state until the
  server restarts or the session ends naturally.
- Can a participant join a room that is in `"ended"` status? → No. The existing join guard from
  Scenario 1 rejects joins when the room is not in `"lobby"` status, which covers `"ended"`.
- What if the host restarts and a participant is still mid-guess submission? → The guess
  submission will be rejected by the server (the room is no longer `"active"`), and the
  participant's screen will update to the lobby on the next poll.
- Can the room be restarted multiple times? → Yes. Each restart fully clears round state and
  returns to lobby. The host may start a new round after any successful restart.
- What happens to a participant's score across restarts? → Scores are cleared on every restart
  (reset to 0). There is no persistent cross-round leaderboard.
- What if the host clicks Restart while the network is unavailable? → The request fails; the
  UI surfaces the error via the existing error state mechanism. The room remains `"ended"` until
  a successful restart request reaches the server.

## Clarifications

### Session 2026-05-31

- Q: Is the result view a new separate page/route, or is it the existing game screen with
  additional content shown when `status === "ended"`? → A: The result view is displayed
  within the existing game screen — no new URL route is introduced. When `status === "ended"`,
  the game screen replaces its active-game content (canvas, guess form) with the full result
  view (correct word, scores, full guess history, and the Restart button for the host).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: When the room status is `"ended"`, the game screen MUST display a result view
  to all participants showing: the secret word in full, every participant's final score, and
  the complete ordered guess history from the round.
- **FR-002**: The result view MUST be delivered automatically via the existing polling
  mechanism — no participant action is required to see it.
- **FR-003**: Only the host MUST see a Restart button on the result view. Non-host participants
  MUST NOT see or have access to a restart control.
- **FR-004**: When the host activates the Restart control, the server MUST reset the room
  status to `"lobby"` and clear all round state: `drawerId` to `""`, `secretWord` to `""`,
  `guesses` to `[]`, `scores` to `{}`.
- **FR-005**: The restart operation MUST preserve the full participant list exactly — every
  participant present before restart MUST remain in the room after restart.
- **FR-006**: After a successful restart, the server MUST return a snapshot with
  `status: "lobby"` and empty round fields.
- **FR-007**: All participants MUST navigate to the lobby screen automatically within
  approximately 4 seconds of the host restarting, driven by the existing polling cadence.
- **FR-008**: The server MUST reject a restart request from any participant who is not the
  host, with a clear error response.
- **FR-009**: The server MUST reject a restart request when the room status is not `"ended"`,
  with a clear error response.
- **FR-010**: The round-ending trigger, scoring, guess history, and secret-word reveal in
  `"ended"` status are inherited from Scenario 3 (`specs/003-gameplay-interaction/spec.md`,
  FR-007, FR-008, FR-011) and are not re-specified here.

### Key Entities

- **Room** (updated by restart): `status` → `"lobby"`; `drawerId` → `""`; `secretWord` → `""`;
  `guesses` → `[]`; `scores` → `{}`; `participants` — preserved unchanged; all other fields
  unchanged.
- **RoomSnapshot** (unchanged shape): the existing snapshot fields from Scenarios 2 and 3
  (`guesses`, `scores`, `secretWord`, `drawerId`, `status`) already carry the data needed for
  the result view. No new fields are required.
- **Participant** (unchanged): as defined in Scenario 1.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All participants see the correct word, final scores, and guess history on their
  screens within 4 seconds of the game ending — verified by the two-tab acceptance test without
  any manual refresh.
- **SC-002**: 100% of non-host participants have no visible Restart control on the result
  screen — verified by visual inspection of the guesser's tab in the two-tab acceptance test.
- **SC-003**: After the host restarts, all participants' screens display the lobby within 4
  seconds, driven by polling — verified by the two-tab acceptance test without a page refresh.
- **SC-004**: The restarted room's participant list matches the pre-restart list exactly —
  zero participants lost or added — verified by comparing participant lists in both tabs
  before and after restart.
- **SC-005**: A restart request from a non-host participant is rejected with a user-visible
  error, and the room state is unchanged — verified by direct server call in the automated
  test suite.
- **SC-006**: All existing automated test suites (`schemas.test.ts`, `roomStore.test.ts`,
  `api.test.ts`) remain green after implementation.

## Assumptions

- The result view is presented on the same game screen URL — no new route or page is needed.
  The game screen already detects `status === "ended"` and switches to result content.
- After a restart, participants land on the existing lobby screen (`/lobby`), the same screen
  they used before the round started.
- The host may restart an unlimited number of times; each restart fully resets round state.
- Scores do not accumulate across rounds — each restart begins with all scores at 0.
- The restart endpoint follows the same pattern as the `start` endpoint: `POST /rooms/:code/restart`
  with body `{ participantId }`, guarded by host check and `"ended"` status check.
- No new routing or navigation library is introduced; lobby navigation uses the same
  `useNavigate` + polling pattern established in the existing lobby and game screens.
- A participant who navigates away from the result screen before the host restarts is not
  affected differently — their session is ephemeral and they are already on the home screen.

# Feature Specification: Scribble Drawing Game

**Feature Branch**: `001-scribble-game`

**Created**: 2026-06-04

**Status**: Draft (iteration 4 — 2026-06-04)

**Input**: Brownfield enhancement of the Scribble starter — implement room lifecycle,
lobby polling, game start, drawing, guessing, scoring, result display, and restart
across 4 phased scenarios.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Room Setup & Lobby (Priority: P1)

A player wants to host or join a drawing game. They create a room with their name and
receive a unique room code. A second player joins using that code. Both players see
each other in the lobby, which refreshes automatically without manual interaction.
Only the host can start the game, and only once at least 2 players have joined.

**Why this priority**: Nothing else works without a valid, isolated room with at least
two players. This is the entry point for every other scenario.

**Independent Test**: Two browser tabs — Tab 1 creates a room, Tab 2 joins with the
code. Tab 1 sees Tab 2 appear in the participant list within ~2 seconds without
pressing Refresh. Tab 1 has a Start Game button; Tab 2 does not.

**Acceptance Scenarios**:

1. **Given** a player enters a non-empty name and clicks Create Room, **When** the
   room is created, **Then** the player lands in the Lobby as the host and a unique
   room code is displayed.
2. **Given** a second player enters the room code and a non-empty name and clicks
   Join, **When** the join succeeds, **Then** the player lands in the Lobby and the
   host sees them appear within approximately 2 seconds without manually refreshing.
3. **Given** two or more players are in the lobby, **When** the host views the lobby,
   **Then** a Start Game button is visible and enabled only to the host.
4. **Given** only one player is in the lobby, **When** the host views the lobby,
   **Then** the Start Game button is visible to the host but disabled with a "Waiting
   for players" indication.
5. **Given** a player attempts to create or join a room with an empty or
   whitespace-only name, **When** they submit the form, **Then** an error message
   "Name cannot be empty" is shown and no API call is made.
6. **Given** a player attempts to join with a non-existent room code, **When** they
   submit, **Then** a clear error is shown and they remain on the join screen.
7. **Given** two separate rooms exist, **When** each room's lobby is polled, **Then**
   participant lists never bleed across rooms.

---

### User Story 2 — Game Start & Drawer Flow (Priority: P2)

The host starts the game from the lobby. The first player in the room becomes the
drawer. A secret word is deterministically selected and shown only to the drawer.
All players automatically navigate to the game screen. The drawer's role is clearly
labelled; guessers see no secret word.

**Why this priority**: Establishes the game state that all subsequent gameplay
depends on. Without a defined drawer and secret word, drawing and guessing cannot
happen.

**Independent Test**: Two tabs with players in lobby. Host clicks Start Game. Both
tabs navigate to the game screen within ~2 seconds. Tab 1 (host/drawer) sees the
secret word and "You are Drawing". Tab 2 sees "You are Guessing" and no secret word.

**Acceptance Scenarios**:

1. **Given** the host clicks Start Game with 2+ players, **When** the game starts,
   **Then** the first participant (the room creator) becomes the drawer and a secret
   word is selected deterministically: with 2 players the word is
   `STARTER_WORDS[2 % 5]`; with 3 players `STARTER_WORDS[3 % 5]`, and so on.
2. **Given** the game has started, **When** the drawer views the game screen,
   **Then** they see their secret word prominently and a clear role label
   "You are Drawing"; the guess form is disabled for them.
3. **Given** the game has started, **When** a guesser views the game screen,
   **Then** they see "You are Guessing", the secret word is absent from their view,
   and the guess form is enabled.
4. **Given** the lobby is polling every ~2 seconds and the room transitions to
   "playing", **When** any player's poll receives the updated status, **Then** that
   player automatically navigates to the game screen without any manual action.
5. **Given** a non-host player sends a start-game request, **When** the system
   processes it, **Then** the request is rejected, the game does not start, and the
   non-host sees an appropriate error.
6. **Given** the host tries to start with fewer than 2 players, **When** the request
   is made, **Then** it is rejected with a message indicating more players are needed.
7. **Given** the game is in "playing" status, **When** the host's lobby screen is
   still visible (e.g., slow navigation), **Then** the Start Game button is no longer
   actionable — the host is navigated to the game screen with all other players.
8. **Given** a player joins a room that is already in "playing" status, **When** they
   land on the lobby, **Then** they are immediately redirected to the game screen on
   the next poll cycle (they join as a late spectator with a score of 0).

---

### User Story 3 — Gameplay Interaction (Priority: P3)

The drawer draws on a canvas; guessers see the drawing update in near-real-time via
polling. Guessers type their guesses into a form. Correct guesses earn 100 points
(first correct guess only, case-insensitive and trimmed match); incorrect guesses
earn 0. Multiple guessers each track their own score independently. The drawer cannot
submit guesses. The full guess history — across all guessers — is visible to all
players in submission order.

**Why this priority**: This is the core game loop. It requires the game state
established in Story 2 and produces the score and guess data needed for Story 4.

**Independent Test**: Two tabs in "playing" state. Tab 1 (drawer) draws strokes and
clicks Clear; Tab 2 (guesser) sees the drawing update within ~2 seconds and the
canvas clear on next poll. Tab 2 submits "CASTLE" (correct, uppercase) → score 100.
Tab 2 submits "castle" again → score stays 100. Tab 2 submits "" → client error, no
submission. Tab 1 (drawer) has no guess form active.

**Acceptance Scenarios**:

1. **Given** the drawer presses and drags on the canvas, **When** they release the
   mouse, **Then** the completed stroke is stored and available for guessers to
   retrieve on their next poll.
2. **Given** the drawer clicks Clear Canvas, **When** the action completes, **Then**
   the stored canvas data is cleared and all guessers see a blank canvas within
   approximately 2 seconds.
3. **Given** a guesser is polling the game state, **When** the drawer has added or
   cleared strokes since the last poll, **Then** the guesser's canvas updates to
   reflect the latest drawing within approximately 2 seconds.
4. **Given** a guesser submits a guess whose trimmed value matches the secret word
   case-insensitively (e.g., "Castle", "CASTLE", "castle" all match "castle"),
   **When** it is the first correct guess from that player, **Then** their score
   increases by exactly 100 and the guess is recorded as correct in the history.
5. **Given** a guesser has already earned 100 points for a correct guess this round,
   **When** they submit the correct word again, **Then** their score remains at 100
   and the duplicate guess is still recorded in history (as correct, +0 additional).
6. **Given** two different guessers both submit the correct word, **When** each
   submits for the first time, **Then** each independently earns 100 points; one
   player's correct guess does not prevent another from scoring.
7. **Given** a guesser submits a word that does not match the secret word, **When**
   the guess is processed, **Then** their score is unchanged and the guess is recorded
   as incorrect in the shared history.
8. **Given** a guesser submits an empty or whitespace-only string, **When** they
   attempt to submit, **Then** an error "Guess cannot be empty" is shown on the client
   and no request is sent.
9. **Given** the drawer is on the game screen, **When** the guess form is rendered,
   **Then** it is visually disabled and cannot be submitted by the drawer; if a
   request were somehow sent, the server rejects it.
10. **Given** any player views the game screen, **When** new guesses have been
    submitted since their last poll, **Then** the guess history shown to all players
    updates within approximately 2 seconds and displays each entry with the player
    name, guess text, and a correct/incorrect indicator.

---

### User Story 4 — Result, Restart & Final Validation (Priority: P4)

The host ends the round. All players see a result screen with the secret word, final
scores per player, and the full guess history. The host can restart, which returns
all players to the lobby with participants preserved and all round state cleared.

**Why this priority**: Completes the full game loop and validates that the system
handles clean state transitions. Depends on all prior stories.

**Independent Test**: After a complete round, host clicks End Round. Both tabs show
result screen with correct word, scores, and guesses. Host clicks Play Again. Both
tabs return to lobby with the same participants but no game state. A new round can
be started.

**Acceptance Scenarios**:

1. **Given** the host clicks End Round during a "playing" game, **When** the action
   completes, **Then** the room status becomes "result" and all players who poll
   within ~2 seconds transition to the result screen automatically.
2. **Given** the room is in "result" status, **When** any player views the result
   screen, **Then** they see: (a) the secret word revealed, (b) a per-player score
   list with every participant's name and final score, and (c) the complete guess
   history in submission order with each entry showing the guesser's name, the text
   submitted, and whether it was correct.
3. **Given** a non-host player tries to end the round, **When** the request is made,
   **Then** it is rejected, the game state remains "playing", and the non-host sees
   an error.
4. **Given** a non-host player tries to restart, **When** the request is made,
   **Then** it is rejected and the room stays in "result" state.
5. **Given** the host clicks Play Again from the result screen, **When** the action
   completes, **Then** the room status returns to "lobby", all participants are
   preserved with their original names and `hostId` unchanged, and all round state
   (drawer, secret word, canvas data, guess list, all scores) is reset to empty/zero.
6. **Given** the room status changes to "lobby" after a restart, **When** any player's
   poll receives the updated status, **Then** they are automatically navigated back to
   the lobby screen without manual action.
7. **Given** the lobby state after a restart, **When** the host views it, **Then**
   the Start Game button is enabled (2+ players present) and a completely fresh round
   — new word selection, new canvas — can be started.
8. **Given** a complete play-through (create → join → start → draw → correct guess →
   end → restart → start again), **When** the second round starts, **Then** all
   scores are 0, the canvas is blank, the guess history is empty, and a freshly
   selected secret word is assigned to the drawer.

---

### Edge Cases

- Empty or whitespace-only player name → client-side rejection before any API call
- Empty room code on join → client-side rejection before any API call
- Join with non-existent room code → clear error, stay on join screen
- Non-host calling start, end, or restart → rejected (403); game state unchanged
- Start with fewer than 2 players → rejected (400); clear message shown
- Drawer submitting a guess → form is disabled; request rejected (403) if bypassed
- Guesser submitting empty or whitespace-only guess → client error, no API call
- Double correct guess by same player → score stays at 100, no double-scoring
- Two rooms open simultaneously → participant lists fully isolated, no cross-room bleed
- Restarting preserves `hostId` and all participant records; clears drawer, secretWord,
  canvasData, guesses, and scores
- Player joins a room already in "playing" status → redirected to game screen as a
  late participant; guess form enabled but they cannot affect the drawer assignment or
  secret word already in play
- Host navigates back to lobby during a game (browser back button) → lobby polling
  immediately detects "playing" status and redirects host back to game screen
- Host clicks End Round while room is already in "result" status (double-click) →
  second request is idempotent; status stays "result", no state change occurs
- A player polls during result status → they see the secret word (FR-008 applies);
  switching to lobby clears it from their view on next poll

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST track which participant created each room as the host and
  include this identity in every room snapshot.
- **FR-002**: System MUST reject any player name that is empty or whitespace-only
  with the message "Name cannot be empty", both on the client before submission and
  on the server at the validation boundary.
- **FR-003**: System MUST isolate all room state (participants, game data) per room
  code; no data from one room may appear in another room's responses.
- **FR-004**: Lobby MUST automatically refresh participant data approximately every
  2 seconds without user interaction; polling MUST stop when the component unmounts.
- **FR-005**: The Start Game action MUST be available only to the host and only when
  at least 2 participants are present; all other callers MUST be rejected.
- **FR-006**: System MUST select the secret word deterministically using
  `STARTER_WORDS[participantCount % STARTER_WORDS.length]`.
- **FR-007**: System MUST assign the drawer as the first participant in the room's
  participant list; no rotation occurs.
- **FR-008**: Room snapshots MUST include the secret word only for the drawer during
  "playing" status and for all players during "result" status.
- **FR-009**: All participants MUST automatically navigate to the game screen when
  room status transitions to "playing" via their polling cycle.
- **FR-010**: Drawing canvas MUST support freehand drawing (mousedown/mousemove/mouseup)
  and a clear action; only the drawer may draw or clear.
- **FR-011**: Canvas state MUST be synced to all players via polling approximately
  every 2 seconds during "playing" status.
- **FR-012**: Guess submission MUST trim text and compare case-insensitively to the
  secret word; empty or whitespace-only guesses MUST be rejected client-side.
- **FR-013**: A correct guess MUST award exactly 100 points to the submitting player
  for the round; no additional points are awarded if that same player submits the
  correct word again. Each player's score is tracked independently — one player
  guessing correctly does not prevent other players from also scoring 100 points.
- **FR-014**: All submitted guesses (player name, text, correct/incorrect flag) MUST
  be stored and returned to all players in every snapshot during "playing" and
  "result" status.
- **FR-015**: The End Round action MUST be available only to the host; it sets status
  to "result" and makes the secret word visible in all snapshots.
- **FR-016**: The Restart action MUST be available only to the host; it resets status
  to "lobby", preserves all participants and `hostId`, and clears all round state.
- **FR-017**: All participants MUST automatically navigate back to the lobby when
  room status transitions to "lobby" after a restart.
- **FR-018**: Any participant who polls a room in "playing" status while on the lobby
  screen MUST be automatically redirected to the game screen; their score initialises
  at 0 and they may submit guesses but are never assigned as drawer mid-game.
- **FR-019**: After a restart, the room MUST satisfy all of these invariants before
  the next round can start: status is "lobby", drawer is unset, secretWord is unset,
  canvasData is unset, guesses list is empty, and every participant's score is 0.
  The participant list and hostId MUST be identical to pre-restart values.

### Key Entities

- **Room**: Identified by a unique code; holds status ("lobby"/"playing"/"result"),
  host identity, participant list, and all round state (drawer, secret word, canvas
  data, guesses, scores).
- **Participant**: A player in a room identified by a unique ID; has a display name
  and a join timestamp.
- **Guess**: A single guess submission; holds the submitting participant's ID and
  name, the guess text, whether it was correct, and a timestamp.
- **RoomSnapshot**: The client-facing projection of Room state; omits the secret word
  except for the drawer (during play) or all players (during result).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Two players can join the same room, see each other in the lobby, play
  a complete round (draw, guess, see result), and restart — all without any page
  refresh or manual reload.
- **SC-002**: Lobby participant list and game canvas/guesses update within
  approximately 2 seconds of a change being made, across all connected players.
- **SC-003**: A guesser who submits the correct word (regardless of case) is awarded
  exactly 100 points; submitting it a second time leaves the score at 100.
- **SC-004**: The secret word is never visible in any player's UI or network response
  unless that player is the drawer (during play) or the round has ended.
- **SC-005**: After a restart, the lobby shows the same players as before with zero
  game state carried over; a new round can be started immediately.
- **SC-006**: All invalid inputs (empty name, empty code, empty guess, non-host
  actions) are rejected with a specific, user-visible error message before or at the
  server boundary.
- **SC-007**: In a room with multiple guessers, every guesser who independently
  submits the correct word for the first time earns exactly 100 points; their scores
  are visible separately in the scoreboard and are never affected by another player's
  correct guess.
- **SC-008**: A complete play-through — room creation, join, game start, drawing,
  correct guess, end round, result review, and restart — can be completed entirely
  in two browser tabs without any page refresh, backend restart, or manual state
  reset; a second round starts cleanly after restart.

## Assumptions

- The starter word list (`STARTER_WORDS`) and its ordering are fixed; no custom or
  random words are used.
- Single-round play only; the drawer does not rotate between rounds.
- All real-time sync is achieved via client polling; no WebSocket or server-push
  mechanism is introduced.
- Room state is held entirely in server memory; restarting the backend clears all
  rooms (by design).
- A player who creates a room is always `participants[0]` and always the host for
  the lifetime of that room.
- Scores reset to zero on every restart; there is no cumulative score across rounds.
- Canvas sync uses base64-encoded image data stored in room state and retrieved by
  guessers on each poll.
- The game is tested with exactly two browser tabs representing two distinct players;
  multi-tab isolation is out of scope.

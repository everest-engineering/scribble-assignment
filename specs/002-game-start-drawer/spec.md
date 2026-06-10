# Feature Specification: Game Start & Drawer Flow

**Feature Branch**: `002-game-start-drawer`

**Created**: 2026-06-09

**Status**: Draft

**Input**: README Scenario 2 — "Given a game is starting and player names are trimmed (empty/whitespace-only rejected with a message), When the first round begins, Then the host (or first player) becomes the clearly-identified drawer, and the secret word (deterministically selected from the starter list) is visible only to the drawer."

## Clarifications

### Session 2026-06-09

- Q: Should the Start Game button in the lobby make a backend API call or just navigate? → A: It MUST call a new `POST /rooms/:code/start` endpoint. The backend validates host identity and player count, assigns the drawer, selects the word, and transitions the room to `"playing"` status. The client navigates to `/game` only on success.
- Q: How is "drawer" assigned when the game starts? → A: For round 1, the host becomes the drawer.
- Q: How is the secret word "deterministically selected"? → A: Use `STARTER_WORDS[(totalParticipants + roundNumber) % STARTER_WORDS.length]` so the same room configuration always picks the same word.
- Q: What room status values are needed? → A: Extend from single `"lobby"` to `"lobby" | "playing" | "result"`.
- Q: What happens if a non-host tries to start the game via the API directly? → A: The backend MUST reject with HTTP 403 and a clear error message.
- Q: What happens if only one player is in the room and someone tries to start? → A: The backend MUST reject with HTTP 400 and a clear error message about needing at least 2 players.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Host starts the game (Priority: P1)

A host who has at least 2 players in the lobby wants to start the drawing game.

**Why this priority**: Starting the game is the transition from lobby to gameplay. It must work before any drawing, guessing, or scoring features can be tested.

**Independent Test**: A host with 2+ players clicks the Start Game button, the backend transitions the room to `"playing"`, assigns the host as drawer, and all participants see the game screen with correct role indicators.

**Acceptance Scenarios**:

1. **Given** the host is in a lobby with at least 2 participants, **when** they click Start Game, **then** the backend transitions the room to `"playing"` status, assigns the host as drawer, selects a secret word, and the host navigates to the game screen where they see their role as "drawer" and the secret word is revealed.
2. **Given** the host is in a lobby with at least 2 participants, **when** the game starts, **then** non-host participants see their role as "guesser" and the secret word is NOT visible to them.
3. **Given** a player is not the host, **when** they click Start Game, **then** the backend rejects the request and the button remains disabled.
4. **Given** the host is alone in the lobby, **when** they click Start Game, **then** the backend rejects the request with a message about needing at least 2 players.

---

### User Story 2 - Drawer sees the secret word (Priority: P1)

The drawer needs to know the word they are drawing so guessers can guess it.

**Why this priority**: The secret word is the core of the game; without it the drawer cannot draw and guessers cannot guess.

**Independent Test**: After the game starts, the drawer's screen shows the secret word clearly while guessers see only a placeholder.

**Acceptance Scenarios**:

1. **Given** the game has started and the viewer is the drawer, **when** the game screen loads, **then** the drawer sees the secret word displayed prominently on the screen.
2. **Given** the game has started and the viewer is a guesser, **when** the game screen loads, **then** the guesser does NOT see the secret word — it is replaced with a generic message like "The drawer is drawing..."

---

### User Story 3 - Room status transition (Priority: P2)

All participants need to see that the room is now playing, not still in the lobby.

**Why this priority**: Status drives client-side rendering (which components to show). Without a correct status, clients may show the wrong view.

**Independent Test**: After a successful start, all clients polling the room see `status: "playing"` within 2 seconds and render the game view.

**Acceptance Scenarios**:

1. **Given** the game has started, **when** any participant polls the room, **then** the room snapshot includes `status: "playing"`, a `currentRound` object with `drawerParticipantId` and `secretWord` (hidden from non-drawers), and all participants see the game view.
2. **Given** a participant joins the room after the game has started, **when** they poll the room, **then** they see `status: "playing"` and are redirected to the game view.

---

### Edge Cases

- A host tries to start the game with only 1 participant (themselves); the system MUST reject with a clear message. This is already validated client-side but MUST be enforced server-side.
- A non-host sends a direct `POST /rooms/:code/start` request; the system MUST reject with HTTP 403.
- The room has already started (`status !== "lobby"`) and someone sends another `POST /rooms/:code/start`; the system MUST reject with HTTP 400.
- A participant who is not the drawer views the room snapshot; the `secretWord` field MUST be `null` or omitted to prevent leaking the word.
- The drawer refreshes their browser during gameplay; the room snapshot still shows `status: "playing"`, their drawer role, and the secret word is revealed to them again on restore.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-009**: System MUST provide a `POST /rooms/:code/start` endpoint that only the host may call, requires at least 2 participants, transitions the room to `"playing"` status, assigns the host as drawer, and selects a secret word deterministically from the starter word list.
- **FR-010**: System MUST reject `POST /rooms/:code/start` with HTTP 403 if the caller is not the host, with response body `{ "error": "not_host", "message": "Only the host may start the game" }`.
- **FR-011**: System MUST reject `POST /rooms/:code/start` with HTTP 400 if fewer than 2 participants are present, with response body `{ "error": "not_enough_players", "message": "At least 2 players required to start" }`.
- **FR-012**: System MUST reject `POST /rooms/:code/start` with HTTP 400 if the room is not in `"lobby"` status.
- **FR-013**: System MUST assign the host as the drawer for round 1 when the game starts.
- **FR-014**: System MUST select the secret word deterministically using the formula `STARTER_WORDS[(totalParticipants + roundNumber) % STARTER_WORDS.length]`.
- **FR-015**: System MUST reveal the secret word in the room snapshot only for the drawer participant. For all other participants, the `secretWord` field MUST be `null`.
- **FR-016**: System MUST include `drawerParticipantId` in the room snapshot's `currentRound` object so all clients can identify who is drawing.
- **FR-017**: System MUST initialise all participant scores to 0 when the game starts.
- **FR-018**: System MUST display the secret word prominently on the game screen when the viewer is the drawer.
- **FR-019**: System MUST hide the secret word on the game screen when the viewer is a guesser, showing a placeholder message instead.

### Key Entities

- **Round**: Represents one round of gameplay, including the round number, the drawer's participant ID, the secret word, scores, and guesses.
- **Drawer**: The participant assigned to draw the secret word on the canvas. Only one drawer per round.
- **Guesser**: Any participant who is not the drawer. Their goal is to guess the secret word.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-007**: A host with 2+ participants can start the game, and within 2 seconds all participants see `status: "playing"` with correct role identification.
- **SC-008**: Non-host participants never see the secret word in the room snapshot or UI.
- **SC-009**: Invalid start attempts (non-host, too few players, already started) are rejected with the correct HTTP status and machine-parseable error body in 100% of cases.
- **SC-010**: The drawer sees the secret word displayed on their game screen immediately after the game starts.

## Assumptions

- The `Room` status model is extended from a single `"lobby"` value to `"lobby" | "playing" | "result"`.
- A `GameRound` or `CurrentRound` object is added to the `Room` model containing `roundNumber`, `drawerParticipantId`, `secretWord`, `scores`, and `guesses`.
- The `RoomSnapshot` type is extended to include round data, with the `secretWord` field optionally hidden per viewer.
- Scores are stored as a `Record<string, number>` mapping participant ID to score, initialised to 0 for all participants on game start.
- The starter word list and role list are unchanged from the existing seed data.
- The frontend `LobbyPage` calls the new `POST /rooms/:code/start` endpoint instead of navigating directly to `/game`.

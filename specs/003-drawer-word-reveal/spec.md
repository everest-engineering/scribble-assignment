# Feature Specification: Game Start — Drawer Assignment and Word Reveal

**Feature Branch**: `003-drawer-word-reveal`

**Created**: 2026-05-30

**Status**: Draft

**Input**: User description: "Given a game is starting and player names are trimmed (empty/whitespace-only rejected with a message), When the first round begins, Then the host (or first player) becomes the clearly-identified drawer, and the secret word (deterministically selected from the starter list) is visible only to the drawer."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Drawer Is Assigned at Game Start (Priority: P1)

When the game begins, every player in the room instantly knows who the drawer is. The host (the player who created the room) is assigned the drawer role for the first round. The identity of the drawer is displayed unambiguously to all participants — the drawer sees themselves labelled as "Drawer", and all other players see the same player name marked as "Drawer" in the game view.

**Why this priority**: Role clarity is the foundation of the game mechanic. Without knowing who is drawing, neither the drawer nor the guessers can act. This is the first thing all players see when the game starts.

**Independent Test**: Two players (host and guest) are in a lobby. Host clicks "Start Game". Both players land on the game screen. Verify: (1) the host's name appears with a "Drawer" label for both players; (2) the guest's name appears with a "Guesser" label for both players.

**Acceptance Scenarios**:

1. **Given** a game session with 2 or more players has been started, **When** all players arrive on the game screen, **Then** exactly one player is labelled "Drawer" — the host — and all other players are labelled "Guesser".
2. **Given** the game screen is displayed, **When** a player checks their own role, **Then** they see either "You are the Drawer" or "You are a Guesser" depending on their assigned role — never an unlabelled or ambiguous state.
3. **Given** the host and a guest player have both loaded the game screen, **When** they compare what they see, **Then** both see the same player identified as the Drawer.

---

### User Story 2 — Secret Word Is Visible Only to the Drawer (Priority: P1)

The drawer sees the secret word clearly on their screen; no other player can see it. The word is selected deterministically from the pre-defined starter word list — it is always the first word in that list. Guessers see a placeholder that indicates a word is in play without revealing it.

**Why this priority**: The word-visibility rule defines the central challenge of the game. The drawer must not share the word accidentally, and guessers must not be able to see it. Both conditions must hold before any guessing can begin.

**Independent Test**: Tab A (host/drawer) and Tab B (guest/guesser) both land on the game screen. Tab A displays the secret word clearly. Tab B shows a placeholder (e.g., "Draw the secret word!" or hidden blanks) — the actual word is absent from Tab B's view. The same word appears on Tab A every time (deterministic selection).

**Acceptance Scenarios**:

1. **Given** the game has started, **When** the drawer's game screen loads, **Then** the secret word is displayed prominently and legibly (not hidden, blurred, or truncated).
2. **Given** the game has started, **When** a guesser's game screen loads, **Then** the secret word is not visible anywhere on the screen; only a neutral placeholder is shown.
3. **Given** the game has started and both roles view the screen independently, **When** the drawer refreshes their view, **Then** the same word appears (deterministic — no random re-selection on reload).
4. **Given** the game starts with the same word list every session, **When** any game begins, **Then** the displayed word is always the first entry in the starter word list (e.g., "rocket"), making the selection predictable and testable.

---

### Edge Cases

- What is displayed if somehow the game screen is reached with no participants — does it fall back gracefully?
- What if a player's name is blank or whitespace-only — can they reach the game screen? (Assumption: no — player name validation in the lobby prevents this.)
- Can a guesser inspect the page source or network responses to find the word? (Out of scope for this feature — the spec addresses what is *displayed*, not network-level hiding.)
- What happens when the game screen is loaded by a participant who has no stored session state (e.g., direct URL navigation)? The player should be redirected to the home screen.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST assign the host (the player who created the room) as the drawer when the game starts.
- **FR-002**: System MUST display each player's role ("Drawer" or "Guesser") on the game screen, visible to all players in the room.
- **FR-003**: System MUST display the secret word to the drawer on the game screen.
- **FR-004**: System MUST NOT display the secret word to any player who is not the drawer; guessers see only a neutral placeholder.
- **FR-005**: System MUST select the secret word deterministically from the starter word list — always the first word in the list — so the selection is consistent and testable.
- **FR-006**: System MUST redirect any player who reaches the game screen without an active room session back to the home screen.
- **FR-007**: System MUST display a clear "You are the Drawer" message or equivalent label to the drawer, and a "You are a Guesser" message or equivalent label to non-drawing players.

### Key Entities *(include if feature involves data)*

- **GameSession**: A started game within a Room. Carries the assigned drawer participant ID and the selected word. Derived from the Room (which transitions to `"active"` status on start).
- **PlayerRole**: Either `"drawer"` or `"guesser"`. Assigned at game start; the drawer is always the host for the first round.
- **SecretWord**: The word selected from the starter list for the current game. Always the first word in the list. Visible to the drawer only.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of games started with a valid host result in the host being assigned the drawer role — no game starts without a clearly identified drawer.
- **SC-002**: 0% of guesser screens display the secret word — word visibility is fully segregated by role.
- **SC-003**: The secret word is the same value in every game session (deterministic selection from a fixed list) — verifiable by repeating the same start action and observing the same word.
- **SC-004**: All players see the drawer identity within 1 second of the game screen loading — no delayed or missing role assignment.
- **SC-005**: Players who navigate directly to the game URL without a valid session are redirected to the home screen within 1 second.

## Assumptions

- The host of the room is always the player who created it — this was established in the Game Room Lobby feature (feature 002).
- The starter word list is fixed and loaded at server start; the first word in the list is the deterministic selection for round 1. The list currently contains: "rocket", "pizza", "castle", "guitar", "sunflower".
- Only one round takes place per game session (per constitution Principle V — multiple rounds are out of scope).
- The game screen is reached only via the host triggering the "Start Game" action from the lobby; direct URL access without session state redirects to home.
- Network-level hiding of the word (e.g., not sending it in the API response to guessers) is an implementation detail. The spec only requires that the word is not *displayed* to guessers; the implementation must honour this but the spec does not prescribe how.
- Player name validation (non-empty, non-whitespace-only) was enforced in the lobby; any player reaching the game screen already has a valid name.
- A "placeholder" for the guesser's word view is a neutral message (e.g., "Draw the secret word!" or a row of blank tiles) — the exact wording is an implementation detail.

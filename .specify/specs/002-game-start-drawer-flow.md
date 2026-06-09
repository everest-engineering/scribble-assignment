# Feature Specification: Game Start & Drawer Flow

**Feature Group**: 002 — Game Start & Drawer Flow
**Created**: 2026-06-09
**Status**: Draft
**Input**: Business Scenario 2 — Game Start & Drawer Flow

---

## Problem Statement

Feature Group 1 (Room Setup & Lobby) established room creation, joining, lobby
polling, and host-gated game start. When the host clicks "Start Game" and the
room transitions to `"playing"`, the game begins — but no drawer has been
assigned, no secret word has been selected, and every participant sees the full
word list regardless of role.

This feature group implements the transition into the first round: the host
becomes the drawer, a secret word is chosen deterministically, the drawer sees
the word, and all participants can identify who is drawing. Name validation from
the lobby phase carries forward; no additional player input is required.

---

## User Story

### User Story — Game Start & Drawer Flow (Priority: P1)

After the host starts the game from the lobby, all participants enter the game
view. The host is assigned as the drawer. The drawer sees a secret word and
begins drawing. Guessers see who the drawer is but do not see the secret word.

**Why this priority**: P1 — Every subsequent feature group (guessing, scoring,
results) depends on a started game with an assigned drawer and a hidden secret
word. Without this foundation, no gameplay can occur.

**Independent Test**: Two browser tabs create and join a room. The host starts
the game. Both tabs navigate to the game view. The host tab displays "(Drawer)"
and shows the secret word. The guesser tab displays the host's name with a
drawer indicator but does not show the secret word.

---

## Functional Requirements

### FR-001: Drawer Assignment
When the game transitions out of the lobby to a playing state, the system MUST
assign the host as the drawer. The drawer identity MUST be part of the room
state visible to all participants.

### FR-002: Secret Word Selection
When the game transitions to a playing state, the system MUST select exactly one
secret word from the starter word list. The selection MUST be deterministic
(same input always produces the same result).

### FR-003: Secret Word Hiding
The system MUST reveal the secret word only to the drawer participant.
Non-drawer participants MUST NOT be able to see the secret word through any
room-scoped API call.

### FR-004: Drawer Identification
The system MUST indicate to all participants which participant is the current
drawer. This indication MUST be available through the room state returned by
all room-scoped API calls.

### FR-005: Name Continuity
The system MUST carry forward the trimmed, validated player names from the
lobby phase. No additional name input or re-validation is required at game
start.

---

## Acceptance Criteria

The following criteria use the EARS (Easy Approach to Requirements Syntax)
notation where applicable.

### Drawer Assignment

- **AC-001 (Response)**: When the host successfully starts the game with 2 or
  more participants present, the system shall assign the host as the drawer and
  include the drawer's participant ID in the room snapshot.

### Secret Word Selection

- **AC-002 (Response)**: When the game starts, the system shall select exactly
  one secret word from the starter word list and include it in the room state
  on the backend.

### Secret Word Hiding

- **AC-003 (State)**: While the game is in the playing state, a participant
  who is the drawer shall receive the secret word in the room snapshot.
- **AC-004 (State)**: While the game is in the playing state, a participant
  who is not the drawer shall NOT receive the secret word in the room snapshot.

### Drawer Identification

- **AC-005 (State)**: While the game is in the playing state, every room
  snapshot returned to any participant shall include the drawer's participant
  ID.
- **AC-006 (Response)**: When a participant polls the room state during the
  playing state, the response shall include which participant is the drawer.

### Polling Continuity

- **AC-007 (State)**: While the game page is displayed, the system shall
  continue to poll the room state at approximately 2-second intervals to
  reflect state changes.

---

## Edge Cases

- **Host-only room**: If the host starts the game and another participant
  disconnects before the game loads, the drawer remains the host and the game
  continues with the remaining participant as the sole guesser. This is valid
  because the 2-player minimum was satisfied at start time.
- **Word list unchanged**: The starter word list contains exactly 5 words. The
  spec assumes this list is fixed and not user-customizable. The deterministic
  selection formula must work for any list size >= 1.
- **Single round only**: The secret word is selected once at game start. There
  is no round progression, re-selection, or drawer rotation within this feature
  group.
- **Viewer identity in polling**: When polling during the playing state, the
  frontend sends `participantId` as a query parameter. The backend uses this to
  determine whether the viewer is the drawer and tailors the snapshot
  accordingly (show secret word vs. hide it).
- **Non-drawer fetching another room's state**: Room isolation (AC-013 from
  Feature Group 1) continues to apply. A guesser in Room A cannot see Room B's
  secret word or drawer by manipulating API parameters.

---

## Non-Goals

The following are explicitly NOT in scope for this feature group:

- Implementing guessing logic (submitting, validating, or scoring guesses)
- Canvas or drawing interaction (brush, colors, clear canvas)
- Scoring or score display
- Round timers or countdowns
- Multiple rounds or drawer rotation
- Round results or end-of-round summary
- Game-over detection or restart flow
- Chat or messaging between participants
- Custom word packs or word list editing
- Spectator mode (participants are either drawer or guesser)
- Disconnect detection or reconnection logic

---

## Success Criteria

| ID | Criterion | Verification Method |
|---|---|---|
| SC-001 | Two browser tabs create and join a room; host starts the game; both tabs show the game view | Manual test with two browser tabs |
| SC-002 | The host tab displays the secret word and identifies the participant as the drawer | Manual test: host tab shows secret word + "(Drawer)" |
| SC-003 | The guesser tab does not display the secret word but does identify the drawer | Manual test: guesser tab shows drawer name without secret word |
| SC-004 | The drawer identity is consistent across all participants' views | Both tabs show the same participant ID as drawer |
| SC-005 | Existing unit tests for Feature Group 1 continue to pass | Run `npm test` in backend and frontend directories |
| SC-006 | Room isolation is maintained: drawer/guesser state from one room is not visible in another room | Manual test with two separate rooms |

---

## Key Entities

- **Drawer**: The participant assigned to draw in the current round. Always
  the host for the first (and only) round in this feature group. Identified
  by their participant ID.
- **Secret Word**: The single word selected from the starter list that the
  drawer must illustrate. Visible only to the drawer.
- **Room State (playing)**: The room snapshot during the playing phase includes
  all lobby fields plus `drawerId` and (for the drawer only) `secretWord`.

---

## Assumptions

1. **Host is drawer for round 1.** No randomness or selection logic is needed —
   the room creator (identified by `hostId`) is deterministically the drawer.
2. **Deterministic word selection.** Since randomness is prohibited by the
   constitution, the secret word is selected using a deterministic method
   (e.g., index-based lookup). The exact formula is an implementation detail.
3. **Single-round scope.** Only one round exists in this feature group. The
   secret word is selected once and remains valid for the entire playing phase.
   Multiple rounds and drawer rotation are out of scope per the constitution.
4. **Polling continues in the game view.** The same polling mechanism from
   Feature Group 1 continues during the playing state so that drawer
   identification and state changes are reflected automatically.
5. **Starter word list is fixed.** The 5-word list from `starterData.ts` is the
   sole source of secret words. No customization or extension is supported.
6. **Participant IDs are stable.** The same UUID-based participant ID from the
   lobby phase is used throughout the playing phase. No new IDs are generated
   at game start.
7. **Viewer identity is explicit.** The frontend sends the participant's own ID
   on every room state request (`GET /rooms/:code?participantId=xxx`), and the
   backend uses this to tailor the response (show/hide secret word).

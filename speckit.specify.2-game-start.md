# Specification: Scenario 2 — Game Start & Drawer Flow

## Story
Given a game is starting and player names are trimmed (empty/whitespace-only rejected with a message),
When the first round begins,
Then the host becomes the clearly-identified drawer, and the secret word (deterministically selected from the starter list) is visible only to the drawer.

---

## Acceptance Criteria

### AC2.1: Player Name Validation — Trimming
- **Given** a player enters a name with leading/trailing whitespace,
- **When** they submit the create-room or join-room form,
- **Then** the name is trimmed server-side.
- **And** only the trimmed value is stored and displayed.

### AC2.2: Player Name Validation — Reject Empty
- **Given** a player enters a name that is empty or whitespace-only,
- **When** they submit the create-room or join-room form,
- **Then** the API returns 400 with message `"Player name cannot be empty"`.
- **And** the frontend displays the error inline on the form.

### AC2.3: Game Start Sets Room Status
- **Given** a valid start request is received,
- **When** the game starts,
- **Then** `room.status` changes from `"lobby"` to `"playing"`.
- **And** the drawer + secret word are assigned at this point.

### AC2.4: Drawer Assignment
- **Given** a game starts,
- **When** the round is initialized,
- **Then** the host (room creator) is assigned as the drawer.
- **And** all other participants are guessers.

### AC2.5: Deterministic Word Selection
- **Given** a game starts,
- **When** the secret word is selected,
- **Then** it is chosen deterministically from `["rocket", "pizza", "castle", "guitar", "sunflower"]`.
- **And** the same room code always produces the same word (for reproducibility).

### AC2.6: Drawer-Only Word Visibility
- **Given** a game is in `"playing"` state,
- **When** the drawer views the game page,
- **Then** they see the secret word displayed prominently (e.g., "Your word: ROCKET").
- **When** a guesser views the same room,
- **Then** they do NOT see the word.
- **And** the `GET /rooms/:code` response includes the word only for the drawer's `participantId`.

### AC2.7: Role Identification in UI
- **Given** the game page is loaded,
- **When** the player is the drawer,
- **Then** the UI shows a clear "You are the Drawer" badge and hides the guess input.
- **When** the player is a guesser,
- **Then** the UI shows "You are Guessing" and the guess input is visible.

---

## Edge Cases

| Edge Case | Expected Behaviour |
|-----------|-------------------|
| Host leaves before start | Not handled — host reassignment is out of scope |
| Game already started | `POST /rooms/:code/start` returns 400 `"Game already started"` |
| Word list modification | Always uses the 5 starter words; no custom packs |
| View doesn't match participantId | Fallback to render nothing / redirect home |

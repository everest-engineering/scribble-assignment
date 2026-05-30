## Scenario 2 — Game Start & Drawer Flow

### Problem

When the host starts the game, two things must happen that currently do not: a drawer must be assigned, and a secret word must be chosen. The game screen is a placeholder — it shows the same static content to every player regardless of their role. Players have no way to know who is drawing, and the drawer has no word to draw. The backend transitions the room to `"playing"` but assigns no drawer and selects no word. The `toRoomSnapshot` function returns the same data to everyone, meaning sensitive information (the secret word) cannot be hidden from guessers even once it exists. Additionally, player names are accepted without trimming or emptiness checks, so whitespace-only names can enter the game.

---

### Requirements

#### Player Name Validation
- Player names must be trimmed of leading and trailing whitespace before being stored.
- A name that is empty or whitespace-only after trimming must be rejected with a clear inline error message.
- Rejection happens on the frontend before any API call is made.
- The backend also enforces the rule: a request with an empty or whitespace-only name returns a 400 error.
- Both Create Room and Join Room enforce this rule identically.

#### Drawer Assignment
- When a game starts, the host is assigned as the drawer for the first round.
- Drawer assignment is recorded on the backend in the room's state.
- The drawer identity (`drawerId`) is included in every room snapshot and is visible to all players — everyone needs to know who is drawing.
- Only one player can be the drawer at a time.

#### Secret Word Selection
- A secret word is selected when the game starts, at the same moment the drawer is assigned.
- The word is chosen deterministically from the starter word list using the room code as the seed — the same room code always produces the same word.
- The word is stored on the backend in the room's state.
- The word is never randomly selected; the selection rule must be reproducible.

#### Secret Word Visibility
- The secret word is visible only to the drawer.
- All other players receive `null` (or no value) for the current word in their snapshot.
- The backend enforces this rule in `toRoomSnapshot` by comparing the requesting participant's id to the drawer's id.
- The frontend renders the word only when the viewer is the drawer; guessers never see it.

#### Drawer Identification in the UI
- The game screen clearly identifies who the drawer is by name.
- The drawer's own view shows their role ("You are drawing") and their secret word.
- A guesser's view shows who is drawing ("Waiting for [name] to draw...") and does not show the word.
- The Player Info panel on the game screen shows the viewer's role as "Drawer" or "Guesser".

---

### Edge Cases

- A whitespace-only name (e.g. `"   "`) must be rejected the same way as a fully empty name — after trimming, the result is empty.
- A name that is only spaces on one side (e.g. `"  Alice"`) must be accepted after trimming and stored as `"Alice"`.
- If a player joins with a valid name that has surrounding spaces, the stored name must be trimmed; the raw input must not be persisted.
- The drawer is assigned at the moment of game start — joining the room after the game has started does not change the drawer.
- The secret word must not change between polls. Once assigned, `currentWord` is fixed until the game is restarted.
- The same viewer id used in the polling query (`GET /rooms/:code?participantId=...`) is what determines word visibility — if `participantId` is missing or does not match the drawer, the word is hidden.
- If a player opens the game URL directly without a room in state, they are redirected to the start screen (existing behavior, unchanged).

---

### Acceptance Criteria

**Player name validation**
- [ ] Submitting an empty name on Create Room shows "Player name is required" and does not call the API.
- [ ] Submitting a whitespace-only name on Create Room shows the same error and does not call the API.
- [ ] Submitting an empty name on Join Room shows "Player name is required" and does not call the API.
- [ ] Submitting a whitespace-only name on Join Room shows the same error and does not call the API.
- [ ] A name with surrounding spaces (e.g. `"  Alice  "`) is accepted and stored as `"Alice"` — the trimmed value is displayed in the lobby and game screen.
- [ ] Sending an empty or whitespace-only name directly to the backend returns a 400 error.

**Drawer assignment**
- [ ] After the host starts the game, the room snapshot includes a `drawerId` matching the host's participant id.
- [ ] Every player's snapshot (fetched via polling) includes the same `drawerId`.
- [ ] The drawer is the host — no other participant is ever assigned as drawer in this scenario.

**Secret word selection**
- [ ] After the host starts the game, a `currentWord` is set on the backend.
- [ ] The selected word is one of the five starter words (`rocket`, `pizza`, `castle`, `guitar`, `sunflower`).
- [ ] Starting a game with the same room code always selects the same word (deterministic).
- [ ] Different room codes produce different words (at least across the range of the starter list).

**Secret word visibility**
- [ ] The drawer's snapshot includes the secret word as a non-null string.
- [ ] A guesser's snapshot returns `null` (or no value) for `currentWord`.
- [ ] Calling `GET /rooms/:code` without a `participantId` does not expose the word.
- [ ] Calling `GET /rooms/:code?participantId=<guesser-id>` does not expose the word.
- [ ] Calling `GET /rooms/:code?participantId=<drawer-id>` returns the word.

**Drawer identification in the UI**
- [ ] The drawer's game screen shows their role as "Drawer" (or equivalent) in the Player Info panel.
- [ ] The drawer's game screen shows the secret word clearly.
- [ ] A guesser's game screen shows their role as "Guesser" in the Player Info panel.
- [ ] A guesser's game screen shows the drawer's name in the canvas area (e.g. "Waiting for Alice to draw...").
- [ ] The guesser's game screen does not show the secret word anywhere.

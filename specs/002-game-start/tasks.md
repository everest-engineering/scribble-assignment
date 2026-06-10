# Scenario 2 Tasks: Game Start & Drawer Flow

Checklist of deliverables and implementation order:

- [x] **Backend: Start Game Endpoint**
  - [x] Implement `POST /rooms/:code/start` endpoint on backend
  - [x] Authorize that only the host of the room can successfully trigger start
  - [x] Transition room state status to `active`

- [x] **Backend: Drawer & Word Assignment**
  - [x] Select the host as the initial drawer on game start
  - [x] Select a word from the predefined starter words list (`STARTER_WORDS[0]`)
  - [x] Sanitize room state payload in `GET /rooms/:code` to hide `secretWord` for guessers

- [x] **Frontend: Trigger Game Start**
  - [x] Attach click handler to "Start Game" button in Lobby to call backend (`startGame()` in roomStore)
  - [x] Handle error states if the start endpoint fails (displayed in Status card)

- [x] **Frontend: Game Redirect & Setup**
  - [x] Polling cycle in Lobby detects `active` room status and redirects to `/game`
  - [x] Verify drawer sees secret word in plaintext
  - [x] Verify guesser sees underscores instead of secret word

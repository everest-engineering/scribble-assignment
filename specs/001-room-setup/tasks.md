# Scenario 1 Tasks: Room Setup & Lobby

Checklist of deliverables and implementation order:

- [x] **Backend: Room Setup & Host Assignment**
  - [x] Add `isHost` boolean field to backend `Participant` model
  - [x] Update room creation route to set the creator's participant flag `isHost = true`
  - [x] Ensure subsequent joins set `isHost = false`

- [x] **Backend: Input Validation**
  - [x] Apply `.trim()` to room code and player name in POST handlers
  - [x] Validate length is greater than zero
  - [x] Return clear error responses for invalid payloads

- [x] **Frontend: Join & Create Screen Validation**
  - [x] Trim inputs in frontend state/handlers
  - [x] Prevent submitting forms if fields are empty/whitespace
  - [x] Render clear error messages to the user

- [x] **Frontend: Lobby Gating & Polling**
  - [x] Read `isHost` status of current player
  - [x] Render "Start Game" button only if `isHost === true`
  - [x] Keep "Start Game" button disabled if room has less than 2 players
  - [x] Implement `setInterval` polling `GET /rooms/:code` every 2000ms
  - [x] Clean up polling interval on component unmount to prevent leaks
  - [x] Update state dynamically when new players are retrieved

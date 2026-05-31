# Research: Result, Restart & Final Validation

This document outlines the technical decisions and design rationale for implementing Feature Group 4: Result, Restart & Final Validation.

## Key Decisions

### 1. Result State Transition and Boundary
* **Decision**: The transition of room status from `"in-game"` to `"result"` MUST occur inside the backend `submitGuess` service function within `roomStore.ts`.
* **Rationale**: The backend is the single source of truth for game status. Transitioning on the backend when processing a correct guess prevents client-side desync and ensures all polling clients transition simultaneously.
* **Alternatives Considered**: 
  * Triggering the transition via a separate client API call. Rejected because this allows client manipulation and timing windows where multiple guessers could end up claiming the correct guess, leading to desyncs.

### 2. New REST Endpoint for Restart
* **Decision**: Create a `POST /rooms/:code/restart` endpoint.
* **Rationale**: Aligns with the existing REST pattern (e.g., `POST /rooms/:code/start`) and accepts `{ participantId }` in the JSON request body to authenticate the requester.
* **Alternatives Considered**: 
  * Re-purposing the `POST /rooms/:code/start` endpoint. Rejected because start and restart have distinct requirements (start sets up the drawer and secret word, restart clears them, resets scores, and returns status to lobby).

### 3. Room Snapshot Data Model Extensions
* **Decision**: Add `correctGuesserId: string | null` to the `Room` and `RoomSnapshot` schemas, and include `"result"` as a valid state in `roomStatusSchema`.
* **Rationale**: Explicitly tracking `correctGuesserId` allows the UI to easily display "Bob guessed the word correctly!" without complex client-side parsing of the guess history array. Adding `"result"` to the Zod schema ensures the API boundary remains consistent.
* **Alternatives Considered**: 
  * Client-side evaluation of guess history. Rejected because it violates the principle of having a dumb frontend client and exposes the UI to timing bugs if guess logs poll out of order.

### 4. Client-Side Page Routing and Redirection
* **Decision**: Keep the player on the `/game` route when `room.status === "result"`, and render a conditional "Result" screen layout. Continue polling the backend every 2 seconds. When polling detects `room.status === "lobby"`, redirect the player back to `/lobby`.
* **Rationale**: Avoids adding new client routes, keeps the scoreboard and guess history visible, and simplifies page state management. Polling during the result state is required so that guessers automatically detect the host's restart action and redirect back to the lobby.
* **Alternatives Considered**:
  * Creating a separate `/result` route. Rejected because transitioning routes adds unnecessary complexity to the page lifecycle and makes it harder to preserve the final scoreboard state.

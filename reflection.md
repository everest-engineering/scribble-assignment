# Scribble Reflection

**Branch**: `scribble-lab`

## What did the starter app already have?

- A TypeScript monorepo split into `backend/` and `frontend/`.
- An Express backend with in-memory room storage.
- A React frontend with routing, room creation, room joining, a lobby, and a game page shell.
- HTTP-based communication between frontend and backend.
- Starter word data and basic room/participant models.
- Manual lobby refresh behavior and placeholder game UI sections for canvas, guesses, scores, and results.

## What did we add across the four specs?

### Spec 1: Host and Join Lobby

- Automatic host assignment to the room creator.
- Stronger validation for player names and room codes.
- Shared lobby room snapshots with HTTP polling.
- Clear room isolation so one room does not leak into another.

### Spec 2: Secret Word and Drawer Flow

- A first-round drawer flow where the host selects a starter word.
- Server-side storage of the chosen secret word.
- Drawer-only visibility for the secret word during an active round.
- Clear round-start behavior tied to the first participant being the drawer.

### Spec 3: Drawing Canvas, Guessing, and Scoring

- Active-round canvas drawing and clear actions for the drawer.
- Guess submission with trimming, empty-guess rejection, and case-insensitive matching.
- Synchronized guess history and score updates through polling.
- Drawer-hidden guess input and a fuller in-game UI.

### Spec 4: Round End and Restart

- Round completion as soon as the first correct guess is accepted.
- End-of-round summary showing the correct word, guess history, and final scores.
- Host-only restart back to the lobby.
- Preservation of the player list while clearing round-specific state.

## Short Reflection

The starter app had the basic room and lobby plumbing, but the game itself was mostly a shell. Over the four specs, the project moved from a simple join-and-refresh flow to a full HTTP-polled multiplayer loop with host control, drawer-only information, canvas interaction, scoring, round ending, and restart.

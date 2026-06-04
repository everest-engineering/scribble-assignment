# Scribble Multiplayer Drawing Game: Reflection Report

This report summarizes the design, engineering decisions, and verification of the features added during this lab.

## Key Implementation Highlights

1. **Foundational Game State Models:**
   - Extended the `Room` and `RoomSnapshot` data models to support gameplay state: `hostId`, `drawerId`, `secretWord`, `canvasData` (vector lines serialized to JSON), `guesses`, and `scores`.
   - Synced these interfaces on the frontend API client.

2. **Room Setup & Lobby (User Story 1):**
   - Enforced non-empty and trimmed player names using Zod request validation on the backend.
   - Initialized host tracking and player scores on creation and joining.
   - Implemented automatic 2-second polling in `LobbyPage.tsx` using `setInterval` to periodically synchronize room snapshot details.
   - Added host restrictions: the "Start Game" button is only visible to the host and remains disabled until at least 2 players are in the room.

3. **Game Start & Drawer Flow (User Story 2):**
   - Selected secret words deterministically from the starter words list (`["rocket", "pizza", "castle", "guitar", "sunflower"]`) using `sum(ASCII(roomCode)) % starterWords.length`.
   - Assigned the host as the drawer for the initial round.
   - Built a word-masking mechanism in `toRoomSnapshot` to return the `secretWord` as `null` for any client that is not designated as the drawer.
   - Implemented client-side router redirects so that guessers automatically transition from `/lobby` to `/game` when the room status changes to `"playing"`.

4. **Gameplay Interaction & Painting (User Story 3):**
   - Built a high-performance vector canvas drawing component in `GamePage.tsx` using HTML5 `<canvas>`.
   - Standardized coordinate mappings to a logical size of `800x500` to support responsive CSS resizing without coordinate distortion.
   - Batched vector points into structured `Line` models (`{ color, width, points }`) and sent updates to the backend at the end of each stroke (`onMouseUp`) and on canvas clears.
   - Guessers' screens continuously poll for canvas updates and render them dynamically.
   - Set up the guess submission workflow (trimming input text, case-insensitive secret word matching, and awarding 100 points on correct guess).
   - Hooked up dynamic lists for `Scoreboard` and guess logs (`ResultPanel`).

5. **Result, Restart & Reset Lifecycle (User Story 4):**
   - Automatically transitioned room status to `"result"` when a correct guess was recorded.
   - Displayed a custom overlay on the canvas showing the revealed secret word, final scores, and restart options.
   - Added a compact styling format to the result overlay to prevent vertical clipping on smaller aspect ratio viewports.
   - Implemented the `POST /rooms/:code/restart` route to transition status back to `"lobby"`, clear drawings/guesses, and reset player scores while preserving the connected player list.

## Architectural Decisions

- **In-Memory Thread Safety:** Used clean structured clones (`structuredClone`) on read/write operations within the store map to isolate mutating state changes across concurrent requests.
- **Low-Latency Polling Synchronization:** Configured lightweight polling that runs silently in the background, avoiding intrusive full-page loading indicators to keep the user experience smooth and interactive.
- **Client-Side Rendering Consistency:** Initialized local drawing paths directly on the drawer's screen for real-time stroke rendering, only pushing line arrays to the server on stroke completion to minimize network footprint.
- **No Database / No WebSockets:** Adhered strictly to the constraints by storing all rooms in a Node.js `Map` and relying entirely on HTTP polling.

## Verification

- **Automated Tests:** 13 unit tests cover name validation, `hostId` assignment, score initialization, `startGame` restrictions, deterministic word selection, word masking, vector line drawing submission, case-insensitive guess verification, score awards, and room restarts. All tests run and pass cleanly.
- **End-to-End Testing:** Simulated multiple players connecting, drawing, syncing canvases, guessing words, scoring, and restarting the game successfully inside the browser.

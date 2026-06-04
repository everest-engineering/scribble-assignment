# Reflection Report

## What the starter app already had
The starter provided a minimal brownfield enhancement scaffold with room creation/join flows, in-memory backend storage, a React frontend with routing, and placeholder UI for the game screen. It had working endpoints for creating/joining/polling rooms, seed data (5 words, 2 roles), and a custom RoomStore for frontend state. The manual lobby refresh button was the only polling mechanism.

## What I added
All 4 feature groups were implemented incrementally:

**Group 1 — Room Setup & Lobby:** Host tracking (`isHost` flag), player name validation (trim/reject empty), auto-polling (~2s), host-only start button with 2-player minimum.

**Group 2 — Game Start & Drawer Flow:** Room status machine (`lobby` → `playing` → `finished`), drawer assignment (first participant), deterministic word selection via room code hash, per-viewer word visibility (drawer sees word, guessers see null until round ends).

**Group 3 — Gameplay Interaction:** Interactive HTML5 Canvas with freehand drawing and clear, drawing sync via POST+GET polling, guess submission with trimming and case-insensitive comparison, +100 scoring on correct guess, synced guess history and live scoreboard.

**Group 4 — Result, Restart & Final Validation:** Result state showing word/scores/guesses to all players when finished, host-only restart that preserves the player list while clearing all round state.

## Key decisions

### Polling over WebSockets
HTTP polling at 2s intervals was chosen because WebSockets are explicitly forbidden. This creates a ~2s latency for all sync (drawing, guesses, state transitions). An alternative considered was shortening the interval to 500ms for drawing, but that would generate excessive server load. The tradeoff is acceptable for a lab setting. In production, this should be replaced with WebSockets.

### Deterministic word selection
Word is selected by hashing the room code and taking modulo word count. This ensures the same players always get the same word for the same room code. An alternative — random selection — was rejected because it would make debugging and testing harder. The downside is that word distribution is not uniform across rooms, but the word list is small (5 words) so uniformity is not meaningful.

### Base64 canvas storage
Storing the full canvas as a base64 data URL on the server is simple but wasteful: every stroke sends the entire canvas state. Alternatives like storing stroke arrays (e.g., JSON arrays of `{x, y, color, size}`) would be more bandwidth-efficient and allow replay, but require serialization/deserialization logic and a more complex save endpoint. Given the lab scope (single round, simple drawing), base64 was the pragmatic choice.

### First-participant drawer assignment
The first player to join is always the drawer. This is the simplest rule but means the drawer is always the room creator (since they create the room and are auto-added). An alternative — random assignment on start — would be fairer but adds complexity. Since multi-round is out of scope and each game has only one round, this bias is acceptable.

### Room status machine (lobby → playing → finished)
Three states cleanly gate all behavior: who can start, who can draw, who can guess, and what the UI shows. Adding a fourth "lobby" state after restart reuses the existing lobby flow without needing a separate state. This could be extended to support a pre-start countdown or multiple rounds by adding states before "playing" or a cycle back to "playing".

## Critical analysis

### What could go wrong
- **Stale data in polling:** If the server takes longer than 2s to process a request, clients may see inconsistent state. The risk is low here since all operations are O(1) — no database, no I/O.
- **Race condition on start:** Two hosts (impossible — only one host per room) or a non-host sending start could cause issues. The backend correctly rejects non-host requests with 403.
- **Canvas data loss:** If a user navigates away and comes back, the canvas is re-fetched via polling. If the drawing was saved mid-stroke, it's fine. If the save failed silently, the canvas would be empty. No retry logic exists — the user would need to redraw.
- **Memory leak:** Rooms persist in memory forever. With no cleanup, a server accepting many rooms could run out of memory. In production, an LRU eviction or TTL-based cleanup would be necessary.
- **No concurrency handling:** Express with in-memory store is single-threaded for a given request, so concurrent writes to the same room (e.g., two guessers guessing simultaneously) are safe. But under Node.js cluster mode, the in-memory store would not be shared — that's outside scope.

### What I'd do differently at scale
- Replace polling with WebSockets for real-time sync.
- Use a database for persistence and horizontal scaling.
- Implement room TTL cleanup (e.g., delete rooms after 1 hour of inactivity).
- Use stroke arrays instead of base64 snapshots for bandwidth efficiency.
- Add a drawing throttling mechanism to avoid spamming the server on every mouse move.

### How the architecture holds up
For the lab constraints (single server, in-memory, no real-time), the architecture is clean and functional. The key architectural strength is that all game logic lives in a single service (`roomStore.ts`) with clear method boundaries, making it easy to test (21 tests covering all groups) and easy to replace if the storage layer needs to change. The frontend is similarly clean: each component has a single responsibility (canvas, guesses, scores, results), wired together in GamePage.

The main architectural weakness is tight coupling between room state and the Express route handlers — routes directly call roomStore methods. Adding middleware for logging or analytics would require modifying each route. A controller layer could help but would be over-engineering for 6 endpoints.

## AI usage
AI assisted with code generation, test writing, and file-level planning. Every generated line was reviewed before committing. The AI was instructed to follow existing conventions (Zod validation, Express patterns, React hooks, existing type structures). The AI was also used to draft this reflection and the spec kit artifacts, which were then reviewed and edited for accuracy.

Areas where AI struggled: understanding the exact directory structure expected by the spec kit grader (top-level speckit files vs per-feature-group directories). This required manual correction after the first submission failed the hard gate.

## Tradeoffs
- Canvas sync uses full data URL transfers rather than incremental strokes — simpler but less bandwidth-efficient. Acceptable for a lab with one round.
- No drawer rotation or multiple rounds (explicitly out of scope).
- No stale room cleanup — rooms persist in memory until server restart.
- Polling at fixed 2s interval — simple but wastes bandwidth when nothing changes. An adaptive interval could reduce load.
- First participant is always drawer (bias toward room creator) — acceptable for single-round games.

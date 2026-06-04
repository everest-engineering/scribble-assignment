# Submission Reflection Report — Scribble Game

### What did the starter app already have?
- Foundational page routing setups (`LobbyPage`, `GamePage`, `StartPage`, etc.).
- Basic styling layout components (`Card`, `PageHeader`, `RoomCodeBadge`).
- Minimal frontend state store definitions (`useRoomStore`, `useRoomState`) and base TypeScript configuration models.

### What did you add?
1. **Feature Group 1 (Lobby Sync):** Built a 2-second client-side short-polling loop using React `useEffect` and `setInterval` to cleanly fetch real-time player arrays without WebSockets. Included host status validation (`isHost`).
2. **Feature Group 2 (Drawer Flow):** Implemented host-only start game control paths. Added server-side data extraction boundaries that assign a drawer role, choose a deterministic secret word, and dynamically redact that secret word from the JSON payload unless the requester is the authenticated drawer.
3. **Feature Group 3 (Gameplay Interaction):** Wired up input text filtering (`.trim()`) and case-insensitive string evaluation for game guesses. Configured a tracking system that scores exactly 100 points for correct guesses and appends entries to a global guess history synchronized via regular polling intervals.
4. **Feature Group 4 (Result & Restart):** Introduced a host-restricted restart controller endpoint that sets `gameStarted` back to false, wipes canvas variables, resets scores to 0, and empties the message logs, while preserving player presence in memory to force a seamless client-side lobby redirection loop.

### AI Usage & Engineering Tradeoffs
- **Specification-Driven Development:** Followed a strict documentation-first cycle, maintaining the `.specify/memory/` files to verify that code implementation never expanded out of scope.
- **Polling vs WebSockets:** Embraced the constrained 2-second short-polling standard over WebSockets, optimizing backend data schemas to keep network payload structures light and fast.
# Reflection

# Behind the Build: My Scribble Clone

## What I Built

I built a multiplayer drawing and guessing game (think Skribbl.io) completely from scratch. Over five distinct development phases, I took it from a buggy API baseline to a fully functioning, multi-screen game loop.

* **Squashing the Core Bugs:** Started by fixing a misconfigured `API_BASE_URL` and tightening up our test assertions so they use exact matching instead of loose substrings.
* **Lobby & Room Management:** Implemented a system where players can create or join rooms using 6-character codes. It handles duplicate names gracefully (case-insensitive) and features automatic host promotion if the leader disconnects. The lobby auto-polls every 2 seconds and gates the "Start Game" button until at least 2 players are ready.
* **Game Transitions & Secret Words:** When the host clicks start, everyone seamlessly moves from the lobby to the active game. Word selection is entirely deterministic (using character-code hashing), and security is baked in: the `secretWord` is stripped out at the API level so only the active drawer can see it.
* **The Gameplay Loop:** Built a freehand drawing canvas using native HTML5. Players can submit guesses with both client and server-side validation. Correct guesses rake in +100 points, light up the guess feed in green, and trigger a 3-retry safety wrapper to handle any transient network blips.
* **The Finish Line:** A correct guess triggers the `"result"` state, displaying a final scoreboard and highlighting the winner. From there, the host can hit "Play Again" to reset the round while keeping everyone's scores intact. The magic glue holding this all together is a centralized `PollingRouter` component that handles all screen navigation based on the current room status.

---

## Technical Choices & Tradeoffs

### Polishing the Polling Router

Because WebSockets weren't on the table for this project, I had to rely on a 2-second polling loop. To avoid messy duplicate intervals and keep page components clean, I abstracted this logic into a system-level `PollingRouter`. This keeps the backend entirely stateless. The obvious tradeoff here is UI snappiness; state transitions (like a winning guess or a game restart) have a slight asynchronous lag while waiting for the next poll.

### Lightweight Host Promotion

For access control, `hostId` is the single source of truth. If a host leaves, the system automatically hands the crown to whoever has the oldest `joinedAt` timestamp. Is it fancy? No. But it kept the in-memory model incredibly lean and completely avoided the need for complex election consensus protocols.

### Defensive State Management

To prevent accidental state mutation leaks, all rooms live in a `Map<string, Room>`, and I run a `structuredClone()` on every single read. This forced a beautiful, clean separation between my pure service logic and the response layer. The known limitation here is race conditions—if two players guess correctly at the exact same millisecond, both might process before the status officially flips to `"result"`. For the scope of this project, I accepted that risk.

### Data Security at the Boundary

Instead of sending the whole room object and trusting the frontend to hide the secret word, `toRoomSnapshot()` checks the `viewerParticipantId` and strips the answer out at the API gateway. This "security-in-depth" approach means even a modified client can't cheat. It did mean that different players get slightly different snapshots, so I had to write rigorous tests to ensure the polling loop didn't trigger unnecessary re-renders.

### The Value of Planning (Spec Kit)

Following a strict "Spec $\rightarrow$ Plan $\rightarrow$ Analysis $\rightarrow$ Implement" workflow saved me hours of debugging. By forcing myself to answer edge-case questions *before* writing code—like "Can a drawer guess their own word?" (no) or "What happens to old guesses when a room restarts?"—I caught design flaws while they were still just text on a screen.

---

## What I'd Do Differently Next Time

### 1. Implement a Room Lifespan (TTL)

Right now, rooms live forever in memory. If a group of players abandons a room, it becomes an orphan. Adding a simple Time-To-Live (TTL) mechanism (e.g., sweeping and deleting rooms with 30 minutes of inactivity) would prevent unbounded memory growth.

### 2. Clean Up the "Last Player Leaves" Edge Case

When the absolute last person leaves a room, the code currently forces a bit of a type-cast smell: `hostId: null as unknown as string`. It works, but it's sloppy. Next time, I'd properly update the type system to allow an optional `hostId` or just delete the room entirely when the player count hits zero.

### 3. Share a Single Source of Truth for Types

Right now, the frontend and backend duplicate interfaces like `RoomSnapshot` and `Participant`. Setting up a shared package (like a `packages/shared/` directory in a monorepo) would prevent type drift. I'd also pair this with Zod schemas on the client side to validate incoming server payloads at runtime.

### 4. Build Silent Retry Resilience

While guess submissions have a 3-retry wrapper, the core `fetchRoom` polling loop doesn't. A single network hiccup can cause the UI to flash an error state. I'd implement a "silent retry" pattern that holds onto the last known valid snapshot during a temporary blip rather than breaking the user experience.

### 5. Make the Canvas Truly Responsive

The drawing canvas uses a hardcoded minimum height logic (`Math.max(500, parent.clientHeight)`), which admittedly looks a bit broken on smaller mobile viewports. Switching to a CSS `aspect-ratio` layout or monitoring the container with a `ResizeObserver` would make the drawing experience seamless on any screen size.
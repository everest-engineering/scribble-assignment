# Reflection: Multiplayer Drawing Game Implementation

## Overview

This reflection documents the implementation of a complete multiplayer drawing and guessing game (Scribble) across four incremental scenarios. The project follows strict brownfield constraints: in-memory storage only, HTTP polling (no WebSockets), no authentication, and TypeScript strictness throughout.

## Scenarios Delivered

### Scenario 1 — Room Setup & Lobby
Implemented the foundational room creation and join flow. Key decisions:
- Used 4-character alphanumeric room codes for easy sharing
- In-memory `Map<string, Room>` for room storage with UUID-based participant IDs
- Host tracking via `hostId` field to gate "Start Game" button
- Lobby page with real-time participant list via polling

**Challenge**: Ensuring unique room codes without persistence. Solution: simple random generation with collision acceptance (low probability for 4-char alphanumeric space).

### Scenario 2 — Game Start & Drawer Flow
Extended the lobby to active game transition. Key decisions:
- Atomic drawer assignment on game start (`drawerId = hostId`)
- Deterministic word selection using room code hash for reproducibility
- Viewer-gating in `toRoomSnapshot()`: `currentWord` only visible to drawer
- Status machine: `RoomStatus = "lobby" | "playing" | "finished"`

**Challenge**: Preventing word leakage to guessers. Solution: server-side gating in snapshot generation, never transmitting the word to non-drawer clients.

### Scenario 3 — Gameplay Interaction
Implemented the core game loop: drawing and guessing. Key decisions:
- Stroke data as discriminated union (`draw` with coordinates, `clear` action)
- Canvas redraw on every poll cycle (full stroke replay)
- Guess validation: trimming, case-insensitive comparison, empty rejection
- Score tracking on participants (+100 for correct guess)
- One correct guess cap per player to prevent farming

**Challenge**: Canvas state synchronization without WebSockets. Solution: Store stroke list on room, replay on every poll. Acceptable for small-scale multiplayer.

### Scenario 4 — Round Result, Restart & Final Validation
Completed the game loop with round-end and restart. Key decisions:
- Auto-end on correct guess (`room.status = "finished"`)
- Manual end endpoint (`POST /:code/end`) for host control
- Restart endpoint (`POST /:code/restart`) clearing round state but preserving participants
- Lifted `currentWord` gating in `finished` status for result display
- Three-way conditional rendering in GamePage: lobby/playing/finished

**Challenge**: Post-restart navigation. Decision: Stay on GamePage with simplified lobby content rather than navigating to LobbyPage, avoiding state loss and keeping the flow seamless.

## Architecture Decisions

### In-Memory Storage
Chosen for simplicity and to meet brownfield constraints. Trade-off: no persistence across server restarts. Acceptable for a demo/prototype.

### HTTP Polling
Chosen to avoid WebSockets constraint. Polling interval of ~2 seconds provides acceptable latency for this use case. Trade-off: slightly stale state vs. complexity of real-time push.

### TypeScript Strictness
Enforced throughout with Zod validation on all API inputs. Zero `any` types in the codebase. This caught several potential runtime errors during development (e.g., nullability of `participantId` in GamePage handlers).

### Component Structure
Frontend components kept small and focused: `Card`, `RoomCodeBadge`, `Scoreboard`, `ResultPanel`, `GuessForm`. This made the GamePage refactor for Scenario 4 manageable—conditional rendering on status rather than separate pages.

## Challenges and Solutions

### Nullability in React Components
Issue: `participantId` could be null during initial render or state transitions. Solution: Added explicit nullability guards before all API calls (`if (!room || !participantId) return;`). TypeScript strictness caught these early.

### Canvas State Management
Issue: Canvas is imperative DOM, but React is declarative. Solution: Used `useRef` for canvas element and `useEffect` for redraw on stroke changes. Kept stroke submission as imperative event handlers.

### Status Machine Complexity
Issue: Three states (lobby, playing, finished) with different UI requirements. Solution: Centralized conditional rendering in GamePage based on `room.status`. Each branch is self-contained with its own UI elements.

### Word Selection Determinism
Issue: Need reproducible word selection per room without persistence. Solution: Used room code character sum modulo 5 to index into a fixed starter word list. Same room code always selects same word.

## Lessons Learned

1. **Spec-First Development Pays Off**: Having detailed spec.md, plan.md, and tasks.md for each scenario kept implementation focused and reduced rework. The `/speckit` workflow enforced discipline.

2. **TypeScript as a Safety Net**: Strict typing caught numerous edge cases (nullability, wrong property access) before runtime. Zod validation added a second layer of safety on API boundaries.

3. **Incremental Complexity**: Building scenarios incrementally (1→2→3→4) made the codebase manageable. Each scenario built on the previous, allowing for focused testing at each stage.

4. **Brownfield Constraints as Creative Constraints**: The "no WebSockets, no database" constraints forced simple, elegant solutions (polling, in-memory maps) that are easier to reason about and test.

5. **State Machine Clarity**: Explicit status transitions (`lobby` → `playing` → `finished`) made UI rendering logic straightforward. Future enhancements (e.g., timer-based auto-end) can plug into this machine cleanly.

## Future Enhancements (Out of Scope)

- Timer-based round auto-end (e.g., 60 seconds)
- Word rotation across rounds (different word each round)
- Player leave/kick functionality
- Room inactivity cleanup (remove idle rooms)
- Multi-round score persistence (accumulate across rounds)
- Drawing tools (colors, brush sizes)
- Guess hints (reveal first letter after N incorrect guesses)

## Conclusion

The implementation successfully delivers a complete multiplayer drawing game within the specified constraints. The four-scenario progression provided a clear path from basic room setup to full gameplay loop. The codebase is clean, type-safe, and ready for further enhancement.

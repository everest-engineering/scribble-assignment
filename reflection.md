# Reflection — Scribble Multiplayer Drawing Game

## Starter Code Provided

The project began as a monorepo skeleton with:

- **Backend**: Express + TypeScript setup, a `Room` model skeleton with `code`, `status`, `participants`, host/drawer/word fields, an empty `roomStore.ts`, a `schemas.ts` shell, and Vitest test configuration with 2 seed tests.
- **Frontend**: React 18 + Vite + TypeScript setup, a `roomStore.ts` with Zustand-like store skeleton, an `api.ts` service client, and stub pages (`HomePage`, `LobbyPage`, `GamePage`) with mock data, plus Vitest test configuration with 2 seed tests.
- **Spec Kit**: `constitution.md`, `spec.md`, `plan.md`, `tasks.md` defining constraints (no WebSockets, in-memory only, no auth, no databases) and the full feature specification for US1–US4.

## What Was Implemented for US1–US4

### US1 — Room Setup & Lobby (P1)
- `createRoom()` / `joinRoom()` in `roomStore.ts` with host assignment, room code generation, participant tracking
- `POST /rooms` and `POST /rooms/:code/join` routes with Zod validation
- LobbyPage polling every 2s via `fetchRoom()`
- Host-only start enforcement (button disabled for non-host, server-side guard)
- Minimum 2 players check before game start
- Error handling for invalid room codes (404) and empty/whitespace names

### US2 — Game Start & Drawer Flow (P2)
- `POST /rooms/:code/start` endpoint with host validation
- Host automatically becomes drawer (`drawerId = hostId`)
- Deterministic word selection (`STARTER_WORDS[0]`)
- `toRoomSnapshot()` conditionally reveals `secretWord` only to the drawer
- GamePage shows drawer identification, role labels, and secret word for drawer only
- LobbyPage auto-navigates to `/game` when room status becomes `"playing"` (for both host and other players via polling)

### US3 — Gameplay Interaction (P3)
- CanvasBoard component with mouse-based drawing, stroke capture, and `penDown` tracking for replay
- `POST /rooms/:code/drawing` and `POST /rooms/:code/drawing/clear` endpoints
- Drawing persisted on mouseup and replayed from `room.drawing` via polling
- `POST /rooms/:code/guess` endpoint with case-insensitive matching
- GuessForm component integrated with API
- ResultPanel displays guess history in real-time
- Scoreboard shows sorted participant scores
- 100 points awarded for correct guess, 0 for incorrect

### US4 — Result & Restart (P4)
- `"finished"` status added to `RoomStatus` type
- `submitGuess()` auto-sets `room.status = "finished"` on correct guess
- ResultPanel shows final scores, correct word, and full guess history when `isFinished`
- GamePage hides canvas and guess form when finished
- `POST /rooms/:code/restart` endpoint with host-only guard
- `restartGame()` preserves participants and room code, resets drawing/guesses/scores
- Restart button visible only to host; all players auto-return to lobby via polling detecting `status === "lobby"`

## How the Spec Kit Was Used

The four speckit documents drove every implementation decision:

- **Constitution.md**: Constrained the tech stack (no WebSockets, no DB, no auth, in-memory only) and established brownfield enhancement over new architecture.
- **Spec.md**: Provided all 19 acceptance scenarios, 14 functional requirements, 5 success criteria, and 9 edge cases — used as the checklist for feature completeness.
- **Plan.md**: Defined the 4-phase implementation order (US1→US2→US3→US4) which was followed chronologically.
- **Tasks.md**: Provided granular task breakdown (51 tasks across 7 phases) that guided step-by-step implementation.

Spec scenarios were verified against actual code paths rather than manual testing alone. Each acceptance criterion was mapped to its implementing function/component/route.

## AI Usage and Validation Approach

AI (opencode / Claude) was used throughout development for:

- **Code generation**: Implementing Express routes, Zod schemas, React components, store methods, and state synchronization logic.
- **Architecture decisions**: Choosing polling (setInterval) over WebSockets, selecting `useSyncExternalStore` for store reactivity, using conditional `toRoomSnapshot` for word visibility.
- **Code review and verification**: Cross-referencing implementation against spec acceptance criteria, checking edge cases (empty/whitespace names, case-insensitive guesses, invalid room codes).
- **Build validation**: Running `npm run build` and `npm test` after each phase to ensure no regressions.

Validation approach:
1. Each US was implemented independently against its spec scenarios.
2. TypeScript compilation (`tsc`) was the first gate — code must compile.
3. Unit tests (Vitest) confirmed core logic: room isolation, schema validation, store operations.
4. Acceptance scenarios were traced through the actual code to verify behavior.
5. Final comprehensive verification against all 19 scenarios, 14 FRs, 5 SCs, and 9 edge cases.

## Tradeoffs and Constraints

| Constraint | Decision | Rationale |
|---|---|---|
| No WebSockets | HTTP polling every 2s | Simpler implementation, aligns with spec constraints |
| In-memory storage | `Map<string, Room>` | State resets on restart; no persistence needed |
| No authentication | Participant ID returned on create/join | Sufficient for session tracking without auth overhead |
| Single round | No multi-round or drawer rotation | Spec assumes single round per game |
| Host = drawer | No separate drawer assignment | Simplified role logic; spec allows this |
| Deterministic word | `STARTER_WORDS[0]` always selected | Predictable for testing; extensible to random later |
| Append-only drawing | Points pushed incrementally | Clear canvas is sole reset mechanism; supports replay |
| Store architecture | Custom class with `useSyncExternalStore` | Zustand-like but avoids external dependency; fits existing pattern |

# Reflection — Scribble Multiplayer Drawing Game

**Date**: 2026-07-06
**Starter commit**: `4568311` (scaffold-only)
**Current HEAD**: `d3ab38d`
**Total delta**: 158 files changed, ~17,600 insertions

## Starting Point

The project began as a TypeScript monorepo scaffold with an Express backend (`backend/`) and a React + Vite frontend (`frontend/`). The scaffold provided:

- **Backend**: Express server skeleton, Zod validation schemas (empty), room store skeleton, starter word/role data
- **Frontend**: React app skeleton with routing, basic UI components (Card, PageHeader), CSS, Vitest setup
- **Common**: TypeScript configs, `tsx` for dev execution, ES Modules throughout

No game logic existed — no room creation, no participants, no drawing, no guessing, no scoring.

## What Was Built

Eight features were implemented incrementally, each building on the previous:

### Feature 001 — Host Tracking
Room creator automatically designated as host (`hostId` on Room, `isHost` on Participant). "Host" label displayed in participant lists.

### Feature 002 — Join Validation
Invalid/empty room codes rejected with clear error messages. Frontend + backend validation for room code format and existence.

### Feature 003 — Multi-Room Isolation
Each room stored in an isolated `Map<string, Room>`. Dedicated tests verified no participant/state leakage between rooms.

### Feature 004 — Automatic Lobby Polling
Lobby page polls room state every ~2s using `setInterval` + `fetchRoom`. Auto-navigates to game on status change, to home on 404. Overlapping cycles prevented.

### Feature 005 — Host Start Control
"Start Game" button visible only to host. Disabled until ≥2 players. Prevents non-host from starting.

### Feature 006 — Game Start & Drawer Flow
Start game endpoint transitions room to `"drawing"`, assigns host as round-1 drawer, selects word deterministically via `(round-1) % words.length`. Word visible only to drawer.

### Feature 007 — Gameplay Interaction
Interactive HTML Canvas drawing (single black pen, stroke-based model). Guess submission with frontend+backend validation (trim, reject empty, case-insensitive compare). Guess history and scoring via HTTP polling. Only first correct guesser scores 100. "Clear Canvas" and "Next Word" for drawer.

### Feature 008 — Result, Restart & Final Validation
Drawer can end the game → room enters `"result"` status showing correct word, final scores, guess history. Host-only "Restart" returns everyone to lobby with participants preserved and all round state cleared. All gameplay actions rejected in result state.

## Architecture & Key Decisions

### State Model
- All game state lives in a single `Map<string, Room>` in `roomStore.ts`
- No database — purely in-memory, ephemeral sessions
- Room state cloned via `structuredClone` on every read/write (immutability pattern)

### Synchronization
- HTTP polling only — no WebSockets, no push protocols
- Frontend polls every ~2s; overlapping cycles prevented with ref flags
- Server never initiates communication

### Validation
- Zod schemas for all request payloads on the backend
- Frontend validates before sending (empty guesses, whitespace-only names)
- All gameplay actions check room status, participant roles, and ownership

### Route Design
- RESTful POST endpoints for actions (`/rooms/:code/start`, `/guess`, `/canvas`, `/next-word`, `/end-game`, `/restart`)
- `participantId` passed as query param or body depending on endpoint
- Consistent error response pattern using `HttpError` class

### Component Structure
- Shared UI primitives: `Card`, `PageHeader`, `RoomCodeBadge`
- Game-specific: `Canvas`, `GuessForm`, `ResultPanel`, `Scoreboard`, `ResultView`
- State management via custom `RoomStore` class with `useSyncExternalStore`

## Challenges & Learnings

1. **CurrentRound guard vs restart**: The frontend store had a guard preventing `currentRound` from decreasing (to avoid stale poll overwrites). Restart legitimately resets it to 0, which broke snapshot updates. Fixed with an exception for `status === "lobby"` updates.

2. **Secret word visibility**: `toRoomSnapshot` only showed the secret word to the current drawer. In result state, all participants must see it. Fixed by checking `status === "result"` in the snapshot function.

3. **Missing status guards**: The canvas and next-word endpoints only checked drawer identity, not room status. After the game ended, the former drawer could still draw. Fixed by adding `status === "result"` rejection guards.

4. **Analysis-before-implementation**: The 6-pass analysis caught 2 critical issues that would have been bugs in production. This validated the speckit workflow's emphasis on analysis before implementation.

## Current State

- **Build**: Both backend and frontend build with zero TypeScript errors
- **Tests**: 16 tests pass (14 backend + 2 frontend)
- **Complete flow**: Create room → join → lobby polling → start game → draw/guess/score → end game → view results → restart → play again
- **Branch**: `008-result-restart-validation`

## What's Next

Potential future work (not in scope of current features):
- Room cleanup / inactive room garbage collection
- Additional drawing tools (colors, brush sizes)
- Timed rounds with auto-advance
- Spectator mode for late joiners
- Multiple rounds with rotating drawers per the spec

# Discovery & Scaffold Report

**Date**: 2026-06-01 | **Project**: Scribble Multiplayer Drawing Game | **Version**: 1.0

---

## Executive Summary

This document captures the research phase, design decisions, and scaffolding choices made during the Scribble starter assessment and 001-gameplay-flow feature development. It provides rationale for architectural and technical decisions to guide future feature implementation and review.

---

## Project Context

**Goal**: Build a lightweight, multiplayer drawing game where one player draws while others guess the secret word. Players earn points for correct guesses; games reset between rounds while preserving player membership.

**Constraints**:
- No database or persistent storage (in-memory only)
- No WebSockets or real-time push protocols (HTTP polling)
- No authentication or session management
- TypeScript-first, strict type discipline

---

## Discovery Phase

### 1. Feature & User Story Analysis

**Key Finding**: The game logic divides naturally into four sequential user stories:

1. **Room Setup & Validation (P1)**: Create/join flows with host assignment
   - Rationale: Entry point for all gameplay; host role is foundational
   - Decision: Room creator becomes host; validation happens server-side

2. **Lobby Polling & Host Control (P2)**: Live participant updates and host-only start
   - Rationale: Players must see each other before gameplay; host control prevents invalid transitions
   - Decision: ~2s polling cycle balances UX responsiveness with server load

3. **Round Gameplay (P2)**: Secret word visibility, drawing prompt, and guessing
   - Rationale: Core gameplay loop; secret word visibility enforces game rules
   - Decision: Drawer role assigned per round; word hidden from guessers in API response

4. **Results & Restart (P3)**: Scoring, display, and room reuse
   - Rationale: Closes game loop; enables consecutive rounds
   - Decision: Scores accumulate across rounds; host-only restart clears round state but preserves room membership

### 2. Architecture Decisions

#### HTTP Polling vs. WebSockets
**Decision**: HTTP polling for room state refresh  
**Rationale**:
- Simpler server-side implementation (no connection state management)
- Easier debugging (no persistent connections)
- Constraint compliance (no WebSockets allowed)
- Sufficient for ~2s refresh cadence

**Trade-off**: Higher overhead per request, but acceptable for small room sizes (<10 players)

#### In-Memory Store vs. Database
**Decision**: In-memory `Map` keyed by room code  
**Rationale**:
- No external dependencies or configuration
- Immediate startup and test isolation
- Meets constraint requirements
- Room cleanup on idle can reduce memory footprint

**Trade-off**: No persistence; rooms are lost on server restart

#### State Update Strategy
**Decision**: Immutable state snapshots returned by API; client stores snapshots  
**Rationale**:
- Clear, predictable state transitions
- Easier to debug state mismatches
- Polling naturally merges new snapshots

**Trade-off**: All state is stateless from backend perspective; no session affinity needed

---

## Scaffolding Decisions

### 1. Backend Structure

**Path**: `backend/src/`

```text
api/
  rooms.ts       - Express route handlers (POST create, POST join, POST start, POST guess, POST restart)
  schemas.ts     - Zod validation schemas (CreateRoomInput, JoinRoomInput, StartGameInput, GuessInput, etc.)
  router.ts      - Route aggregation
models/
  game.ts        - TypeScript types (Room, Player, Round, Guess, Scoreboard)
services/
  roomStore.ts   - In-memory store logic (Map<code, Room>), room lifecycle methods
app.ts           - Express app setup
server.ts        - Server entry point
```

**Rationale**:
- `api/` handles HTTP contracts (schemas, validation, response formatting)
- `services/` encapsulates business logic (isolation for testing)
- `models/` declares domain types (single source of truth)
- Clear layering enables refactoring without breaking routes

### 2. Frontend Structure

**Path**: `frontend/src/`

```text
pages/
  CreateRoomPage.tsx   - Room creation form
  JoinRoomPage.tsx     - Room join form
  LobbyPage.tsx        - Pre-game lobby with polling
  GamePage.tsx         - Active round gameplay
  StartPage.tsx        - Entry point
routes/
  index.tsx            - React Router configuration
services/
  api.ts               - API client (REST calls)
state/
  roomStore.ts         - Zustand store (room snapshot, polling logic, actions)
components/
  GuessForm.tsx        - Guess submission input
  Scoreboard.tsx       - Player scores display
  RoomCodeBadge.tsx    - Room code display
  PageHeader.tsx       - Page title/navigation
  ResultPanel.tsx      - Results and restart button
  Card.tsx             - Reusable card layout
```

**Rationale**:
- `pages/` map to React Router routes
- `state/` centralizes room polling and state updates
- `services/api.ts` decouples HTTP from React components
- Functional components with hooks throughout

### 3. Data Model Design

**Room** (in-memory):
```typescript
{
  code: string                    // Unique 4-6 char code
  hostId: string                  // Player ID of host
  players: Map<playerId, Player>
  currentRound: Round | null
  scores: Map<playerId, number>
  createdAt: number
}
```

**Player**:
```typescript
{
  id: string                      // UUID or short ID
  name: string                    // Display name (trimmed)
  role: 'drawer' | 'guesser'      // Assigned per round
}
```

**Round**:
```typescript
{
  secretWord: string              // Only sent to drawer
  guesses: Guess[]                // Accumulated submissions
  isActive: boolean               // Drawer is drawing
  status: 'active' | 'ended'
}
```

**Rationale**:
- `code` is human-friendly room identifier
- `hostId` enables host-only actions without session state
- `currentRound | null` clearly distinguishes lobby vs. gameplay states
- Scores accumulate per player (not reset between rounds)

---

## API Contract Decisions

### Polling Response Format

**Endpoint**: `GET /rooms/:code`  
**Response**:
```typescript
{
  code: string
  hostId: string
  players: Array<{
    id: string
    name: string
    score: number
  }>
  currentRound?: {
    drawerName: string           // Drawer's display name
    secretWord?: string          // Only if current player is drawer
    guesses: Guess[]
    isActive: boolean
  }
  status: 'lobby' | 'active' | 'ended'
}
```

**Rationale**:
- `secretWord` omitted from response unless current player is drawer
- `drawerName` (not ID) reduces client-side lookup work
- Flat, explicit structure avoids nested lookups

### Validation Schemas

**Room Code**: 4-6 alphanumeric characters (uppercase), must be unique and exist for join  
**Player Name**: 1-50 characters, trimmed, non-empty after trim  
**Guess**: 1-50 characters, trimmed, non-empty after trim  

**Rationale**:
- Short codes are human-memorable
- Trimming prevents whitespace-only submissions
- Constraints are enforced server-side and communicated to client

---

## Testing Strategy

### Backend (Vitest)

1. **Unit Tests** (`roomStore.test.ts`):
   - `createRoom()`: Generates unique codes, marks creator as host
   - `joinRoom()`: Validates code and player name, adds to players
   - `startRound()`: Assigns drawer, initializes empty guess list
   - `submitGuess()`: Trims input, checks correctness, updates scores
   - `restartRound()`: Clears round state, preserves scores

2. **Integration Tests** (`schemas.test.ts`):
   - API input validation (create, join, start, guess, restart)
   - Error messages are descriptive

### Frontend (Manual & Vitest)

1. **Manual Smoke Tests**:
   - Create room, confirm host badge
   - Join from second tab
   - Trigger lobby polling, confirm updates
   - Start game, verify drawer/guesser roles
   - Submit guess, confirm API sync
   - Restart, confirm return to lobby

2. **Component Tests** (optional):
   - `GuessForm`: Validates trimming, disables on submission
   - `Scoreboard`: Displays cumulative scores correctly

---

## Assumptions & Risks

### Assumptions

1. **Small room sizes** (<10 players): Design not validated for large concurrent loads
2. **Synchronous guess correctness**: No race conditions between multiple correct guesses
3. **Single drawer per round**: Game rules enforced by host starting game
4. **HTTP reliability**: Polling assumes network stability; no retry logic beyond standard fetch

### Risks

1. **Memory growth**: No automatic room cleanup; stale rooms persist until server restart
   - **Mitigation**: Document cleanup policy; consider timeout-based removal in future feature

2. **Polling latency**: ~2s refresh may feel stale for fast-paced guessing
   - **Mitigation**: Polling interval is configurable; can reduce if server load allows

3. **State consistency**: If polling requests overlap, client may see out-of-order state
   - **Mitigation**: Polling uses `lastModified` timestamp; newer snapshots override older

---

## Future Directions

1. **Persistence**: Add database layer (PostgreSQL/MongoDB) to survive server restarts
2. **Real-Time**: Upgrade to WebSockets for sub-second updates
3. **Drawing Canvas**: Implement actual drawing UI (canvas, strokes, save/load)
4. **Authentication**: Add user accounts and persistent score tracking
5. **Room Cleanup**: Implement timeout-based removal of idle rooms
6. **Observability**: Add logging and metrics for room lifecycle and API latency

---

## Conventions & References

- **Naming**: Room codes are uppercase; player IDs are lowercase UUIDs
- **Timestamps**: Use ISO 8601 format or Unix milliseconds
- **Error Codes**: Use HTTP status codes (400 for validation, 404 for not found, 500 for server error)
- **Spec Reference**: See `specs/001-gameplay-flow/` for detailed requirements and acceptance tests

# Reflection: Scribble Multiplayer Drawing Game Implementation

**Date**: 2026-06-15

**Project**: Scribble Assignment – Multiplayer drawing and guessing game

**Status**: Scenario 4 Complete (All 4 Scenarios Implemented)

---

## Overview

This reflection documents the design decisions, implementation journey, and key learnings from implementing the Scribble multiplayer drawing game across four distinct scenarios using a brownfield Node.js/Express backend and React frontend with HTTP polling for state synchronization.

---

## Implementation Summary

### Scenarios Completed

1. **Scenario 1: Room Setup, Lobby & Host Control**
   - Created room creation endpoint with automatic host assignment
   - Implemented lobby state with polling-based participant list refresh
   - Enforced host-only game start with minimum participant validation

2. **Scenario 2: Game Start, Drawer Assignment & Secret Word Visibility**
   - Implemented deterministic drawer assignment (first participant)
   - Built hash-based word selection ensuring same room code always yields same word
   - Enforced role-based visibility – secret word hidden from guessers, visible to drawer

3. **Scenario 3: Guess Submission, Scoring & Shared History**
   - Implemented guess normalization (trim whitespace, case-insensitive comparison)
   - Built scoring logic (100 points for correct guess, 0 for incorrect)
   - Created shared guess history synced via polling to all players
   - Implemented drawer-only canvas clearing capability

4. **Scenario 4: Round Results, Final Scores & Restart Flow**
   - Implemented automatic round completion on correct guess
   - Built result display showing correct word, final scores, and complete history
   - Implemented host-only restart that clears round state while preserving room and participants
   - Ensured multi-round support with clean state transitions

---

## Architecture Decisions

### 1. **HTTP Polling Over WebSockets**
- **Decision**: Use ~2 second polling cadence for all state synchronization
- **Rationale**: Simpler to reason about; no persistent connections; easier to test; meets assignment constraints
- **Trade-off**: Higher latency than push-based updates; acceptable for turn-based guessing game
- **Implementation**: Frontend uses `setInterval` in `useEffect` to fetch room state; cleanup on unmount

### 2. **In-Memory Only State Storage**
- **Decision**: All room state, participants, guesses stored in Node.js Map<string, Room>
- **Rationale**: Assignment constraint; simplifies data model; no database overhead
- **Trade-off**: Data lost on server restart; not suitable for production; acceptable for lab/demo
- **Implementation**: `roomStore.ts` service with CRUD operations on in-memory Map

### 3. **Deterministic Word Selection**
- **Decision**: Hash room code (modulo word array length) to select secret word
- **Rationale**: Same room code always produces same word; players can rejoin and word remains consistent
- **Implementation**: `hashCode(code) % starterData.words.length` yields stable index

### 4. **Typed Zod Validation**
- **Decision**: All request payloads validated with Zod schemas before business logic
- **Rationale**: Fail fast on invalid input; catch errors early; improve debuggability
- **Implementation**: Backend validates `{ participantId, guessText }` for each endpoint

### 5. **Frontend State with useSyncExternalStore**
- **Decision**: Custom `RoomStore` class with `useSyncExternalStore` hook instead of Redux/Zustand
- **Rationale**: Lightweight; explicit subscriptions; built-in React patterns
- **Implementation**: Store exposes `subscribe()` and `getSnapshot()` for React integration

---

## Technical Challenges & Solutions

### Challenge 1: TypeScript Callback Type Compatibility
**Problem**: GuessForm `onSubmit` prop expected `Promise<void>` but received `Promise<RoomSnapshot>`

**Solution**: Changed prop type to `Promise<unknown>` to accept any Promise without requiring void return

**Learning**: Promise return types in React callbacks should use `unknown` if the return value isn't explicitly used

---

### Challenge 2: Role-Based Visibility
**Problem**: Secret word visible to all players via same API response

**Solution**: Implemented conditional reveal in `toRoomSnapshot()` – check if participant is drawer before including secretWord

**Implementation**:
```typescript
secretWord: participant.id === activeRound?.drawerId ? activeRound.secretWord : undefined
```

---

### Challenge 3: Preventing Drawer Self-Guessing
**Problem**: Drawer could submit guesses as both drawer and guesser

**Solution**: Added explicit check in `submitGuess()` – throw error if participantId matches drawerId

**Implementation**:
```typescript
if (guess.participantId === activeRound.drawerId) {
  throw new Error("Drawer cannot submit guesses");
}
```

---

### Challenge 4: Scoring Without Duplicates
**Problem**: Multiple correct guesses could grant points multiple times

**Solution**: Set `isFinished=true` on first correct match; prevent further guesses when round finished

**Implementation**: Check `activeRound.isFinished` before processing new guesses

---

## Data Model Evolution

### Round 1: Minimal State (Scenario 1)
```typescript
interface Room {
  code: string;
  host: string;
  status: "lobby" | "active";
  participants: Participant[];
}
```

### Round 2: Role Assignment (Scenario 2)
```typescript
interface ActiveRound {
  drawerId: string;
  secretWord: string;
}
```

### Round 3: Guess Tracking (Scenario 3)
```typescript
interface Room {
  ...
  guesses: Guess[];
  canvasCleared: boolean;
}
```

### Round 4: Round Completion (Scenario 4)
```typescript
interface ActiveRound {
  ...
  isFinished: boolean;
  finishedAt?: string;
}
```

---

## Code Quality & Testing

### TypeScript Coverage
- **Backend**: 100% TypeScript; all functions typed; no `any` usage
- **Frontend**: 100% TypeScript; React components typed; hook types explicit
- **Zod Schemas**: All API payloads validated with schema objects

### Build Validation
- **Backend**: `npm run build` succeeds; no TypeScript errors
- **Frontend**: `npm run build` succeeds; no TypeScript errors
- **Compilation**: Both environments compile to JavaScript ES modules

### Test Coverage
- **Backend**: roomStore.test.ts covers room creation, start, participant management
- **Frontend**: api.test.ts covers API contract types and HTTP methods
- **Integration**: Manual validation covers end-to-end scenario flows

---

## Lessons Learned

### 1. **Deterministic Functions Over Random**
Using hash-based word selection instead of Math.random() made state predictable and easier to debug. Same room code always produces same experience.

### 2. **Normalization at Input**
Trimming whitespace and normalizing case at the point of submission prevented subtle bugs in scoring and history comparison logic.

### 3. **Polling Simplicity**
~2 second polling cadence feels responsive for a guessing game without the complexity of WebSockets or pub/sub patterns.

### 4. **Role-Based Visibility Logic**
Keeping visibility rules in the snapshot projection method (`toRoomSnapshot()`) made it easy to audit what each role sees. Centralized location for authorization logic.

### 5. **Immutability Discipline**
Using map operations to create new Room objects instead of mutating helped avoid stale state and made it easier to trace changes.

---

## Future Enhancements (Out of Scope)

1. **Interactive Drawing Canvas**: Currently a placeholder; could integrate p5.js or canvas API for collaborative drawing
2. **Persistent Storage**: Migrate in-memory Map to database for production durability
3. **Authentication**: Add JWT or OAuth for user identity across sessions
4. **Team Scoring**: Implement team-based scoring instead of individual scores
5. **Hint System**: Allow drawer to provide hints during round
6. **Leaderboards**: Track scores across multiple rooms and sessions
7. **Time Limits**: Add countdown timer for each round
8. **Word Difficulty Levels**: Different word sets for different difficulty tiers
9. **Mobile Responsive UI**: Optimize UI for tablet and mobile screens
10. **Real-time Sync**: Replace polling with WebSocket or Server-Sent Events

---

## Deployment & Operations

### Prerequisites
- Node.js 22+ (backend) with npm
- React 18+ (frontend) with Vite

### Running Locally
```bash
# Terminal 1: Backend
cd backend && npm run dev  # http://localhost:3001

# Terminal 2: Frontend
cd frontend && npm run dev  # http://localhost:5173
```

### Production Considerations
- Backend state resets on server restart (data loss)
- No authentication means any user can see any room
- Polling cadence adds latency (not real-time)
- No database backup or recovery mechanism
- In-memory limits scale (no persistent scaling)

---

## Conclusion

The Scribble implementation demonstrates a functional multiplayer game built with modern TypeScript, Express, and React. The four-scenario approach provided a clear progression from basic room management through complex interactive gameplay. Key success factors were:

1. Incremental feature delivery per scenario
2. Deterministic state selection for predictable testing
3. Role-based visibility enforcement at API boundary
4. Simple HTTP polling for state sync
5. Strong TypeScript typing throughout

The architecture prioritizes simplicity and testability over production-scale features, making it ideal for learning and prototyping multiplayer game mechanics.

---

## Artifacts Generated

- **Spec Kit Structure**: 4 feature directories (specs/001-004) each with spec.md, plan.md, tasks.md
- **Constitution**: `.specify/memory/constitution.md` governing tech stack and constraints
- **Backend Implementation**: 9 core files (services, models, routes, schemas)
- **Frontend Implementation**: 6 core components + state management + API contracts
- **Git History**: Commits documenting each scenario implementation
- **Test Coverage**: Unit tests for core business logic in both environments


# Implementation Plan: Game Start & Drawer Flow

**Branch**: `003-game-start-drawer-flow` | **Date**: 2026-06-03 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-game-start-drawer-flow/spec.md`

## Summary

Extend the existing room start flow to assign a drawer (host/first player), deterministically select a secret word from the starter word list, and surface the word exclusively to the drawer in the snapshot response. Update the frontend `GamePage` to display the drawer's word and clearly identify the drawer to all players.

## Technical Context

**Language/Version**: TypeScript 5.x (both backend and frontend)

**Primary Dependencies**: Express (backend), React 18 + Zustand-like external store pattern (frontend), Zod (validation)

**Storage**: In-memory only (Map-based room store). No persistence.

**Testing**: Vitest (existing test files: `schemas.test.ts`, `roomStore.test.ts`, `api.test.ts`)

**Target Platform**: Node.js (backend), Browser (frontend via Vite)

**Project Type**: Web application (monorepo with `backend/` and `frontend/`)

**Performance Goals**: Polling interval ~2s; room start response <200ms

**Constraints**: No WebSockets, no database, no authentication. HTTP polling only. All state in-memory.

**Scale/Scope**: Single room per server process; lab-scale (2-8 players).

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. TypeScript First | PASS | All new/modified code will be fully typed. No `any`. |
| II. In-Memory Only | PASS | Drawer assignment, word selection, and roles stored in room memory. |
| III. HTTP Polling Only | PASS | Frontend already polls at 2s; snapshot updates propagate drawer/word via polling. |
| IV. Validate at Boundaries with Zod | PASS | Existing `startRoomSchema` validates `participantId`. Player name validation already uses `.trim().min(1)` in `createRoomSchema` and `joinRoomSchema`. |
| V. Incremental, Spec-Driven | PASS | Plan follows spec scenarios in priority order. |

**Hard Constraints Check**:
- No authentication/sessions/JWT — PASS (player identity is name-only)
- No new state-management libraries — PASS (uses existing `RoomStore` pattern)
- No unjustified dependencies — PASS (no new dependencies needed)
- No rewriting from scratch — PASS (brownfield additions to existing files)
- No out-of-scope features — PASS (single round, no timer, no drawer rotation, no spectator mode)

**Gate status**: All gates pass. Proceeding to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/002-game-start-drawer-flow/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (not created by /speckit.plan)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── models/
│   │   └── game.ts              # ADD: currentWord, drawerId fields to Room/Snapshot
│   ├── services/
│   │   └── roomStore.ts         # MODIFY: startRoom to assign drawer + select word; update toRoomSnapshot
│   ├── api/
│   │   ├── schemas.ts           # NO CHANGE (validation already covers name trimming)
│   │   └── rooms.ts             # MODIFY: startRoom handler — add empty word list guard
│   └── seed/
│       └── starterData.ts       # NO CHANGE (STARTER_WORDS already exists)
└── tests/
    └── [existing test files updated as needed]

frontend/
├── src/
│   ├── pages/
│   │   └── GamePage.tsx         # MODIFY: display word to drawer, identify drawer visually
│   ├── components/
│   │   └── DrawerWordDisplay.tsx # NEW: component showing secret word (drawer-only)
│   ├── state/
│   │   └── roomStore.ts         # NO CHANGE (snapshot propagates via existing flow)
│   └── services/
│       └── api.ts               # MODIFY: RoomSnapshot type to include drawerId, currentWord
```

**Structure Decision**: Option 2 (Web application with `backend/` + `frontend/`). Changes are targeted additions and edits to existing files. One new frontend component (`DrawerWordDisplay.tsx`) added. No new directories needed.

## Phase 0: Outline & Research

### Unknowns Resolved

| Unknown | Decision | Rationale | Alternatives Considered |
|---------|----------|-----------|------------------------|
| How to deterministically select a word | Use round number as index into `STARTER_WORDS` array with modulo: `STARTER_WORDS[roundNumber % STARTER_WORDS.length]` | Simple, reproducible, no external dependency. Round 1 = index 0 = "rocket". | Hash-based selection (overkill for 5 words), random seed (not deterministic without storing seed) |
| Where to store drawer assignment | Add `drawerId: string | null` field to `Room` model and `RoomSnapshot` | Aligns with existing `hostId` pattern; easily queryable from frontend | Store as role array mapping (complex), derive from participant order (implicit, harder to test) |
| Where to store current word | Add `currentWord: string | null` field to `RoomSnapshot` only (not exposed to guessers) | Word is round-scoped, not room-scoped. Snapshot already has `viewerParticipantId` parameter that can gate visibility. | Store on Room (leaks to all), encrypt word (overkill) |
| How to hide word from guessers in snapshot | `toRoomSnapshot` already accepts `viewerParticipantId`. Use it to conditionally set `currentWord` to `null` for non-drawers | Existing parameter, clean boundary check | Separate "drawer snapshot" vs "guesser snapshot" types (duplicates logic), filter word in frontend (insecure) |
| Minimum player check for start | Already exists in `rooms.ts` line 80: `room.participants.length < 2` returns 409 | No backend change needed | — |
| Player name trimming | Already handled: `createParticipant` in `roomStore.ts` calls `name.trim()` and Zod schemas use `.trim().min(1)` | No backend change needed. Frontend already calls `.trim()` before submission. | — |

### research.md Content

```markdown
# Research: Game Start & Drawer Flow

## Decision: Deterministic Word Selection
- **Decision**: Use round number (1-based) as index into STARTER_WORDS with modulo arithmetic.
- **Rationale**: STARTER_WORDS has 5 words. Round 1 → index 0 ("rocket"), Round 2 → index 1 ("pizza"), etc. Modulo ensures wrap-around. Fully deterministic and testable.
- **Alternatives considered**: 
  - Seeded PRNG: Would require storing seed in room state; overkill for 5 words.
  - Hash of session ID + round: More complex, no benefit for this scope.

## Decision: Drawer Assignment
- **Decision**: Host (first player, i.e., `room.hostId`) is always the drawer for round 1.
- **Rationale**: Simple, unambiguous. `hostId` already exists on Room. No new logic needed to determine "first player".
- **Alternatives considered**:
  - Random drawer: Would need to be deterministic per spec; random contradicts requirement.
  - First-joined player (by joinedAt): Equivalent to host in current implementation since host is always the creator.

## Decision: Word Visibility via Snapshot Gating
- **Decision**: toRoomSnapshot uses viewerParticipantId to conditionally include currentWord.
- **Rationale**: Parameter already exists and is passed from frontend API calls. Clean server-side gate.
- **Alternatives considered**:
  - Frontend-only hiding: Insecure; word would be in network response.
  - Separate endpoints: Adds API surface unnecessarily.

## Decision: No New Zod Schemas Needed
- **Decision**: Existing createRoomSchema and joinRoomSchema already handle name trimming and validation.
- **Rationale**: `.trim().min(1)` on both schemas covers empty and whitespace-only rejection. `createParticipant` also trims server-side.
- **Alternatives considered**: None needed.
```

## Phase 1: Design & Contracts

### data-model.md

```markdown
# Data Model: Game Start & Drawer Flow

## Entity Changes

### Room (backend/src/models/game.ts)

**New field**:
- `drawerId: string | null` — ID of the participant assigned as the drawer for the current round. `null` when room is in "lobby" status.

**Existing fields** (unchanged):
- `code`, `status`, `participants`, `hostId`, `createdAt`, `updatedAt`

### RoomSnapshot (backend/src/models/game.ts)

**New fields**:
- `drawerId: string | null` — mirrors Room.drawerId
- `currentWord: string | null` — the secret word for the current round. Set to `null` if the viewer is not the drawer or if no round is active.

**Existing fields** (unchanged):
- `code`, `status`, `participants`, `hostId`, `availableWords`, `roles`

### Participant (backend/src/models/game.ts)

No changes. Existing `id`, `name`, `joinedAt` fields are sufficient.

## State Transitions

### Room Status: "lobby" → "active"
1. Host calls POST /rooms/:code/start
2. Backend sets `room.status = "active"`
3. Backend sets `room.drawerId = room.hostId` (host is drawer for round 1)
4. Backend selects `currentWord = STARTER_WORDS[0]` (round 1, index 0)
5. `toRoomSnapshot` returns `currentWord` only if `viewerParticipantId === room.drawerId`

## Validation Rules

- **Player name**: trimmed, non-empty (already enforced by Zod schemas + `createParticipant`)
- **Minimum players**: ≥ 2 to start (already enforced in `rooms.ts` handler)
- **Host-only start**: only `room.hostId` can call start (already enforced)
- **Word list non-empty**: if `STARTER_WORDS` is empty, start should fail with 500 error

## Key Derivations

- **drawerName**: derived by finding participant where `participant.id === snapshot.drawerId`
- **isViewerDrawer**: derived by checking `snapshot.drawerId === viewerParticipantId`
- **wordIndex**: `(roundNumber - 1) % STARTER_WORDS.length` (round 1 = index 0)
```

### contracts/

```markdown
# API Contracts: Game Start & Drawer Flow

## POST /rooms/:code/start (modified)

**Request**:
- Params: `code` (string, 4-char room code)
- Body: `{ participantId: string (UUID) }`

**Response 200**:
```json
{
  "room": {
    "code": "ABCD",
    "status": "active",
    "participants": [
      { "id": "uuid-1", "name": "Alice", "joinedAt": "..." },
      { "id": "uuid-2", "name": "Bob", "joinedAt": "..." }
    ],
    "hostId": "uuid-1",
    "drawerId": "uuid-1",
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"],
    "currentWord": "rocket"  // ONLY present if participantId === drawerId
  }
}
```

**Response 200 (guesser view)**:
```json
{
  "room": {
    "code": "ABCD",
    "status": "active",
    "participants": [...],
    "hostId": "uuid-1",
    "drawerId": "uuid-1",
    "availableWords": [...],
    "roles": ["drawer", "guesser"],
    "currentWord": null  // null for non-drawer viewers
  }
}
```

**Response 404**: Room not found
**Response 403**: Only the host can start
**Response 409**: At least 2 players required
**Response 500**: No words available (word list empty)

## GET /rooms/:code (modified)

**Query params**: `participantId` (optional, string)

**Response**: Same as start response. `currentWord` is gated by `viewerParticipantId === drawerId`.

## Frontend Contract: RoomSnapshot type

The `RoomSnapshot` interface in both backend (`models/game.ts`) and frontend (`services/api.ts`) gains:
- `drawerId: string | null`
- `currentWord: string | null`
```

### quickstart.md

```markdown
# Quickstart: Testing Game Start & Drawer Flow

## Prerequisites
- Node.js installed (version from `.nvmrc`)
- Backend and frontend dependencies installed

## Steps

1. **Start backend**:
   ```bash
   cd backend && npm run dev
   ```

2. **Start frontend** (new terminal):
   ```bash
   cd frontend && npm run dev
   ```

3. **Create a room** (Player 1 / Host):
   - Open `http://localhost:5173`
   - Enter a player name (e.g., "Alice") and click "Create Room"
   - You are redirected to the lobby

4. **Join the room** (Player 2):
   - Open `http://localhost:5173` in an incognito window
   - Click "Join Room"
   - Enter a player name (e.g., "Bob") and the room code shown in the lobby
   - You are redirected to the same lobby

5. **Start the game** (as host):
   - In the host's window, click "Start Game"
   - Both players are redirected to `/game`
   - **Drawer (Alice)**: Should see "rocket" displayed prominently as the secret word
   - **Guesser (Bob)**: Should NOT see the word; should see "Guess the word!" prompt

6. **Verify name validation**:
   - Try joining with an empty name → error message displayed
   - Try joining with whitespace-only name (e.g., "   ") → error message displayed
   - Try joining with "  Charlie  " → name trimmed to "Charlie"

7. **Verify drawer identification**:
   - All players should see who the drawer is (e.g., "Alice is drawing" header)
```

## Phase 2: Implementation Tasks

See `tasks.md` (generated by `/speckit.tasks`).

## Complexity Tracking

No constitution violations. No complexity tracking needed.

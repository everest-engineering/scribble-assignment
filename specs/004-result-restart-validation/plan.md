# Implementation Plan: Result, Restart & Final Validation

**Branch**: `005-result-restart-validation` | **Date**: 2026-06-03 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-result-restart-validation/spec.md`

## Summary

Add a "results" room status, a results page showing the revealed word/final scores/guess history to all players, and a host-only restart flow that returns all players to the lobby with round state cleared but players preserved.

## Technical Context

**Language/Version**: TypeScript 5.x (both backend and frontend)

**Primary Dependencies**: Express (backend), React 18 (frontend), Zod (validation)

**Storage**: In-memory only. No persistence.

**Testing**: Vitest (backend + frontend)

**Target Platform**: Node.js (backend), Browser (frontend via Vite)

**Project Type**: Web application (monorepo with `backend/` and `frontend/`)

**Performance Goals**: Polling interval ~2s; restart response <200ms

**Constraints**: No WebSockets, no database, no authentication. HTTP polling only. All state in-memory.

**Scale/Scope**: Single room per server process; lab-scale (2-8 players). One round at a time.

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. TypeScript First | PASS | All new/modified code fully typed. No `any`. `RoomStatus` gains "results". |
| II. In-Memory Only | PASS | Restart clears in-memory round state; no persistence involved. |
| III. HTTP Polling Only | PASS | Results and restart states propagate via existing 2s polling. |
| IV. Validate at Boundaries with Zod | PASS | New `endRoundSchema` and `restartSchema` will validate participantId. |
| V. Incremental, Spec-Driven | PASS | Plan follows spec scenarios in priority order. |

**Hard Constraints Check**:
- No authentication/sessions/JWT — PASS
- No new state-management libraries — PASS (uses existing `RoomStore` pattern)
- No unjustified dependencies — PASS (no new npm packages)
- No rewriting from scratch — PASS (brownfield additions)
- No out-of-scope features — PASS (no timers, no multi-round scoring, no spectator mode)

**Gate status**: All gates pass.

## Project Structure

### Documentation (this feature)

```text
specs/004-result-restart-validation/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── models/
│   │   └── game.ts              # MODIFY: RoomStatus gains "results"
│   ├── services/
│   │   └── roomStore.ts         # ADD: endRound(), restartRoom() functions
│   ├── api/
│   │   ├── schemas.ts           # ADD: endRoundSchema, restartSchema
│   │   └── rooms.ts             # ADD: POST /rooms/:code/end, POST /rooms/:code/restart
└── tests/
    └── [existing test files updated]

frontend/
├── src/
│   ├── pages/
│   │   ├── GamePage.tsx         # MODIFY: add "End Round" button for host
│   │   ├── ResultsPage.tsx      # NEW: displays word, scores, guess history, restart
│   │   └── LobbyPage.tsx        # MODIFY: redirect from "results" status to ResultsPage
│   ├── components/
│   │   └── ResultPanel.tsx      # MODIFY: display round results
│   ├── routes/
│   │   └── index.tsx            # MODIFY: add /results route
│   └── services/
│       └── api.ts               # ADD: endRound, restartRoom methods
```

**Structure Decision**: Option 2 (Web application). One new page (ResultsPage), two new endpoints, one new room status. All targeted additions.

## Phase 0: Research

### Decisions

| Unknown | Decision | Rationale |
|---------|----------|-----------|
| How to represent "round ended" state | Add `"results"` to `RoomStatus` union type | Simple enum extension; existing polling detects status change |
| How does host trigger round end | "End Round" button in GamePage for host only | Explicit host action; aligns with constitution (no timers) |
| How does restart clear state | `restartRoom()` resets strokes, guesses, scores, word, drawerId; keeps participants | FR-006, FR-007: preserve players, clear round state |
| Where do players go after restart | LobbyPage (room.status = "lobby" triggers existing redirect) | LobbyPage already handles `status === "active"` → `/game`; add `status === "results"` → `/results` |
| Who can see the word in results | All players (reveal for everyone) | FR-001: "correct secret word is prominently displayed" to all |
| Who can restart | Only the host | FR-004: "allow only the host to restart" |

## Phase 1: Design & Contracts

### data-model.md

```markdown
# Data Model: Result, Restart & Final Validation

## Type Changes

### RoomStatus (backend/src/models/game.ts)

**Before**: `"lobby" | "active"`
**After**: `"lobby" | "active" | "results"`

### RoomSnapshot

**No changes** — existing `currentWord` field already gates word visibility. In "results" mode, set `currentWord` to the actual word for ALL viewers (remove drawer gating).

## New Functions

### endRoom(code: string) → RoomSnapshot | null
1. Sets `room.status = "results"`
2. Sets `room.currentWord` to the actual word (revealed for all)
3. Returns updated snapshot

### restartRoom(code: string) → RoomSnapshot | null
1. Sets `room.status = "lobby"`
2. Sets `room.drawerId = null`
3. Sets `room.currentWord = null`
4. Sets `room.strokes = []`
5. Sets `room.guesses = []`
6. Sets `room.playerScores = new Map()` (all participants reset to 0)
7. Sets `room.hasScored = []`
8. Preserves all participants
9. Returns updated snapshot

## State Flow

```
lobby → active (startRoom) → results (endRoom) → lobby (restartRoom)
```
```

### contracts/

```markdown
# API Contracts: Result, Restart & Final Validation

## POST /rooms/:code/end

**Authorization**: Only the host
**Request Body**: `{ "participantId": "uuid" }`
**Response 200**: `{ "room": RoomSnapshot }` — status = "results", currentWord revealed
**Response 403**: "Only the host can end the round"
**Response 404**: Room not found
**Response 409**: "Game is not active" (if room.status !== "active")

## POST /rooms/:code/restart

**Authorization**: Only the host
**Request Body**: `{ "participantId": "uuid" }`
**Response 200**: `{ "room": RoomSnapshot }` — status = "lobby", round state cleared
**Response 403**: "Only the host can restart"
**Response 404**: Room not found
```

### quickstart.md

```markdown
# Quickstart: Testing Result, Restart & Final Validation

## Prerequisites
- Backend and frontend running
- Game in progress (at least 2 players, round active)

## Steps

1. **Test end round**:
   - As the host, click "End Round" button on GamePage
   - Verify all players see the Results page within ~2s
   - Verify the correct word is revealed to all players
   - Verify final scores are displayed (sorted highest first)
   - Verify complete guess history is visible

2. **Test non-host sees waiting state**:
   - As a guesser on Results page, verify you see "Waiting for host to restart"
   - Verify no restart button is shown to non-hosts

3. **Test host restart**:
   - As the host, click "Restart Game" on Results page
   - Verify all players are navigated to the lobby within ~2s
   - Verify all player names are preserved in the lobby
   - Verify the lobby shows "Ready to play" status

4. **Test full game loop**:
   - Create room → join second player → start → play → end round → restart → start again
   - Verify the loop works without creating a new room
```

## Complexity Tracking

No constitution violations. No complexity tracking needed.

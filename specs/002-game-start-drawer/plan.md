# Implementation Plan: Game Start & Drawer Flow

**Branch**: `scribble-lab` (spec dir `002-game-start-drawer`) | **Date**: 2026-06-05 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/002-game-start-drawer/spec.md`

## Summary

Add name validation (client + Zod), extend the room status to `playing`, add a
host-only `POST /rooms/:code/start` endpoint that assigns the drawer (= host) and
locks in a deterministically chosen word, and make the snapshot reveal the `word`
only to the drawer. The lobby auto-navigates everyone to the game once `playing`.

## Technical Context

**Language/Version**: TypeScript (Node 18+ / React 18).
**Primary Dependencies**: Express + Zod; React + React Router v6. No new deps.
**Storage**: In-memory `Map` + a process-local creation counter.
**Testing**: Vitest (roomStore, schemas) + manual two-tab.
**Project Type**: Web app (`backend/` + `frontend/`).
**Constraints**: Polling only; in-memory; deterministic word (no random).

## Constitution Check

*GATE: must pass before and after design.*

- **I. Brownfield-First** — PASS. Extends `game.ts`, `roomStore.ts`, `schemas.ts`,
  `rooms.ts`, `api.ts`, `state/roomStore.ts`, `LobbyPage.tsx`, `GamePage.tsx`. One
  new endpoint, no new files except none required. No rewrites.
- **II. Spec-Driven** — PASS. specify → clarify → plan completed; tasks trace to
  FRs.
- **III. Deterministic Game Rules** — PASS. Word index = `(creationCount-1) %
  STARTER_WORDS.length`, fixed at creation; no `Math.random()`.
- **IV. Polling-Only** — PASS. Lobby→game transition is detected by the existing
  2s poll; no push.
- **V. Incremental Validation** — PASS. Builds + tests + two-tab before Scenario 3.
- **VI. AI Review Discipline** — PASS. Granular commits, reviewed, no co-author.

No violations → Complexity Tracking empty.

## State Model

### Backend (`backend/src/models/game.ts`)

```
RoomStatus = "lobby" | "playing"            // extended

Room {
  code, status, hostId, participants, createdAt, updatedAt   // existing
  wordIndex: number      // NEW — fixed at creation (deterministic)
  drawerId?: string      // NEW — set on start (= hostId)
}

RoomSnapshot {
  code, status, hostId, participants, availableWords, roles  // existing
  drawerId?: string      // NEW
  word?: string          // NEW — present ONLY for the drawer while playing
}
```

### Store (`backend/src/services/roomStore.ts`)

- Module-level `roomCreationCount` increments on each `createRoom`; the room's
  `wordIndex = (roomCreationCount - 1) % STARTER_WORDS.length`.
- New `startGame(code, requesterId)` → validates host + ≥2 players, sets
  `status="playing"`, `drawerId=hostId`; returns the room or a typed error.
- `toRoomSnapshot(room, viewerId)` now uses `viewerId`: include `word =
  STARTER_WORDS[room.wordIndex]` only when `status==="playing"` and
  `viewerId === room.drawerId`.

### Frontend

- `api.ts`: extend `RoomSnapshot` (`status: "lobby" | "playing"`, `drawerId?`,
  `word?`); add `api.startGame(code, participantId)`.
- `state/roomStore.ts`: add `startGame()` that calls the API and stores the
  snapshot.
- `LobbyPage.tsx`: on poll, if `status === "playing"`, `navigate("/game")`. Host's
  Start button calls `startGame()` instead of navigating directly.
- `GamePage.tsx`: derive `isDrawer = room.drawerId === participantId`; show the
  word to the drawer and a role label to everyone; also poll for sync.

## Data Flow

1. **Create/Join**: name trimmed client-side (block empty) → backend trims +
   Zod-rejects empty. Word index fixed at create.
2. **Start**: host clicks Start (≥2 players) → `POST /rooms/:code/start` with
   `participantId` → backend verifies host + count → sets `playing` + `drawerId`
   → snapshot. Host's client navigates to `/game`.
3. **Propagation**: other clients' lobby poll sees `playing` → navigate to
   `/game`. Each game client polls; drawer's snapshot carries `word`, guessers'
   does not.

## File-Level Plan

| File | Change |
|------|--------|
| `backend/src/models/game.ts` | Extend `RoomStatus`; add `wordIndex`, `drawerId` to `Room`; add `drawerId?`, `word?` to `RoomSnapshot`. |
| `backend/src/services/roomStore.ts` | Creation counter + `wordIndex`; `startGame()`; word-in-snapshot for drawer only. |
| `backend/src/api/schemas.ts` | Trim + non-empty `playerName`; add a start params/body schema if needed. |
| `backend/src/api/rooms.ts` | Add `POST /:code/start` (host-only, ≥2 players). |
| `backend/src/services/roomStore.test.ts` | Tests: deterministic word order; drawer-only word; start guards. |
| `frontend/src/services/api.ts` | Extend snapshot type; add `startGame`. |
| `frontend/src/state/roomStore.ts` | Add `startGame()`. |
| `frontend/src/pages/CreateRoomPage.tsx` | Name trim + "Name is required". |
| `frontend/src/pages/JoinRoomPage.tsx` | Name trim + "Name is required" (alongside code checks). |
| `frontend/src/pages/LobbyPage.tsx` | Host Start → `startGame()`; auto-nav to `/game` on `playing`. |
| `frontend/src/pages/GamePage.tsx` | Drawer detection; show word to drawer; role labels; poll. |

## Testing Strategy

- **Unit (vitest)**: word order deterministic across several `createRoom`s;
  `toRoomSnapshot` returns `word` for drawer and `undefined` for guesser;
  `startGame` rejects non-host and <2 players; Zod rejects empty names.
- **Manual two-tab**: blank-name rejection; host start with 2 players moves both
  to game within ~2s; drawer sees word, guesser does not.
- **Builds**: backend + frontend, zero errors.

## Risks

- **Word leak**: must omit `word` (not empty string) for guessers — covered by a
  unit test on the snapshot.
- **Counter determinism vs. tests**: the module-level counter is shared across
  tests; tests assert relative order (created back-to-back) rather than absolute
  index to stay robust.
- **Double-start**: guard against re-picking word/drawer if already `playing`.

## Project Structure

```text
specs/002-game-start-drawer/
├── spec.md
├── plan.md
├── checklist.md
├── tasks.md
└── analysis.md
```

**Structure Decision**: Reuse existing layout; one new endpoint, no new dirs.

## Complexity Tracking

No constitution violations — none.

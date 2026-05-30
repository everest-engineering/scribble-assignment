# Implementation Plan: Game Start & Drawer Flow

**Branch**: `002-game-start-drawer-flow` | **Date**: 2026-05-30 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-game-start-drawer-flow/spec.md`

## Summary

Extend the Scenario 1 room flow so player names are trimmed and validated, game start assigns
the host as drawer with a deterministic secret word (`rocket`), and viewer-aware room snapshots
expose the word only to the drawer. Add game-screen polling (~2s) for role sync, and enrich the
game UI with drawer/guesser labels and conditional secret-word display. Work is brownfield:
extend `Room` round fields, `startRoom()` initialization, `toRoomSnapshot()` filtering, Zod
name schemas, and frontend create/join/game pages.

## Technical Context

**Language/Version**: TypeScript (Node.js 18+, ES modules) on backend and frontend

**Primary Dependencies**: Express, Zod, React 18, React Router v6, Vite, Vitest

**Storage**: In-memory `Map` in `backend/src/services/roomStore.ts` (no persistence)

**Testing**: Vitest for name normalization, start round init, viewer snapshot filtering;
manual two-browser validation per [quickstart.md](./quickstart.md); `npm run build` in both apps

**Target Platform**: Local dev — backend `http://localhost:3001`, frontend `http://localhost:5173`

**Project Type**: Web application (monorepo: `backend/` + `frontend/`)

**Performance Goals**: Game snapshot refresh within ~2s; API responses suitable for lab use

**Constraints**: HTTP polling only; no WebSockets, databases, or auth; minimal diffs; canvas
drawing and guess submission deferred to Scenario 3

**Scale/Scope**: Single round per session; four user stories (P1–P4); no new REST endpoints
(extend existing create/join/get/start)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Verify compliance with `.specify/memory/constitution.md` (Scribble v1.0.0):

- [x] **Brownfield First**: Plan extends starter and Scenario 1 files; no rewrite or unrelated refactors
- [x] **TypeScript + Zod**: Name schema tightening and snapshot types in `game.ts`, `schemas.ts`, `api.ts`
- [x] **HTTP Polling Only**: Game sync via `setInterval` + `GET /rooms/:code`; no push protocols
- [x] **Spec Kit Traceability**: Plan maps FR-001–FR-016 to files, data model, and contracts below
- [x] **Deterministic Game Rules**: Host drawer, first starter word, drawer-only visibility covered
- [x] **Out-of-Scope Clean**: No canvas drawing, guessing, scoring, multi-round rotation, or new libraries
- [x] **Validation Plan**: Two-browser steps in [quickstart.md](./quickstart.md); builds required

## Discovery Findings (Starter Gaps)

| Gap | Relevant files | Spec refs |
|-----|----------------|-----------|
| Names default to `"Player"`; no trim/reject | `roomStore.ts` `displayName()`, create/join pages | FR-001–FR-004 |
| No client empty-name validation on create | `CreateRoomPage.tsx` | FR-002 |
| No client empty-name validation on join name | `JoinRoomPage.tsx` | FR-003 |
| `startRoom` only flips status | `roomStore.ts` | FR-009–FR-013 |
| `toRoomSnapshot` ignores viewer; no roles/word | `roomStore.ts`, `game.ts` | FR-011, FR-014–FR-015 |
| No game-screen polling | `GamePage.tsx` | FR-007–FR-008 |
| Game UI lacks drawer badge and secret word | `GamePage.tsx` | FR-011, FR-014 |
| Snapshot types missing round fields | `game.ts`, `api.ts` | Data model |
| Zod allows optional empty names | `schemas.ts` | FR-001–FR-003 |

**Assumptions documented in spec**: host = drawer; word = first starter list entry; single round.

## Project Structure

### Documentation (this feature)

```text
specs/002-game-start-drawer-flow/
├── plan.md              # This file
├── research.md          # Phase 0 decisions
├── data-model.md        # Phase 1 entity design
├── quickstart.md        # Manual validation steps
├── contracts/
│   └── rooms-api.md     # REST contract deltas
└── tasks.md             # Phase 2 (/speckit-tasks — not yet created)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── api/
│   │   ├── rooms.ts          # Pass viewerParticipantId to toRoomSnapshot (already wired)
│   │   └── schemas.ts        # Required trimmed playerName on create/join
│   ├── models/
│   │   └── game.ts           # drawerParticipantId, secretWord, role on snapshots
│   └── services/
│       └── roomStore.ts      # normalizePlayerName, round init, viewer snapshot
└── src/services/roomStore.test.ts

frontend/
├── src/
│   ├── pages/
│   │   ├── CreateRoomPage.tsx  # Client trim + empty-name rejection
│   │   ├── JoinRoomPage.tsx    # Client trim + empty-name rejection on name
│   │   └── GamePage.tsx        # Polling, drawer badge, secret word for drawer only
│   ├── services/
│   │   └── api.ts              # Extended RoomSnapshot / Participant types
│   └── state/
│       └── roomStore.ts        # (unchanged API surface; consumes new snapshot fields)
```

**Structure Decision**: Web application layout. All changes stay within existing paths from
Scenario 1; no new endpoints or libraries.

## Data Flow

```text
Create / Join (with name validation)
  CreateRoomPage / JoinRoomPage (trim + reject empty)
  → roomStore.createRoom / joinRoom
  → POST /rooms or /rooms/:code/join
  → backend normalizePlayerName → reject 400 if empty
  → lobby with trimmed name

Start Game (Scenario 1 + round init)
  LobbyPage → roomStore.startGame → POST /rooms/:code/start
  → startRoom sets status, drawerParticipantId, secretWord
  → viewer-aware snapshot (host sees secretWord)
  → navigate /game

Game Polling (every ~2000ms while on /game)
  GamePage useEffect → roomStore.fetchRoomSilent
  → GET /rooms/:code?participantId=
  → snapshot with roles; secretWord only for drawer viewer
  → update drawer badge / word panel

Game Guard
  GamePage → if status === "lobby" → redirect /lobby
```

## Implementation Sequence

1. **Backend name normalization** — Add `normalizePlayerName()`; use in `createRoom`/`joinRoom`;
   return error path for empty names (throw or result type consumed by routes).
2. **Backend round fields** — Extend `Room` with `drawerParticipantId`, `secretWord`; init in
   `startRoom()` (drawer = host, word = `STARTER_WORDS[0]`).
3. **Viewer-aware snapshots** — Extend `toRoomSnapshot(room, viewerParticipantId)` with
   `drawerParticipantId`, participant `role`, conditional `secretWord`.
4. **Zod schemas** — Require non-empty trimmed `playerName` on create/join.
5. **Backend tests** — Name trim/reject, start assigns drawer+word, snapshot omits word for guesser.
6. **Frontend types** — Mirror snapshot shape in `api.ts`.
7. **Create/Join validation** — Client trim + reject empty name before API call.
8. **Game page polling** — 2s interval, cleanup on unmount, non-blocking poll errors.
9. **Game UI** — Drawer/guesser labels, secret word panel for drawer, guess prompt without word.
10. **Manual validation** — Follow [quickstart.md](./quickstart.md) with two browser tabs.

## Testing Strategy

| Layer | Approach |
|-------|----------|
| Unit | Vitest: `normalizePlayerName`, `startRoom` round fields, `toRoomSnapshot` viewer filtering |
| Integration | Manual two-browser flows per quickstart |
| Build | `npm run build` in `backend/` and `frontend/` |
| Regression | Scenario 1 lobby/start tests continue to pass |

## Risks

| Risk | Mitigation |
|------|------------|
| `secretWord` leaked in shared frontend state | API omits field for guessers; UI reads optional field only |
| Host sees word but guest UI stale | Game page polling at ~2s |
| Breaking create/join without name | Align client validation + clear 400 message |
| `"Player"` default removed breaks tests | Update tests to always pass valid names |

## Complexity Tracking

> No constitution violations requiring justification.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |

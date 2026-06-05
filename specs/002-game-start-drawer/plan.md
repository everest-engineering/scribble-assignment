# Implementation Plan: Game Start & Drawer Flow

**Branch**: `002-game-start-drawer` | **Date**: 2026-06-05 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-game-start-drawer/spec.md`

## Summary

Scenario 2 turns the lobby's gated Start control into a real round. On the backend we add a
**`playing`** room status, a **start action** (`POST /rooms/:code/start`) that — for the host,
with ≥2 players — assigns the **drawer** (the host/first player), selects a **deterministic
secret word** from the starter list, and flips the room to `playing`. `toRoomSnapshot` is
extended with `drawerId`, `isDrawer`, and a **drawer-only `secretWord`** (omitted for
guessers). On the frontend, the already-built ~2s polling carries **every** player from the
lobby into the game once `status === "playing"`, so guessers transition automatically. The game
view shows the drawer identity, each viewer's role, and the secret word only to the drawer. We
also add **player-name validation** (trim, reject empty/whitespace) at create and join. No new
dependencies; all changes extend existing files.

## Technical Context

**Language/Version**: TypeScript (ES Modules). Node.js 18+ backend, React 18 frontend.

**Primary Dependencies**: Backend — Express, Zod, `tsx`, `node:crypto`. Frontend — React 18,
React Router 6, Vite. No new runtime dependencies.

**Storage**: In-memory only (`Map<string, Room>` in `services/roomStore.ts`).

**Testing**: Vitest. Extend `roomStore.test.ts` (start, drawer, deterministic word, drawer-only
visibility), `schemas.test.ts` (name validation). Manual two-tab validation per quickstart.

**Target Platform**: Local dev — backend `:3001`, frontend `:5173`.

**Project Type**: Web application (Express backend + React frontend monorepo).

**Performance Goals**: All players reach the game view within ~2s of start, via existing polling.

**Constraints**: No WebSockets/DB/auth (constitution II). Deterministic word & drawer
(constitution III). In-memory state. Guesser data must never contain the secret word.

**Scale/Scope**: Small rooms, single round. ~4 backend files and ~4 frontend files touched.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status |
|-----------|------|--------|
| I. TypeScript-First & Type Safety | Fully typed; no `any`; Zod at boundaries; centralized errors; UI tolerant | PASS — new `status`/`drawerId`/`secretWord` typed; start uses Zod body; guesser snapshot omits word |
| II. Architectural Constraints | No WebSockets/DB/auth; polling; in-memory | PASS — transition rides existing poll; state in `Map`; new REST endpoint only |
| III. Deterministic Game Rules | Predictable drawer & word | PASS — drawer = host; word = deterministic function of room code, fixed at start |
| IV. Spec-Driven Workflow | Traces to spec | PASS — see Requirements Traceability |
| V. Disciplined AI Usage & Self-Review | Granular commits, consistent structure | PASS — confined to api/services/models + pages/state |
| VI. Testing & Validation Discipline | Unit tests for deterministic logic; two-tab; builds | PASS — see Testing Strategy |

**Out-of-scope guard**: No drawing/clear/guess/score (Scenario 3), no result/restart (Scenario
4), no rounds/rotation/timers. Confirmed against README "Explicitly Out Of Scope".

**Result**: PASS. No violations; Complexity Tracking not required.

## Findings (Discovery)

Building on Scenario 1:

1. **Status is single-valued** — `RoomStatus = "lobby"` only (`models/game.ts`); there is no
   `playing` state for clients to detect.
2. **No start action** — the lobby Start button calls `navigate("/game")` locally; nothing on
   the backend changes room state, so other players never learn the round began.
3. **No round state** — `Room` has no drawer or secret word; `toRoomSnapshot` exposes neither.
4. **GamePage is static** — `pages/GamePage.tsx` shows placeholders ("Round 1", "Waiting for
   drawer...") and a hard-coded "Playing" status; it does not poll or read role/word.
5. **Names unvalidated** — `createRoomSchema`/`joinRoomSchema` use `playerName: z.string()
   .optional()`; the store defaults blank names to "Player". Empty/whitespace is not rejected.

Relevant files: `backend/src/models/game.ts`, `backend/src/services/roomStore.ts`,
`backend/src/api/rooms.ts`, `backend/src/api/schemas.ts`, `frontend/src/services/api.ts`,
`frontend/src/state/roomStore.ts`, `frontend/src/pages/LobbyPage.tsx`,
`frontend/src/pages/GamePage.tsx`, `frontend/src/pages/CreateRoomPage.tsx`,
`frontend/src/pages/JoinRoomPage.tsx`.

## State Model Changes

**Backend `RoomStatus`**: `"lobby" | "playing"`.

**Backend `Room`** (add): `drawerId: string | null` (null in lobby), `secretWord: string | null`
(null in lobby). Set at start; cleared state belongs to Scenario 4 restart.

**Backend `RoomSnapshot`** (add): `drawerId: string | null`, `isDrawer: boolean`
(`viewerParticipantId === drawerId`), `secretWord: string | null` (the word **only** when the
viewer is the drawer, otherwise `null`). Existing `status` now carries `"playing"`.

**Frontend `RoomSnapshot`** (`services/api.ts`): mirror `status` union + `drawerId`/`isDrawer`/
`secretWord`. Add `api.startRoom(code, participantId)`.

**Frontend store**: add `startRoom(participantId)` calling the new endpoint and storing the
returned snapshot. Polling already exists; views react to `status`.

## Data Flow

1. **Name entry** → create/join bodies validated (`playerName` trimmed, non-empty) → store
   trims and keeps the value → snapshot shows trimmed names.
2. **Start** → host clicks Start (enabled only when `canStart`) → `POST /rooms/:code/start`
   `{ participantId }` → backend verifies requester is host and ≥2 players → assigns
   `drawerId = hostId`, selects `secretWord` deterministically, sets `status = "playing"` →
   returns snapshot.
3. **Transition (all players)** → next ~2s poll returns `status === "playing"` → LobbyPage
   navigates everyone to `/game`; GamePage continues polling.
4. **Game view** → drawer sees `secretWord` and a "you are the drawer" indicator; guessers see
   the drawer's name and a guesser indicator, with `secretWord === null` in their data.

## Requirements Traceability

| Spec | Plan element |
|------|--------------|
| FR-001 | start endpoint re-checks host + ≥2 (reuses `canStart` logic) |
| FR-002, FR-004 | `status = "playing"` set on start; exposed in snapshot |
| FR-003 | LobbyPage poll detects `playing` → auto-navigate; GamePage polls |
| FR-005, FR-006 | `drawerId = hostId`; everyone else guesser; `isDrawer` derived |
| FR-007, FR-008 | snapshot `drawerId` + `isDrawer`; GamePage shows drawer name & self-role |
| FR-009, FR-010 | deterministic `selectWord(code)`; stored on room, fixed for round |
| FR-011 | `toRoomSnapshot` returns `secretWord` only when `isDrawer`, else `null` |
| FR-012, FR-013, FR-014 | `playerName` Zod `.trim().min(1)`; client guards; trimmed display |
| FR-015 | round state in `Map` only |

## Project Structure

### Documentation (this feature)

```text
specs/002-game-start-drawer/
├── plan.md            # This file
├── spec.md            # Feature spec
├── research.md        # Phase 0 output
├── data-model.md      # Phase 1 output
├── quickstart.md      # Phase 1 output
├── contracts/
│   └── rooms-api.md   # start endpoint + extended snapshot
└── checklists/
    └── requirements.md
```

### Source Code (repository root)

```text
backend/
└── src/
    ├── models/game.ts          # RoomStatus union; Room.drawerId/secretWord; snapshot fields
    ├── services/roomStore.ts   # startRound(); deterministic selectWord(); drawer-only snapshot
    ├── api/schemas.ts          # playerName trim+min(1); startRoomSchema (participantId)
    └── api/rooms.ts            # POST /rooms/:code/start (host + 2-player checks)

frontend/
└── src/
    ├── services/api.ts         # status union + new snapshot fields; api.startRoom
    ├── state/roomStore.ts      # startRoom(participantId)
    └── pages/
        ├── LobbyPage.tsx       # Start calls startRoom; poll-driven navigate to /game
        ├── GamePage.tsx        # poll; drawer identity; self-role; drawer-only word
        ├── CreateRoomPage.tsx  # reject empty/whitespace name with message
        └── JoinRoomPage.tsx    # reject empty/whitespace name with message
```

**Structure Decision**: Web-application layout (Option 2). Extends existing directories per
`AGENTS.md`; no new libraries or directories.

## Testing Strategy

- **Backend unit** (`roomStore.test.ts`): start sets `status:"playing"`, `drawerId === hostId`;
  `selectWord` is deterministic (same code → same word) and returns a starter word; drawer
  snapshot includes `secretWord`, guesser snapshot has `secretWord === null` and `isDrawer:false`;
  start refuses <2 players and a non-host requester.
- **Backend unit** (`schemas.test.ts`): `createRoomSchema`/`joinRoomSchema` reject empty &
  whitespace names, trim valid ones; `startRoomSchema` requires `participantId`.
- **Manual two-tab**: host + guesser; host starts → guesser auto-enters game within ~2s; drawer
  sees word, guesser does not; names trimmed; empty name rejected at create/join.
- **Builds**: backend and frontend `npm run build` both pass.

## Risks & Mitigations

- **Secret-word leakage**: the word must be stripped server-side for guessers, not just hidden in
  the UI. Mitigation: `toRoomSnapshot` sets `secretWord` to `null` unless `isDrawer`; a unit test
  asserts the guesser snapshot contains no word.
- **Host authorization without auth**: start trusts the `participantId` in the body as the
  requester. Mitigation: verify it equals `hostId`; this matches the project's no-auth constraint
  and is acceptable for the lab (documented).
- **Polling continuity across navigation**: polling starts in LobbyPage and must continue in the
  game. Mitigation: GamePage also starts/stops polling on mount/unmount (same store API).
- **Word re-roll on refresh**: selecting the word per request would change it. Mitigation: select
  once at start and store `secretWord` on the room; snapshots read the stored value.
- **Backward-compat of snapshot**: new fields are additive; lobby snapshots get `drawerId:null`,
  `secretWord:null`, `isDrawer:false`.

## Complexity Tracking

No constitutional violations. Section intentionally empty.

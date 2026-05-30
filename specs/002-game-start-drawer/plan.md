# Implementation Plan: Scenario 2 Game Start & Drawer Flow

**Branch**: `assignment` | **Date**: 2026-05-29 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-game-start-drawer/spec.md`

**Note**: This plan is limited to Scenario 2 game start and drawer flow behavior.

## Summary

Extend the existing Scenario 1 room start flow so starting a game also creates a
deterministic round state with a drawer and secret word, trims accepted player
names, rejects whitespace-only names before room entry, and exposes viewer-
specific game snapshots so only the drawer sees the actual word. The backend
remains authoritative for name validation, round initialization, drawer
assignment, and word selection, while the frontend lobby and game views react to
the richer room snapshot and render different game-state details for drawer and
non-drawer players.

## Technical Context

**Language/Version**: TypeScript 5.x on Node.js 18+ (backend) and React 18
with Vite (frontend)

**Primary Dependencies**: Express, Zod, React, React Router, Vite, Vitest

**Storage**: In-memory room and game state only

**Testing**: `cd backend && npm test`, `cd frontend && npm test`, plus manual
two-tab browser validation for multiplayer flows

**Target Platform**: Node.js backend and modern desktop browser clients

**Project Type**: Monorepo web application (`backend/` + `frontend/`)

**Performance Goals**: Viewer-specific game state should appear to both tabs
within one polling interval after the room leaves the lobby, with a default
target of about 2 seconds for state convergence

**Constraints**: HTTP polling only; no WebSockets; no database/persistence; no
authentication/session layer; keep room memory footprint minimal; preserve the
starter architecture; keep scope strictly to Scenario 2

**Scale/Scope**: Small multiplayer rooms running a single deterministic round
validated in local multi-tab testing

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] The change is scoped to a concrete scenario/user story and preserves the
      README checkpoint order unless a deviation is justified.
- [x] All changed backend boundaries have explicit TypeScript types and Zod
      validation for request/response payloads.
- [x] Multiplayer synchronization remains HTTP polling against in-memory state
      only; no forbidden persistence or realtime transport is introduced.
- [x] The plan preserves the existing monorepo structure and documents any new
      dependency or abstraction that materially expands the surface area.
- [x] Verification covers every touched surface, including affected builds,
      affected tests, and manual two-tab validation for multiplayer/UI flows.

**Post-Design Re-Check**: Pass. The design keeps Scenario 1 room/lobby behavior
intact, adds deterministic round state inside the existing room model, continues
using in-memory polling-driven sync only, and limits the new gameplay surface to
drawer assignment, name validation, and viewer-specific secret word visibility.

## Project Structure

### Documentation (this feature)

```text
specs/002-game-start-drawer/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── rooms-scenario2.openapi.yaml
└── tasks.md
```

### Source Code (repository root)

```text
backend/
└── src/
    ├── api/
    │   ├── rooms.ts
    │   ├── schemas.ts
    │   └── schemas.test.ts
    ├── models/
    │   └── game.ts
    ├── seed/
    │   └── starterData.ts
    └── services/
        ├── roomStore.ts
        └── roomStore.test.ts

frontend/
└── src/
    ├── pages/
    │   ├── CreateRoomPage.tsx
    │   ├── JoinRoomPage.tsx
    │   ├── LobbyPage.tsx
    │   └── GamePage.tsx
    ├── services/
    │   ├── api.ts
    │   └── api.test.ts
    ├── state/
    │   └── roomStore.ts
    └── styles/
        └── app.css
```

**Structure Decision**: Keep backend round rules and viewer-specific snapshot
logic in `backend/src/services`, request validation in `backend/src/api`, and
client room/game rendering in `frontend/src/state` and `frontend/src/pages`.
No new top-level packages or app layers are required.

## Phase 0: Research Outcomes

- Trim and validate player names at the backend boundary for both room creation
  and room join so the room store cannot persist whitespace-only names.
- Store round state directly on the room model instead of inventing a separate
  top-level store, because Scenario 2 still operates within a single in-memory
  room lifecycle.
- Extend the existing start-room action so starting the room also initializes the
  round's deterministic drawer and secret word in one atomic transition.
- Use the host as the primary drawer rule and fall back to the first participant
  in room order only if the room's host reference is unusable at round-start
  time.
- Select the secret word deterministically from the starter list using a stable
  room-derived calculation so repeated starts from the same room state yield the
  same word.
- Design room snapshots as viewer-specific: the drawer receives the actual
  secret word while all other players receive only a hidden-word view.

See [research.md](./research.md) for decisions, rationale, and alternatives.

## Phase 1: Design

### Backend Model Changes

- Update [`backend/src/models/game.ts`](../../../backend/src/models/game.ts) to
  introduce a round-state model on the room:
  - drawer participant ID
  - selected secret word
  - round status or active-round presence indicator
- Extend `RoomSnapshot` with viewer-specific game-state fields such as:
  - current drawer participant ID
  - viewer role for the round
  - word visibility state
  - actual secret word only when the viewer is the drawer
- Preserve Scenario 1 host and start metadata so the lobby behavior remains
  intact.

### Backend Validation and Request Changes

- Update [`backend/src/api/schemas.ts`](../../../backend/src/api/schemas.ts) so
  `createRoomSchema` and `joinRoomSchema` trim player names and reject
  whitespace-only values.
- Continue using Zod to normalize and validate room-code inputs and start-room
  requests.
- Keep `POST /rooms/:code/start` as the public start action, but return the
  viewer-specific room snapshot that now contains round-state fields.

### Backend Service Changes

- Update [`backend/src/services/roomStore.ts`](../../../backend/src/services/roomStore.ts)
  to trim accepted player names before participant creation.
- Add deterministic helpers for:
  - selecting the drawer
  - selecting the secret word from `STARTER_WORDS`
  - constructing viewer-specific room snapshots
- Extend `startRoom()` so it:
  - preserves Scenario 1 host-only and minimum-player rules
  - initializes the round state only once when transitioning out of the lobby
  - stores the drawer and selected secret word on the room
- Extend `toRoomSnapshot()` so it reveals the actual word only when the viewer
  matches the drawer.

### Viewer-Specific Response Design

- `RoomSnapshot` remains the only room/game payload returned to the frontend.
- Shared fields visible to all viewers:
  - room code
  - room status
  - host participant ID
  - participants
  - current drawer participant ID
  - viewer host/drawer flags
- Viewer-specific word fields:
  - drawer sees the real selected word
  - non-drawers receive a hidden-word state with no actual word value
- This same viewer-specific snapshot shape should be used for create, join,
  fetch, and start responses so the frontend consumes one consistent contract.

### Start-of-Round State Flow

1. Host starts a valid room from the lobby.
2. Backend validates the caller and minimum-player rule.
3. Backend trims/persists accepted player names already present in the room.
4. Backend selects the drawer deterministically:
   - host first
   - first participant fallback if host reference is unusable
5. Backend selects the secret word deterministically from the starter list.
6. Backend updates the room from lobby-only state to active round state.
7. Backend returns a viewer-specific room snapshot to the caller.
8. Other players load the same room through polling/fetch and receive the same
   drawer and round identity, but only the drawer sees the actual word.

### Frontend Room Store and Page Changes

- Extend [`frontend/src/services/api.ts`](../../../frontend/src/services/api.ts)
  room snapshot types to include round-state and viewer-specific fields.
- Keep [`frontend/src/state/roomStore.ts`](../../../frontend/src/state/roomStore.ts)
  as the single source of room/game state, with no new client-side state library.
- Update [`frontend/src/pages/CreateRoomPage.tsx`](../../../frontend/src/pages/CreateRoomPage.tsx)
  and [`frontend/src/pages/JoinRoomPage.tsx`](../../../frontend/src/pages/JoinRoomPage.tsx)
  to show clear errors for whitespace-only names while preserving current room
  code behavior.
- Update [`frontend/src/pages/LobbyPage.tsx`](../../../frontend/src/pages/LobbyPage.tsx)
  only as needed to reflect trimmed names and the deterministic transition into
  the game route.
- Update [`frontend/src/pages/GamePage.tsx`](../../../frontend/src/pages/GamePage.tsx)
  to:
  - show the drawer identity clearly
  - show the actual secret word only to the drawer
  - show a hidden-word state to non-drawers
  - avoid introducing drawing, guessing, scoring, or result logic
- Update [`frontend/src/styles/app.css`](../../../frontend/src/styles/app.css)
  only as needed for drawer/word visibility states.

### File-Level Change Plan

- `backend/src/models/game.ts`: add round-state and viewer-specific snapshot
  fields
- `backend/src/services/roomStore.ts`: trim names, initialize round state,
  choose drawer/word deterministically, and build viewer-specific snapshots
- `backend/src/services/roomStore.test.ts`: cover trimmed names, whitespace-only
  rejections, deterministic drawer assignment, deterministic word selection, and
  drawer-only word visibility
- `backend/src/api/schemas.ts`: trim/reject invalid player names
- `backend/src/api/schemas.test.ts`: cover trimmed and whitespace-only player
  name validation
- `backend/src/api/rooms.ts`: return viewer-specific snapshots after start and
  preserve clear validation failures
- `frontend/src/services/api.ts`: extend room snapshot types for round state and
  secret-word visibility
- `frontend/src/services/api.test.ts`: cover updated response shapes for create,
  join, fetch, and start
- `frontend/src/state/roomStore.ts`: continue storing the enriched room snapshot
- `frontend/src/pages/CreateRoomPage.tsx`: surface whitespace-only name errors
- `frontend/src/pages/JoinRoomPage.tsx`: surface whitespace-only name errors for
  join
- `frontend/src/pages/LobbyPage.tsx`: preserve correct transition into the game
  state with trimmed names
- `frontend/src/pages/GamePage.tsx`: display drawer identity and viewer-specific
  word visibility
- `frontend/src/styles/app.css`: add drawer/hidden-word presentation states

### Validation Strategy

- Automated backend validation:
  - schema tests for trimmed and whitespace-only name handling
  - room-store tests for deterministic drawer assignment and word selection
  - room-store tests for viewer-specific word visibility and name trimming
- Automated frontend validation:
  - API service tests for updated snapshot shapes across create/join/fetch/start
- Manual two-tab validation:
  - validate trimmed names on create and join
  - validate whitespace-only names are rejected before room entry
  - start the same room and confirm drawer identity is deterministic
  - verify the drawer sees the word and the non-drawer does not
  - repeat the same room-state start path to confirm deterministic word choice

## Complexity Tracking

No constitution exceptions or additional architectural complexity are required
for this feature.

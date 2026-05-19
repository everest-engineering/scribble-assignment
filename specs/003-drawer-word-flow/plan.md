# Implementation Plan: Phase 2 Drawer Word Flow

**Branch**: `003-drawer-word-flow` | **Date**: 2026-05-19 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-drawer-word-flow/spec.md`

**Note**: This plan is filled in by the `/speckit-plan` command and is grounded in
the current Express backend and React frontend starter after Phase 1.

## Summary

Implement Phase 2 game-start and drawer-flow behavior by extending the existing
host-only start transition to create the first round state, assign the host as the
drawer, mark all other room participants as guessers, select the deterministic
starter word `rocket`, and return viewer-specific room snapshots so only the drawer
receives the secret word. The feature stays inside the current in-memory
architecture: backend state remains a `Map<string, Room>`, frontend state remains
the existing Context-backed `RoomStore`, and no live transport, persistence, or
later gameplay systems are introduced.

## Technical Context

**Language/Version**: TypeScript on Node.js backend and React 18 frontend

**Primary Dependencies**: Express, Zod, React Router v6, Vite

**Storage**: In-memory `Map` in `backend/src/services/roomStore.ts`

**Testing**: Existing app builds plus manual two-browser validation; optional
unit-level checks for pure room-snapshot and deterministic-word helpers

**Target Platform**: Local browser clients against a local Node.js HTTP API

**Project Type**: Web application with separate backend and frontend apps

**Performance Goals**: Started-room state appears on both clients on the next room
refresh cycle, with drawer identity and word visibility consistent immediately
after start

**Constraints**: No WebSockets, no persistence, no authentication, no timers, no
multiple rounds, no drawer rotation, no custom or random word packs, no Phase 3+
guessing or scoring logic

**Scale/Scope**: Small classroom multiplayer sessions with multiple concurrent rooms
and a handful of players per room

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Pass: backend and frontend contracts remain fully typed; new round-state fields
  are explicit in both backend models and frontend API/store types.
- Pass: every changed boundary has a validation or contract strategy; Phase 2 does
  not introduce new user-entered payloads, but it does tighten viewer-specific room
  response behavior and start-transition state rules.
- Pass: room state remains minimal and deterministic inside the in-memory service
  layer; the round state is derived from existing participants plus one selected
  starter word.
- Pass: scope remains inside approved Phase 2 behavior only and excludes drawing,
  guessing, scoring, restart, timers, rotation, and persistence.
- Pass: the design includes story-level manual verification plus required app-build
  validation before handoff.

## Project Structure

### Documentation (this feature)

```text
specs/003-drawer-word-flow/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── rooms.yaml
└── tasks.md
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── api/
│   │   ├── rooms.ts
│   │   ├── router.ts
│   │   └── schemas.ts
│   ├── models/
│   │   └── game.ts
│   ├── seed/
│   │   └── starterData.ts
│   └── services/
│       └── roomStore.ts

frontend/
├── src/
│   ├── pages/
│   │   ├── GamePage.tsx
│   │   └── LobbyPage.tsx
│   ├── services/
│   │   └── api.ts
│   └── state/
│       └── roomStore.ts
```

**Structure Decision**: Use the existing monorepo web-app layout. All backend
changes stay within `backend/src/models`, `backend/src/services`, `backend/src/api`,
and the existing starter-word seed file. All frontend changes stay within
`frontend/src/services`, `frontend/src/state`, and the existing lobby/game pages.

## Phase 0 Research

### Decisions

- Decision: represent the first active round directly on `Room` with explicit
  drawer, guesser, and secret-word fields instead of inventing a separate gameplay
  store.
  Rationale: Phase 2 only needs one started round, and the room service already
  owns the authoritative transition from `lobby` to `playing`.
  Alternatives considered: separate round map keyed by room code, frontend-derived
  drawer state only.

- Decision: keep the drawer rule deterministic by assigning the existing host as the
  drawer.
  Rationale: Phase 1 already made the room creator the single start authority, so
  reusing that identity avoids another tie-break rule and keeps manual validation
  simple.
  Alternatives considered: first participant by join time, random drawer selection.

- Decision: keep secret-word selection deterministic by taking the first item from
  `STARTER_WORDS`.
  Rationale: the approved spec explicitly targets deterministic validation and the
  current starter data begins with `rocket`.
  Alternatives considered: random selection, host-selected word, round-robin index.

- Decision: make `toRoomSnapshot(room, viewerParticipantId)` the single place that
  enforces drawer-only visibility.
  Rationale: the current service already centralizes response shaping, and secrecy
  is safest when every create/join/fetch/start response uses the same viewer-aware
  projection rule.
  Alternatives considered: frontend hiding only, per-route conditional response
  logic.

- Decision: omit the secret-word field entirely for guesser-visible room data
  instead of returning `null`, an empty string, or a masked placeholder.
  Rationale: this is the clarified Phase 2 rule and produces the clearest contract
  boundary for privacy testing.
  Alternatives considered: nullable field, masked field.

## Phase 1 Design

### State Model Changes

- Backend `Participant` in
  [backend/src/models/game.ts](/Users/salauddin/Projects/learning/everest-training/spec-kit/final/demo/scribble-assignment/backend/src/models/game.ts)
  keeps the Phase 1 lobby role (`host | player`) for ownership/history, while the
  started round introduces separate round-role state for `drawer | guesser`.
- Backend `Room` gains explicit Phase 2 round-state fields:
  `drawerId`, `guesserIds`, and `secretWord`.
- Backend `RoomSnapshot` becomes viewer-specific:
  all players receive the same room status, host identity, participant roster, and
  drawer identity; only the drawer-visible snapshot includes `secretWord`.
- Backend functions updated in
  [backend/src/services/roomStore.ts](/Users/salauddin/Projects/learning/everest-training/spec-kit/final/demo/scribble-assignment/backend/src/services/roomStore.ts):
  `startRoom` now assigns drawer/guesser state and the deterministic word; the
  snapshot builder uses `viewerParticipantId` instead of ignoring it.
- Frontend `RoomSnapshot` in
  [frontend/src/services/api.ts](/Users/salauddin/Projects/learning/everest-training/spec-kit/final/demo/scribble-assignment/frontend/src/services/api.ts)
  widens to include started-round information:
  `drawerId`, round-role view, and an optional drawer-only `secretWord`.
- Frontend `RoomStore` in
  [frontend/src/state/roomStore.ts](/Users/salauddin/Projects/learning/everest-training/spec-kit/final/demo/scribble-assignment/frontend/src/state/roomStore.ts)
  derives game-facing state such as `viewerRoundRole`, `drawerName`, `isDrawer`,
  and whether a visible `secretWord` is expected.

### File-Level Changes

- [backend/src/models/game.ts](/Users/salauddin/Projects/learning/everest-training/spec-kit/final/demo/scribble-assignment/backend/src/models/game.ts)
  Add explicit started-round fields to `Room`, add drawer/guesser concepts to the
  snapshot contract, and model the drawer-only secret word as optional in the
  viewer-specific snapshot.

- [backend/src/services/roomStore.ts](/Users/salauddin/Projects/learning/everest-training/spec-kit/final/demo/scribble-assignment/backend/src/services/roomStore.ts)
  Add deterministic helpers for selecting the Phase 2 word and computing started
  round roles; update `startRoom` to assign `drawerId`, populate `guesserIds`, set
  `secretWord`, and persist them with the `playing` transition; update
  `toRoomSnapshot` so guessers never receive the secret-word field.

- [backend/src/api/rooms.ts](/Users/salauddin/Projects/learning/everest-training/spec-kit/final/demo/scribble-assignment/backend/src/api/rooms.ts)
  Keep the same endpoints from Phase 1, but ensure create/join/fetch/start all
  return the new viewer-specific snapshot shape and pass through `participantId`
  consistently wherever a room response is built.

- [backend/src/api/schemas.ts](/Users/salauddin/Projects/learning/everest-training/spec-kit/final/demo/scribble-assignment/backend/src/api/schemas.ts)
  Preserve the Phase 1 validation rules; no new end-user input fields are required,
  but the plan should confirm `participantId` remains required for room start and
  optional for room fetch.

- [backend/src/seed/starterData.ts](/Users/salauddin/Projects/learning/everest-training/spec-kit/final/demo/scribble-assignment/backend/src/seed/starterData.ts)
  Keep the starter list unchanged and document that Phase 2 consumes the first word
  deterministically rather than exposing the full list as a gameplay payload.

- [frontend/src/services/api.ts](/Users/salauddin/Projects/learning/everest-training/spec-kit/final/demo/scribble-assignment/frontend/src/services/api.ts)
  Update `RoomSnapshot` and related API response types to match the new backend
  contract, especially the optional drawer-only `secretWord` and explicit
  `drawerId`.

- [frontend/src/state/roomStore.ts](/Users/salauddin/Projects/learning/everest-training/spec-kit/final/demo/scribble-assignment/frontend/src/state/roomStore.ts)
  Extend derived state from the snapshot so the UI can identify the drawer by name,
  determine whether the viewer is a drawer or guesser, and preserve Phase 1 polling
  behavior for the lobby-to-game transition.

- [frontend/src/pages/LobbyPage.tsx](/Users/salauddin/Projects/learning/everest-training/spec-kit/final/demo/scribble-assignment/frontend/src/pages/LobbyPage.tsx)
  Keep the Phase 1 start flow, but ensure the lobby transition still routes players
  into `/game` once the started-room snapshot includes the new round state.

- [frontend/src/pages/GamePage.tsx](/Users/salauddin/Projects/learning/everest-training/spec-kit/final/demo/scribble-assignment/frontend/src/pages/GamePage.tsx)
  Replace the generic placeholder player-info panel with explicit started-round
  information: show the assigned drawer identity to everyone, show the secret word
  only when the viewer is the drawer, and avoid any guesser-visible fallback that
  would imply the secret word field exists.

### API Contract Changes

- `POST /rooms`
  Response still returns `{ participantId, room }`, and the `room` snapshot remains
  a lobby snapshot for the newly created host session.

- `POST /rooms/:code/join`
  Contract stays the same for Phase 2. Joined players still receive a lobby
  snapshot, and joins remain limited to lobby rooms only.

- `GET /rooms/:code`
  Query remains `participantId?: string`.
  Response now becomes meaningfully viewer-specific for playing rooms:
  `drawerId` is visible to everyone; `secretWord` is present only when the viewer is
  the drawer and omitted otherwise.

- `POST /rooms/:code/start`
  Request stays `{ "participantId": string }`.
  Success response remains `{ room }`, but Phase 2 extends the transition so the
  returned room snapshot includes the assigned drawer and drawer-only word.
  Error codes stay aligned with Phase 1: `404`, `403`, `409`, `422`.

### Data Flow

- Start flow
  Host clicks `Start Game` in the Phase 1 lobby.
  `POST /rooms/:code/start` validates the existing Phase 1 rules, then assigns the
  host as `drawer`, all others as `guesser`, selects `rocket`, persists the started
  room state, and returns a viewer-specific snapshot to the host.

- Non-host transition
  Non-host players remain in the existing lobby polling loop until `GET /rooms/:code`
  returns `status: "playing"` plus the started-round metadata.
  On that next poll, they route to `/game`, see the same drawer identity, and do
  not receive any secret-word field.

- Viewer-specific snapshot projection
  `toRoomSnapshot(room, viewerParticipantId)` becomes the only contract shaper.
  If `viewerParticipantId === room.drawerId`, the snapshot includes `secretWord`.
  Otherwise, the snapshot omits `secretWord`.

- Game-page rendering
  `RoomStore` and `GamePage` derive the visible drawer name and viewer role from
  `participantId`, `drawerId`, and the participant roster already in state.
  The drawer sees the selected word; guessers see only drawer identity and started
  status.

## Verification Strategy

- Backend build: `cd backend && npm run build`
- Frontend build: `cd frontend && npm run build`
- Story 1 manual validation: start a two-player room and confirm both clients show
  the same drawer identity, with host as drawer and non-host as guesser.
- Story 2 manual validation: start multiple fresh rooms and confirm each started
  round uses `rocket`.
- Story 3 manual validation: compare drawer and guesser views plus direct room
  refreshes and confirm only the drawer receives a secret word.
- Optional unit-level checks: deterministic word helper, drawer/guesser assignment
  helper, and viewer-specific snapshot projection.

## Post-Design Constitution Check

- Pass: the design keeps contracts typed across backend models, API responses, and
  frontend state with no hidden or implicit round fields.
- Pass: the only new behavior boundary is the viewer-specific room snapshot, and it
  is explicitly centralized rather than scattered across routes or components.
- Pass: round state remains minimal, deterministic, and room-local: one drawer,
  many guessers, one starter word.
- Pass: the feature stays within Phase 2 scope and does not pull in later gameplay
  systems.
- Pass: verification remains story-first with required app builds and explicit
  multiplayer manual checks.

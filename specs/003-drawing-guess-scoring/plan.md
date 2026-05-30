# Implementation Plan: Scenario 3 Gameplay Interaction

**Branch**: `assignment` | **Date**: 2026-05-30 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-drawing-guess-scoring/spec.md`

**Note**: This plan is limited to Scenario 3 gameplay interaction behavior.

## Summary

Extend the existing Scenario 2 active-round flow so the drawer can produce and
clear shared drawing data, guessers can submit trimmed guesses with blank-input
rejection, accepted guesses are evaluated case-insensitively against the active
secret word, and score outcomes are assigned deterministically as 100 for
correct guesses and 0 for incorrect guesses. The backend remains authoritative
for drawing permissions, guess validation, history ordering, and scoring, while
the frontend game view consumes richer room snapshots that show canvas state,
guess history, score totals, and viewer-specific drawing or guessing controls.

## Technical Context

**Language/Version**: TypeScript 5.x on Node.js 18+ (backend) and React 18
with Vite (frontend)

**Primary Dependencies**: Express, Zod, React, React Router, Vite, Vitest

**Storage**: In-memory room and game state only

**Testing**: `cd backend && npm test`, `cd frontend && npm test`, plus manual
two-tab browser validation for multiplayer flows

**Target Platform**: Node.js backend and modern desktop browser clients

**Project Type**: Monorepo web application (`backend/` + `frontend/`)

**Performance Goals**: Canvas, guess-history, and score changes should appear to
other tabs within one polling interval after each action, with a default target
of about 2 seconds for cross-tab convergence

**Constraints**: HTTP polling only; no WebSockets; no database/persistence; no
authentication/session layer; keep room memory footprint minimal; preserve the
starter architecture; keep scope strictly to Scenario 3

**Scale/Scope**: Small multiplayer rooms running a single active round with
shared drawing, guess history, and deterministic scoring validated in local
multi-tab testing

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

**Post-Design Re-Check**: Pass. The design keeps Scenario 1 and Scenario 2
contracts intact, extends the same room-scoped in-memory state with drawing and
guess history only, continues using polling-driven synchronization, and limits
new gameplay behavior to canvas mutation, guess evaluation, and deterministic
scoring without crossing into result or restart flows.

## Project Structure

### Documentation (this feature)

```text
specs/003-drawing-guess-scoring/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── rooms-scenario3.openapi.yaml
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
    └── services/
        ├── roomStore.ts
        └── roomStore.test.ts

frontend/
└── src/
    ├── components/
    │   ├── DrawingSurface.tsx
    │   └── GuessForm.tsx
    ├── pages/
    │   └── GamePage.tsx
    ├── services/
    │   ├── api.ts
    │   └── api.test.ts
    ├── state/
    │   └── roomStore.ts
    └── styles/
        └── app.css
```

**Structure Decision**: Keep backend gameplay rules, drawing state, guess
evaluation, and scoring in `backend/src/services`, request validation in
`backend/src/api`, and client drawing/guess UI state orchestration in
`frontend/src/state`, `frontend/src/pages`, and one focused reusable drawing
component under `frontend/src/components`. No new package, realtime layer, or
client state library is required.

## Phase 0: Research Outcomes

- Store drawing state directly inside the active round on the room model so the
  canvas, guess history, and scores remain part of one atomic room snapshot.
- Represent the drawing surface as an ordered collection of normalized strokes
  so the backend can stay UI-agnostic while the frontend renders the same data
  in different screen sizes.
- Keep drawing, clear-canvas, and guess submission on the existing rooms router
  as room-scoped actions that return the latest viewer-specific room snapshot.
- Trim and validate guesses at the backend boundary, reject whitespace-only
  guesses, and reject drawer guess submissions so the player who already knows
  the word cannot generate guess history noise.
- Evaluate accepted guesses with case-insensitive matching against the active
  secret word and assign the score outcome at submission time so repeated room
  fetches always return stable history and totals.
- Extend viewer-specific room snapshots to include canvas state, guess history,
  viewer drawing/guessing permissions, and score totals while preserving
  drawer-only secret-word visibility from Scenario 2.

See [research.md](./research.md) for decisions, rationale, and alternatives.

## Phase 1: Design

### Backend Model Changes

- Update [`backend/src/models/game.ts`](../../../backend/src/models/game.ts) to
  extend active round state with:
  - shared canvas state
  - accepted guess history
  - per-participant score totals
- Extend `Participant` or participant-adjacent room data to expose running
  score totals in active gameplay snapshots.
- Extend `RoomSnapshot` with gameplay-specific shared and viewer-specific fields
  such as:
  - canvas state
  - guess history entries
  - viewer can-draw / can-guess flags
  - shared score totals
- Preserve Scenario 2 drawer assignment and secret-word visibility rules.

### Drawing-State Representation

- Represent canvas data as ordered strokes rather than raw bitmap payloads.
- Each stroke should carry:
  - a stable stroke identifier
  - ordered normalized points
  - drawer participant ID
  - creation timestamp
- Canvas clear should be modeled as replacing the stored stroke list with an
  empty list and updating room timestamps, not as a separate result state.
- Normalized coordinate storage keeps the backend independent from exact client
  canvas pixel size while allowing consistent redraw after polling refreshes.

### Backend Validation and Request Changes

- Update [`backend/src/api/schemas.ts`](../../../backend/src/api/schemas.ts) to
  add request schemas for:
  - drawing-stroke submission
  - clear-canvas action
  - guess submission
- Continue using Zod to trim guess text and reject empty or whitespace-only
  guesses before they reach the room store.
- Keep room-code and participant ID validation consistent with earlier
  scenarios.

### Backend Service Changes

- Update [`backend/src/services/roomStore.ts`](../../../backend/src/services/roomStore.ts)
  to add deterministic helpers for:
  - adding a stroke to the active canvas
  - clearing the active canvas
  - normalizing and evaluating guesses
  - awarding score outcomes and updating totals
  - constructing gameplay-aware viewer snapshots
- Add backend enforcement so:
  - only the assigned drawer can mutate or clear the canvas
  - only non-drawers can submit guesses
  - rejected guesses never enter shared history
- Keep all Scenario 3 state transitions room-scoped and isolated so actions in
  one room never affect another active room.

### Guess-History and Scoring Flow

1. A room is already in the Scenario 2 playing state with an assigned drawer and
   secret word.
2. The drawer submits one or more drawing strokes; the backend appends them to
   the active canvas state.
3. The drawer may clear the canvas; the backend replaces the stored strokes with
   an empty list.
4. A non-drawer submits a guess.
5. Backend trims the guess and rejects it if the result is empty.
6. Backend normalizes the trimmed guess and compares it to the secret word
   without requiring exact casing.
7. Backend appends an accepted guess-history entry in submission order.
8. Backend assigns `100` for a correct guess and `0` for an incorrect guess,
   updating the participant's running score total.
9. Backend returns the latest viewer-specific room snapshot to the submitter,
   while other players observe the same shared history and totals through
   polling.

### Viewer-Specific Gameplay Behavior

- `RoomSnapshot` remains the only room/game payload returned to the frontend.
- Shared fields visible to all viewers:
  - room code and status
  - participants and score totals
  - drawer identity
  - canvas state
  - guess history and score outcomes
- Viewer-specific gameplay fields:
  - drawer keeps secret-word visibility from Scenario 2
  - `viewerCanDraw` is true only for the drawer in an active round
  - `viewerCanGuess` is true only for non-drawers in an active round
- This same enriched snapshot shape should be used for fetch, start, drawing,
  clear, and guess responses so the frontend consumes one consistent contract.

### Frontend Room Store and Page Changes

- Extend [`frontend/src/services/api.ts`](../../../frontend/src/services/api.ts)
  room snapshot types to include canvas state, guess history, score totals, and
  drawing / guessing permissions.
- Add frontend API calls for:
  - drawing-stroke submission
  - clear-canvas action
  - guess submission
- Keep [`frontend/src/state/roomStore.ts`](../../../frontend/src/state/roomStore.ts)
  as the single source of room and game state, adding action methods for the new
  room-scoped gameplay mutations.
- Add a focused drawing component such as
  [`frontend/src/components/DrawingSurface.tsx`](../../../frontend/src/components/DrawingSurface.tsx)
  to capture pointer input for the drawer and render shared strokes for all
  viewers.
- Update [`frontend/src/components/GuessForm.tsx`](../../../frontend/src/components/GuessForm.tsx)
  so it submits trimmed guesses and surfaces empty-guess errors cleanly.
- Update [`frontend/src/pages/GamePage.tsx`](../../../frontend/src/pages/GamePage.tsx)
  to:
  - render the shared drawing surface
  - show clear-canvas control only to the drawer
  - show guess submission only to eligible guessers
  - show synced guess history and score outcomes
  - avoid introducing result-state or restart UI
- Update [`frontend/src/styles/app.css`](../../../frontend/src/styles/app.css)
  only as needed for canvas layout, guess history, scoring, and role-specific
  controls.

### File-Level Change Plan

- `backend/src/models/game.ts`: add canvas, guess-history, viewer-permission,
  and score-related types
- `backend/src/services/roomStore.ts`: implement drawing mutation, clear-canvas,
  guess evaluation, score assignment, and enriched room snapshots
- `backend/src/services/roomStore.test.ts`: cover drawer-only drawing,
  clear-canvas behavior, guess trimming, empty-guess rejection, case-insensitive
  matching, room isolation, and deterministic score outcomes
- `backend/src/api/schemas.ts`: add request schemas for drawing, clearing, and
  guess submission
- `backend/src/api/schemas.test.ts`: cover drawing/guess request validation and
  trimmed empty-guess rejection
- `backend/src/api/rooms.ts`: add new room-scoped gameplay routes and return
  enriched viewer-specific snapshots
- `frontend/src/services/api.ts`: extend room snapshot types and add gameplay
  action methods
- `frontend/src/services/api.test.ts`: cover the new drawing, clear, and guess
  request contracts plus updated playing-room snapshots
- `frontend/src/state/roomStore.ts`: add canvas, clear, and guess action wiring
- `frontend/src/components/DrawingSurface.tsx`: render shared strokes and emit
  drawer-only pointer input
- `frontend/src/components/GuessForm.tsx`: submit guesses and present validation
  feedback
- `frontend/src/pages/GamePage.tsx`: integrate drawing controls, guess flow,
  score totals, and guess history
- `frontend/src/styles/app.css`: add gameplay interaction, history, and score
  presentation states

### Validation Strategy

- Automated backend validation:
  - schema tests for drawing, clear-canvas, and guess request validation
  - room-store tests for drawer-only drawing enforcement
  - room-store tests for empty-guess rejection and case-insensitive matching
  - room-store tests for deterministic 100-or-0 score assignment and room
    isolation
- Automated frontend validation:
  - API service tests for drawing, clear, and guess actions
  - API service tests for enriched gameplay snapshot shapes
- Manual two-tab validation:
  - start a room and confirm only the drawer can draw
  - clear the canvas from the drawer tab and confirm both tabs see the reset
  - submit blank, incorrect, and correct guesses from a non-drawer tab
  - confirm guess history stays in sync within the polling interval
  - confirm correct guesses add 100 points, incorrect guesses add 0, and both
    tabs show the same totals

## Complexity Tracking

No constitution exceptions or additional architectural complexity are required
for this feature.

# Implementation Plan: Game Start & Drawer Flow

**Branch**: `scribble-lab` | **Date**: 2026-06-10 | **Spec**: [./spec.md](./spec.md)

**Input**: Feature specification from `specs/002-game-start-drawer/spec.md`

## Summary

Extend the room model with a `Round` so that when the host successfully starts the game (already wired in `001-room-setup-lobby`), the room transitions from `status: "lobby"` to `status: "round"` carrying `{ roundNumber: 1, drawerParticipantId, secretWord }`. The host becomes the drawer for round 1; the secret word is selected deterministically as `availableWords[(N-1) mod N]` (round 1 → `"rocket"` against the current seed); the server-side snapshot strips `secretWord` from any non-drawer viewer's payload and replaces it with a `maskedWord` length indicator. The Start endpoint becomes idempotent once a round is active. Frontend renders a viewer-aware round view inside the existing `LobbyPage` — drawer sees the word, guessers see the mask, both see a "Round 1 — [drawer] is drawing" banner. No new dependencies, no new top-level routes; existing polling hook drives the in-round refresh at the same ~2s cadence.

## Technical Context

**Language/Version**: TypeScript 5.6 (strict), Node 20 (backend), Vite + React 18 (frontend) — unchanged from `001`.

**Primary Dependencies**: Express 4, Zod 3, `tsx` (backend dev). React 18, React Router 6 (frontend). Vitest on both sides. No new dependencies introduced by this feature.

**Storage**: In-memory `Map<RoomCode, Room>` in `backend/src/services/roomStore.ts`, identical to `001`. `Round` lives as a nullable field on the existing `Room` value.

**Testing**: Vitest. Backend covers `roomStore` (round assignment, determinism, idempotency) and `rooms.ts` route (snapshot shape for drawer vs guesser, idempotent Start). Frontend covers `getRoundViewState` helper (pure), `api.ts` round-snapshot type guards, and a thin RoundView render check.

**Target Platform**: Local dev — backend on `:3001`, frontend on `:5173`. Same as `001`.

**Project Type**: Web application (`backend/` + `frontend/`), already established.

**Performance Goals**: ~2s polling cadence already enforced by `001`. No additional perf budget required; this feature is one extra field on the existing snapshot endpoint.

**Constraints**: No WebSockets, no DB, no auth — all carried over from the constitution. The cleartext secret word MUST NOT appear in any non-drawer payload (server-side filter), satisfying FR-005.

**Scale/Scope**: Same lab-scale envelope (≤10 rooms, ≤8 participants/room in practice).

## Constitution Check

*Re-evaluating each principle in `.specify/memory/constitution.md` for this feature.*

| # | Principle | Status | Notes |
|---|---|---|---|
| I | Lab-Scope Discipline | **PASS** | Single round only. No drawer rotation (host stays drawer), no timers, no custom word packs, no round 2. Strictly inside the in-scope envelope. |
| II | Polling-Only, In-Memory, Stateless | **PASS** | `Round` lives on the existing in-memory `Room`. No new endpoints with push semantics. Drawer's word view updates on the same ~2s poll. |
| III | TypeScript-First with Zod-Validated Boundaries | **PASS** | Adds a `Round` interface in `backend/src/models/game.ts`; extends `RoomSnapshot` and `ParticipantView`. `POST /:code/start` already has `startRoomSchema`; no new mutating endpoints. The drawer-filter logic happens inside `toRoomSnapshot`, not at the route boundary, but the snapshot's TypeScript type makes the omission discriminable. |
| IV | Extend, Don't Replace | **PASS** | Extends `Room`, `ParticipantView`, `RoomSnapshot`, `roomStore.startRoom`, `LobbyPage`. No new top-level dependencies, no new state library, no new router. RoundView is a new component but lives under `frontend/src/components/`, matching existing module layout. |
| V | Spec-First, Traceable Slices | **PASS** | Every code change in `tasks.md` will cite an `FR-###` from this spec or the carried-forward `001` FRs. Tests are mandatory for the visibility-leak guard (FR-005), determinism (FR-004), and idempotency (FR-007). No existing tests will be weakened. |

No DEVIATE entries. Complexity Tracking section below is intentionally empty.

### Post-design re-check (after Phase 1 artifacts)

After writing `research.md`, `data-model.md`, `contracts/rooms-api.md`, and `quickstart.md`, all five principles still **PASS** with no additional concessions:

- **I**: artifacts confirm single-round, single-drawer scope; no rotation/timers/packs introduced anywhere.
- **II**: `Round` lives on the in-memory `Room`; no new endpoints; polling unchanged.
- **III**: `RoomSnapshot`/`ParticipantView` deltas typed in both packages; `secretWord?` carries the visibility rule in the type system; route boundary unchanged so `startRoomSchema` continues to gate input.
- **IV**: zero new dependencies, zero new routes, zero new state libraries. Only one new file per side (`RoundView.tsx` + test) inside existing module folders.
- **V**: every FR in the spec maps to at least one task surface (data-model + contract + quickstart scenario); `tasks.md` to be generated by `/speckit.tasks` will inherit the FR citations.

## Project Structure

### Documentation (this feature)

```text
specs/002-game-start-drawer/
├── plan.md              # This file
├── research.md          # Phase 0: decisions on word selection, snapshot filtering, idempotency
├── data-model.md        # Phase 1: Round + extended Room/ParticipantView/RoomSnapshot
├── quickstart.md        # Phase 1: runnable curl + 2-tab UI scenarios for US1, US2, US3
├── contracts/
│   └── rooms-api.md     # Phase 1: extends 001's contract with in-round snapshot shape
├── checklists/
│   └── requirements.md  # (already created by /speckit.specify)
└── tasks.md             # Phase 2 — created by /speckit.tasks, NOT here
```

### Source Code (repository root)

Working tree as it exists today (the layout the lab requires us to extend):

```text
backend/src/
├── api/
│   ├── rooms.ts           # POST /rooms/:code/start already exists from 001
│   ├── rooms.test.ts      # extend with: drawer snapshot / guesser snapshot / idempotent start
│   ├── schemas.ts         # no new schemas needed (startRoomSchema already covers it)
│   └── schemas.test.ts
├── models/
│   └── game.ts            # add Round, extend Room + RoomSnapshot + ParticipantView
├── services/
│   ├── roomStore.ts       # extend startRoom for idempotency + word selection; extend toRoomSnapshot for drawer-only filter; export new pure `selectWordForRound(words, n)` helper
│   └── roomStore.test.ts  # extend with: determinism, idempotency, word leakage, snapshot shape per viewer
└── seed/
    └── starterData.ts     # STARTER_WORDS stays here; no move needed — selection logic lives next to the store

frontend/src/
├── components/
│   ├── RoundView.tsx (new)        # the drawer-vs-guesser in-round panel
│   └── RoundView.test.tsx (new)   # pure render check around getRoundViewState
├── hooks/
│   └── useLobbyPolling.ts         # unchanged — already polls during the round
├── pages/
│   └── LobbyPage.tsx              # conditionally renders <RoundView /> when room.round != null
├── services/
│   └── api.ts                     # extend RoomSnapshot with round + maskedWord + secretWord?
└── state/
    └── roomStore.ts               # unchanged — already swallows transient errors and rehydrates
```

**Structure Decision**: stay with the existing two-package web layout. The new `services/words.ts` on the backend and the new `components/RoundView.tsx` on the frontend slot into module folders that already exist in the constitutional layout (Principle IV). No new top-level directory.

## Complexity Tracking

> Empty: Constitution Check passed with no DEVIATE entries.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|

